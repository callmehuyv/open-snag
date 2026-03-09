---
name: dev
description: Start the OpenSnag development server (Tauri + Vite)
disable-model-invocation: true
allowed-tools: Bash
---

Start the OpenSnag development environment:

1. Run `pnpm tauri dev` in the project root `/Users/callmehuyv/Desktop/open-snag`
2. This starts both the Vite dev server and the Tauri native window
3. Report any compilation errors from Rust or TypeScript
4. If there are missing dependencies, install them first with `pnpm install` and/or `cargo build` in `src-tauri/`
