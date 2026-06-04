"""Type-check every TypeScript snippet in the mailchannels-js skill.

For each Markdown file under `.agents/skills/mailchannels-js/`:

1. Extract every fenced TypeScript code block (```ts … ``` or ```typescript … ```).
2. Strip boilerplate lines that would conflict with or duplicate the preamble:
   - `import … from 'mailchannels-sdk'` — preamble provides all SDK exports.
   - `import process from 'node:process'` — preamble provides `process`.
   - `import … from 'vitest'` — preamble provides test globals.
   - `let mc: MailChannels` at top level — preamble declares `mc`.
   Also substitute the documentation placeholder `{ ... }` (an empty object
   literal with an ellipsis) with `message` so snippets written as
   `mc.emails.queue({ ... })` round-trip through the type-checker.
3. Concatenate the surviving blocks for that file into a single TypeScript
   source so cross-block references resolve (e.g. a variable defined in
   block 1 and used in block 2).
4. Prepend a fixed preamble that defines standard "dummy" names so
   documentation can reference them without inline boilerplate. See
   "Documentation Dummies" below.
5. Write the assembled source to a temporary `.ts` file in the project root
   alongside a temporary `tsconfig.json` that maps `mailchannels-sdk` to
   the local source tree.
6. Run `tsc` (project-local preferred, system fallback) with the temp config
   and report failures, attributing errors back to the source Markdown file.

Exit code is `0` when every file's snippets pass, `1` otherwise.

## Documentation Dummies

Snippets may freely reference these names; the script's preamble defines
them with correct types so doc authors don't have to litter examples with
boilerplate. Use the same names across resources for consistency:

- `mc: MailChannels` — a pre-built client instance.
- `message` — a pre-typed `EmailsSendOptions` payload for use as
  `mc.emails.queue(message)` without spelling out all required fields.
- `process.env.*` — typed as `Record<string, string>` (never undefined)
  so snippets don't need `!` assertions for env-var lookups.
- `apiKey: string` — opaque string API key.
- `keyId: string` — webhook signing key identifier.
- `rawBody: string` — raw HTTP request body string for webhook verification.
- `headers: Record<string, string>` — incoming request headers.
- `iCalString: string` — an iCalendar string for `text/calendar` content.
- `bytes: Uint8Array` — raw byte buffer for attachment helpers.
- `arrayBuffer: ArrayBuffer` — an ArrayBuffer for attachment helpers.
- `csvBytes: number[]` — byte array used with `new Uint8Array([...csvBytes])`.
- `recordLatency(path, ms)` — stub for custom transport instrumentation.
- `recordError(path)` — stub for custom transport instrumentation.

Run with `--show-source` to print the assembled TypeScript before checking;
useful when an error message points at a line you'd like to inspect.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[1]
SKILL_DIR = ROOT / ".agents" / "skills" / "mailchannels-js"

TS_BLOCK = re.compile(
    r"^```(?:ts|typescript)[ \t]*\n(?P<body>.*?)\n^```[ \t]*$",
    re.DOTALL | re.MULTILINE,
)
# { ... } with optional surrounding whitespace — documentation placeholder
# for an omitted object argument. Does NOT match spread syntax ({ ...obj }).
PLACEHOLDER = re.compile(r"\{\s*\.\.\.\s*\}")

# Lines stripped entirely from blocks before assembly.
_STRIP_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^import\s.*from\s+['\"]mailchannels-sdk['\"]"),
    re.compile(r"^import\s+process\s+from\s+['\"]node:process['\"]"),
    re.compile(r"^import\s.*from\s+['\"]vitest['\"]"),
    re.compile(r"^let\s+mc\s*:\s*MailChannels\b"),
]

# Auto-injected scaffolding prepended to every assembled snippet group.
# Keep this in sync with the "Documentation Dummies" section of the module
# docstring above.
PREAMBLE = """\
// Auto-injected preamble for documentation snippet type-checking.
import { MailChannels, Attachment, MailChannelsClient, Webhooks } from 'mailchannels-sdk'
import type { EmailsSendAttachment, ErrorResponse } from 'mailchannels-sdk'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// process, Buffer, and FetchOptions are stubbed rather than imported so the
// checker works without a full node_modules install (@types/node / ofetch absent).
// TODO: Update this script to work correctly with node install so we don't have to stub
declare const process: { env: Record<string, string> }
declare const Buffer: {
  from(data: Uint8Array | ArrayBuffer | number[] | string, encoding?: string): { toString(encoding?: string): string }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type FetchOptions<_T = unknown> = Record<string, unknown>

let mc = new MailChannels('dummy-api-key')
const message = {} as Parameters<typeof mc.emails.queue>[0]

declare const apiKey: string
declare const controller: AbortController
declare const storedKeyId: number
declare const storedPasswordId: number
declare const keyId: string
declare const rawBody: string
declare const headers: Record<string, string>
declare const iCalString: string
declare const bytes: Uint8Array
declare const arrayBuffer: ArrayBuffer
declare const csvBytes: number[]
declare const blob1: Blob
declare const blob2: Blob
declare function recordLatency(path: string, ms: number): void
declare function recordError(path: string): void

// Stubs for Express-style HTTP handler examples.
// TODO: either import express or give a different example so these can be verified properly
interface _Req { body: { toString(): string }; headers: Record<string, string> }
interface _Res { status(code: number): _Res; send(body: string): void; sendStatus(code: number): void }
type _Middleware = (req: _Req, res: _Res, next: () => void) => void
declare const app: { post(path: string, middleware: _Middleware, handler: (req: _Req, res: _Res) => Promise<void> | void): void }
declare const express: { raw(opts: { type: string }): _Middleware }
"""

_TSCONFIG: dict = {
    "compilerOptions": {
        "noEmit": True,
        "strict": True,
        "target": "es2022",
        "module": "esnext",
        "moduleResolution": "bundler",
        "esModuleInterop": True,
        "skipLibCheck": True,
        "verbatimModuleSyntax": True,
        "paths": {
            "mailchannels-sdk": ["./src/mailchannels.ts"],
        },
    },
}


@dataclass(frozen=True)
class Block:
    """TypeScript code block extracted from a Markdown file."""
    body: str
    """1-based Markdown line of the first line *inside* the ```ts fence."""
    start_line: int


@dataclass(frozen=True)
class SourceLine:
    """Line of assembled TypeScript with its origin in the source Markdown."""
    text: str
    """1-based Markdown source line, or None for synthetic scaffolding."""
    md_line: int | None


@dataclass(frozen=True)
class AssembledSource:
    """Synthesized TypeScript source for one Markdown file, with a line-origin map."""
    source: str
    """1-based TypeScript line → 1-based Markdown line, or None for synthetic lines."""
    ts_to_md: tuple[int | None, ...]


@dataclass(frozen=True)
class TscResult:
    """Outcome of running tsc on one assembled snippet group."""
    returncode: int
    output: str


def extract_blocks(markdown: str) -> list[Block]:
    """Extract all fenced ```ts / ```typescript blocks from *markdown*.

    `Block.start_line` points at the first line *inside* the opening fence —
    the same place tsc lands when it reports an error on the snippet's first
    line.
    """
    blocks: list[Block] = []
    for match in TS_BLOCK.finditer(markdown):
        body = match.group("body")
        opening_fence_line = markdown.count("\n", 0, match.start()) + 1
        blocks.append(Block(body=body, start_line=opening_fence_line + 1))
    return blocks

def _process_line(line: str) -> str | None:
    """Return the processed line, or None to discard it.

    Strips boilerplate that would conflict with the preamble. 
    """
    for pattern in _STRIP_PATTERNS:
        if pattern.match(line):
            return None
    return line


def assemble(blocks: list[Block]) -> AssembledSource:
    """Concatenate blocks into one TypeScript source plus a ts→markdown line map.

    The result has two layers: the fixed `PREAMBLE` (module scope), and the
    body assembled from `blocks`. `AssembledSource.ts_to_md[i]` is the
    1-based Markdown line for TypeScript line `i` (1-based), or `None` for
    synthetic lines (preamble, block separators).
    """
    lines: list[SourceLine] = []

    # Layer 1 — preamble (always module-scope).
    for preamble_line in PREAMBLE.splitlines():
        lines.append(SourceLine(text=preamble_line, md_line=None))

    # Layer 2 — body collected from the snippet blocks.
    # Each block is wrapped in an async IIFE so that:
    #   • const/let re-declarations across blocks don't conflict
    #   • `return` statements (common in error-handling examples) are valid
    #   • `await` expressions remain valid inside the async wrapper
    for index, block in enumerate(blocks):
        if index > 0:
            lines.append(SourceLine(text="", md_line=None))
        lines.append(SourceLine(text=";(async () => {", md_line=None))
        cleaned = PLACEHOLDER.sub("message", block.body).splitlines()
        for offset, text in enumerate(cleaned):
            processed = _process_line(text)
            if processed is not None:
                lines.append(SourceLine(text=processed, md_line=block.start_line + offset))
        lines.append(SourceLine(text="})()", md_line=None))

    source = "\n".join(line.text for line in lines) + "\n"
    ts_to_md: tuple[int | None, ...] = (None, *(line.md_line for line in lines))
    return AssembledSource(source=source, ts_to_md=ts_to_md)


def rewrite_line_numbers(
    output: str,
    label: str,
    ts_to_md: tuple[int | None, ...],
) -> str:
    """Substitute tsc's TypeScript line numbers with their Markdown sources.

    tsc emits errors as ``label(line,col): error TSxxxx: …`` after the temp
    file path has been replaced with *label*. This function converts the
    ``(line,col)`` form to ``:mdline:`` pointing back at the Markdown source.
    """
    pattern = re.compile(
        rf"^({re.escape(label)})\((\d+),\d+\):", re.MULTILINE
    )

    def replacement(match: re.Match[str]) -> str:
        ts_line = int(match.group(2))
        if 0 < ts_line < len(ts_to_md):
            md_line = ts_to_md[ts_line]
            if md_line is not None:
                return f"{match.group(1)}:{md_line}:"
        return f"{match.group(1)}:?(ts {ts_line}):"

    return pattern.sub(replacement, output)


def _find_tsc() -> list[str]:
    """Return the tsc command: project-local preferred, system tsc fallback."""
    local = ROOT / "node_modules" / ".bin" / "tsc"
    if local.is_file():
        return [str(local)]
    return ["tsc"]


def run_tsc(source: str, label: str) -> TscResult:
    """Write *source* to a temp .ts file, run tsc with a temp tsconfig, return result."""
    tmp_ts: Path | None = None
    tmp_cfg: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".ts",
            delete=False,
            dir=ROOT,
            prefix="_snippet_check_",
        ) as f:
            f.write(source)
            tmp_ts = Path(f.name)

        # tsconfig lives beside the temp .ts file so relative paths resolve
        # from ROOT — "files" uses just the basename, "paths" uses "./src/…".
        tsconfig = {**_TSCONFIG, "files": [tmp_ts.name]}
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".json",
            delete=False,
            dir=ROOT,
            prefix="_snippet_check_",
        ) as f:
            json.dump(tsconfig, f)
            tmp_cfg = Path(f.name)

        completed = subprocess.run(
            _find_tsc() + ["--project", str(tmp_cfg)],
            capture_output=True,
            text=True,
            cwd=ROOT,
            check=False,
        )
        output = completed.stdout + completed.stderr
        # tsc may emit the absolute path or just the basename; rewrite both
        # so error lines reference the Markdown file instead of the temp file.
        output = output.replace(str(tmp_ts), label)
        output = output.replace(tmp_ts.name, label)
        return TscResult(returncode=completed.returncode, output=output)
    finally:
        if tmp_ts:
            tmp_ts.unlink(missing_ok=True)
        if tmp_cfg:
            tmp_cfg.unlink(missing_ok=True)


def _filter_snippet_errors(output: str, label: str) -> str:
    """Return only error lines that belong to the snippet file.

    tsc follows import chains and emits errors from ``src/*.ts`` (e.g.
    unresolved ``ofetch`` when node_modules aren't fully installed). Those
    are noise for doc checking. Keep only lines whose filename is *label*
    (the Markdown path, after path-replacement and line-number remapping),
    plus any indented context lines that follow a kept primary error line.
    Drop the final ``Found N error(s).`` summary since its count includes
    the filtered-out src errors.
    """
    # Matches tsc's primary error line: "path(line,col): error/warning …"
    # After our replacements the snippet's lines start with label.
    primary_re = re.compile(r"^\S[^\n]*\(\d+,\d+\):")
    # After rewrite_line_numbers the snippet's lines are "label:N: …"
    remapped_re = re.compile(rf"^{re.escape(label)}:")
    summary_re = re.compile(r"^Found \d+ error")

    result: list[str] = []
    keep_context = False

    for line in output.splitlines():
        if summary_re.match(line):
            keep_context = False
            continue
        if primary_re.match(line) or remapped_re.match(line):
            keep_context = line.startswith(label)
            if keep_context:
                result.append(line)
        elif keep_context and (line.startswith("  ") or not line.strip()):
            result.append(line)
        else:
            keep_context = False

    # Strip trailing blank lines.
    while result and not result[-1].strip():
        result.pop()

    return "\n".join(result)


def discover_markdown() -> list[Path]:
    """Return SKILL.md plus every resource Markdown file, in stable order."""
    files: list[Path] = []
    skill_md = SKILL_DIR / "SKILL.md"
    if skill_md.is_file():
        files.append(skill_md)
    resources = SKILL_DIR / "resources"
    if resources.is_dir():
        files.extend(sorted(resources.glob("*.md")))
    return files


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description=(
            "Type-check TypeScript snippets embedded in the mailchannels-js skill."
        )
    )
    parser.add_argument(
        "--show-source",
        action="store_true",
        help="Print the assembled TypeScript source for each file before checking.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Log debug-level messages (e.g. skipped blocks).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Run tsc against every TypeScript snippet under the mailchannels-js skill."""
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(message)s",
    )

    if not SKILL_DIR.is_dir():
        logger.error("Skill directory not found: %s", SKILL_DIR)
        return 2

    md_files = discover_markdown()
    if not md_files:
        logger.error("No Markdown files found under %s", SKILL_DIR)
        return 2

    total_blocks = 0
    failed: list[str] = []

    for md in md_files:
        rel = md.relative_to(ROOT)
        all_blocks = extract_blocks(md.read_text(encoding="utf-8"))

        if not all_blocks:
            logger.info("[skip] %s — no TypeScript blocks", rel)
            continue

        total_blocks += len(all_blocks)
        assembled = assemble(all_blocks)

        if args.show_source:
            logger.info(
                "--- assembled source for %s ---\n%s---", rel, assembled.source
            )

        tsc_result = run_tsc(assembled.source, str(rel))
        output = rewrite_line_numbers(tsc_result.output, str(rel), assembled.ts_to_md)
        snippet_errors = _filter_snippet_errors(output, str(rel))

        if not snippet_errors:
            logger.info(
                "[ ok ] %s (%d block%s)",
                rel, len(all_blocks), "" if len(all_blocks) == 1 else "s",
            )
        else:
            failed.append(str(rel))
            logger.error(
                "[FAIL] %s (%d block%s)\n%s",
                rel, len(all_blocks), "" if len(all_blocks) == 1 else "s",
                snippet_errors,
            )

    logger.info(
        "\nChecked %d file%s / %d block%s. %d failed.",
        len(md_files),
        "" if len(md_files) == 1 else "s",
        total_blocks,
        "" if total_blocks == 1 else "s",
        len(failed),
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
