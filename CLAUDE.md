# OpenSnag - Open Source Screen Capture & Annotation Tool

## Project Overview
Cross-platform (macOS, Windows, Linux) open-source alternative to TechSmith Snagit.
Built with **Tauri 2 + React + TypeScript + Rust**.

## Tech Stack
- **Framework**: Tauri 2.0 (Rust backend, webview frontend)
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4
- **Canvas/Editor**: Fabric.js
- **State Management**: Zustand
- **Screen Capture**: `xcap` crate (Rust)
- **Screen Recording**: `scap` crate (Rust)
- **Audio**: `cpal` crate (Rust)
- **Video Encoding**: FFmpeg via `rsmpeg`
- **Database**: SQLite via `rusqlite`

## Project Structure
```
open-snag/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── lib.rs          # Tauri app setup
│   │   ├── capture/        # Screenshot capture engine
│   │   ├── recording/      # Screen recording engine
│   │   ├── storage/        # SQLite + file management
│   │   ├── hotkeys.rs      # Global shortcut registration
│   │   ├── tray.rs         # System tray setup
│   │   └── clipboard.rs    # Clipboard operations
│   └── Cargo.toml
├── src/                    # React frontend
│   ├── components/
│   │   ├── editor/         # Fabric.js annotation editor
│   │   ├── capture/        # Capture UI (region selector, etc.)
│   │   ├── library/        # Capture history browser
│   │   └── settings/       # Settings UI
│   ├── hooks/              # React hooks for Tauri commands
│   ├── stores/             # Zustand stores
│   └── lib/                # Utilities and Tauri API wrappers
├── .claude/skills/         # Claude Code skills
└── package.json
```

## Commands
- `pnpm tauri dev` — Run in development mode
- `pnpm tauri build` — Build for production
- `pnpm dev` — Vite dev server only (frontend)
- `pnpm build` — Build frontend only

## Conventions
- Rust: snake_case, follow Rust 2021 edition idioms
- TypeScript: camelCase for variables/functions, PascalCase for components/types
- Use Tauri IPC commands for all Rust↔Frontend communication
- Keep Tauri commands in `src-tauri/src/commands.rs`
- One component per file, co-locate styles when possible
- Use Zustand stores for shared state, local state for component-only state
