# Architecture

## Layers

### Electron Main Process

Responsibilities:

- Window lifecycle
- Native menus and shell integration
- IPC handlers
- User-data path management
- Relay process lifecycle

### Renderer

Responsibilities:

- Operator UI
- Local configuration forms
- Status presentation
- Conversation view
- Log view

### Services

Responsibilities:

- Config store
- Conversation store
- Log store
- Runtime manager

### Relay Worker

The repository currently ships a mock worker to validate the app contract:

- Start/stop
- Log output
- Conversation append
- Renderer polling

This worker is the seam where the real runtime should be integrated.

## Storage Model

All state lives in the Electron user-data directory. The app never writes mutable state into the application bundle.

## Cross-Platform Rule

Renderer code must not know whether the host is macOS or Windows. Platform-specific behaviors stay in main-process services.
