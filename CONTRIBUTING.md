# Contributing

## Principles

- Keep the public version narrow unless there is a strong reason to widen scope.
- Prefer predictable local behavior over hidden automation.
- Keep platform-specific code behind a narrow adapter boundary.

## Development Flow

1. Install dependencies with `npm install`.
2. Run `npm run check` before opening a PR.
3. Keep renderer logic and main-process logic separated.
4. Do not commit secrets, app credentials, or local runtime data.

## Pull Requests

Please include:

- Problem statement
- Behavior change summary
- Manual verification steps
- Screenshots for UI changes
