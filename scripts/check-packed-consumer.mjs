import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

// Install the tarball outside the source tree so development dependencies cannot
// hide missing dependencies in the public declarations. No provider calls.
const root = process.cwd();
const temporary = mkdtempSync(join(tmpdir(), "mailchannels-consumer-"));
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
// The pnpm CI image has no npm binary. Provision the consumer tool explicitly.
const npmArgs = ["--silent", "--package=npm@10.9.9", "dlx", "npm"];
try {
  const packed = JSON.parse(execFileSync(pnpm, [...npmArgs, "pack", "--ignore-scripts", "--json", "--pack-destination", temporary], { cwd: root, encoding: "utf8", shell: process.platform === "win32" }));
  const tarball = resolve(temporary, packed[0].filename);
  writeFileSync(join(temporary, "package.json"), JSON.stringify({
    private: true,
    type: "module",
    dependencies: { "@mailchannels/sdk": `file:${tarball}` },
    devDependencies: { "typescript": "6.0.3", "@types/node": "26.6.3" }
  }));
  execFileSync(pnpm, process.argv.includes("--pnpm") ? ["install", "--config.hoist=false", "--ignore-scripts"] : [...npmArgs, "install", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: temporary, stdio: "inherit", shell: process.platform === "win32" });
  writeFileSync(join(temporary, "consumer.ts"), `
import { MailChannels, MailChannelsClient } from '@mailchannels/sdk';
const sdk = new MailChannels('fixture-only-key');
void sdk.emails.queue({ from: 'sender@example.test', to: 'recipient@example.test', subject: 'Fixture', text: 'Fixture' });
void sdk.emails.send({ from: 'sender@example.test', to: 'recipient@example.test', subject: 'Fixture', text: 'Fixture' }, true);
const client = new MailChannelsClient('fixture-only-key');
void client.post<{ ok: boolean }>('/fixture', {
  query: { test: true },
  onResponse({ response }) { const status: number = response.status; void status; }
});
// @ts-expect-error dryRun is boolean, not a string.
void sdk.emails.send({ from: 'sender@example.test', to: 'recipient@example.test', subject: 'Fixture', text: 'Fixture' }, 'true');
`);
  writeFileSync(join(temporary, "tsconfig.json"), JSON.stringify({ compilerOptions: {
    strict: true, skipLibCheck: false, noEmit: true, target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", types: ["node"]
  },
  files: ["consumer.ts"] }));
  execFileSync(process.execPath, [join(temporary, "node_modules/typescript/bin/tsc"), "-p", join(temporary, "tsconfig.json")], { cwd: temporary, stdio: "inherit" });
  writeFileSync(join(temporary, "smoke.mjs"), `
import assert from "node:assert/strict";
let attempts = 0;
globalThis.fetch = async (url, options) => {
  attempts++;
  assert.equal(new URL(url).pathname, "/tx/v1/send-async");
  assert.equal(new Headers(options.headers).get("X-Api-Key"), "fixture-only-key");
  return new Response(JSON.stringify({ request_id: "fixture-request", queued_at: "2026-10-07T00:00:00Z" }), { status: 202, headers: { "Content-Type": "application/json" } });
};
const { MailChannels } = await import("@mailchannels/sdk");
const client = new MailChannels("fixture-only-key");
const result = await client.emails.queue({ from: "sender@example.test", to: "recipient@example.test", subject: "Fixture", text: "Fixture" });
assert.equal(result.error, null);
assert.equal(result.data.requestId, "fixture-request");
assert.equal(attempts, 1);
`);
  execFileSync(process.execPath, [join(temporary, "smoke.mjs")], { cwd: temporary, stdio: "inherit" });
  const installed = JSON.parse(readFileSync(join(temporary, "node_modules/@mailchannels/sdk/package.json"), "utf8"));
  console.info(JSON.stringify({ packedConsumer: "pass", packageManager: process.argv.includes("--pnpm") ? "pnpm (hoist=false)" : "npm", mockedRequests: 1, version: installed.version, strict: true, skipLibCheck: false, explicitConsumerUndiciDependency: false, liveRequests: 0 }));
}
finally {
  rmSync(temporary, { recursive: true, force: true });
}
