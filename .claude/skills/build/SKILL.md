---
name: build
description: Build OpenSnag for production
disable-model-invocation: true
allowed-tools: Bash
---

Build OpenSnag for production:

1. Run `pnpm tauri build` in the project root `/Users/callmehuyv/Desktop/open-snag`
2. This builds the frontend (Vite) and the Rust backend, then packages the app
3. Report any compilation errors and fix them
4. The output binary will be in `src-tauri/target/release/bundle/`
