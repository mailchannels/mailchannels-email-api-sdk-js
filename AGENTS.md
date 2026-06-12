## Scope

- For SDK consumers (app code using `mailchannels-sdk`), use `.agents/skills/mailchannels-js/SKILL.md`.
- For SDK maintainers and contributors (changing `src`, `test`, packaging, docs), follow this file.

## Dev Environment Tips

- Use `pnpm` for dependency and script management.
- Use Node.js `>=22` for local development.
- Run commands from the repository root unless a command explicitly targets `examples/`.
- This repository is hosted on **Bitbucket**.
- Keep `README.md` focused on user-facing SDK documentation, not release history. Release notes in `CHANGELOG.md` are automatically generated via changelogen scripts and should be the source of truth for changes per version.
- Update the agent-facing skill under `.agents/skills/mailchannels-js/` when SDK behavior or public API usage changes. `SKILL.md` is the entry point and topic recipes live in `resources/`.

## Dev Rules

- Keep the SDK's result contract stable:
  - Methods return `{ data, error }` (`DataResponse<T>`) or `{ success, error }` (`SuccessResponse`).
  - API/transport failures are mapped into `error`, not thrown to callers.
- Validate inputs early and set the error object with `createValidationError(...)` for invalid options.
- Use `getStatusError(...)` for API status mapping and `getResultError(...)` for caught runtime errors.
- Use camelCase for option properties, public responses, and method names; use PascalCase for class names, types and interfaces.
- Use `clean(...)` before returning response objects so mapped `undefined` fields are removed consistently.
- Keep internal wire types in `src/types/**/internal.ts`; keep exported consumer types in non-`internal` files.
- Commit every change you make and ask the user to push changes when a significant batch of changes has been made.
- Preserve current TypeScript strictness and avoid introducing `any` where a concrete type is possible.
- Write JSDoc comments for all methods and functions in exported classes and modules, include description, parameters (`@param`), and example usage (`@example`). Even if the types are self-explanatory. This improves IDE support.
- Add explicit parameter and return types for new functions and methods in exported classes and modules. Never write a function that has no typing on parameters.
- Keep functions focused and composable; split logic when a function starts doing multiple jobs.
- Keep comments high-signal and sparse; prefer readable code over explanatory noise.
- If SDK behavior or public API usage changes, update docs and `.agents/skills/mailchannels-js/` guidance in the same change.
- Use conventional commits for all changes to the SDK, even if the change is a non-code change like documentation or tests. This keeps the changelog accurate and helps with release note generation. Commit title should be in the format `<type>(<scope>): <description>`, where:
  - `<type>` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, or `revert`.
  - `<scope>` is optional but can be used to indicate the area of the codebase affected (e.g., `client`, `webhooks`, `metrics`).
  - `<description>` is a concise summary of the change.
  - Mark breaking changes with `!` after the type, e.g., `feat!: <description>`.

## Testing Instructions

- Add or update tests for behavior changes in `src/`, even if nobody asked.
- Use Vitest for unit tests.
- Follow existing Vitest style in this repo:
  - `fake` fixtures per test file.
  - transport mocks via `vi.fn()` / `mockResolvedValueOnce` / `mockRejectedValueOnce`.
  - cover success, validation, API-status, and catch/rejection paths.
- Always run this validation set before committing: `pnpm lint`, `pnpm test:types`, `pnpm test`. Never commit if the test suite fails to pass.
