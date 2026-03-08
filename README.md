# Omnilink

A cross-platform desktop console for connecting AI workflows on macOS and Windows.

## Scope

This repository is intentionally narrow:

- Desktop-first
- Local-first configuration and logs
- Cross-platform packaging with Electron

The first public version focuses on a clean desktop operator console:

- App configuration
- Relay lifecycle controls
- Conversation timeline
- Runtime and supervisor logs
- User-data based storage

## Current Status

This project already includes a working desktop shell, local storage model, mock relay runtime, and a renderer UI that demonstrates the intended product shape.

The mock relay is a development placeholder. It validates the app flow end-to-end without binding the public repository to any private or machine-specific runtime code.

## Screens Included In This Skeleton

- Overview
- Conversation
- Logs
- Settings
- About

## Quick Start

### Requirements

- Node.js 20+
- npm 10+

### Run locally

```bash
npm install
npm run dev
```

### Package for macOS

```bash
npm run dist:mac
```

### Package for Windows

```bash
npm run dist:win
```

## Data Layout

All runtime data is stored under the Electron user-data directory.

Typical locations:

- macOS: `~/Library/Application Support/Omnilink/omnilink-data`
- Windows: `%APPDATA%/Omnilink/omnilink-data`

Files created by the app:

- `config.json`
- `logs/runtime.log`
- `logs/supervisor.log`
- `conversation/conversation.jsonl`
- `state/runtime-state.json`

## Architecture

See [docs/architecture.md](./docs/architecture.md).

## Open Source Positioning

This repository is designed as a clean public starting point. It does not include private credentials, internal workflow bindings, or machine-specific bootstrap logic.

## Roadmap

- Replace the mock relay worker with a real runtime
- Add token validation and connectivity checks
- Add installer polish for macOS and Windows
- Add auto-update strategy
- Add CI packaging smoke tests

## License

MIT
