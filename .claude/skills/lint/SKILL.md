---
name: lint
description: Lint and type-check the OpenSnag codebase (TypeScript + Rust)
allowed-tools: Bash
---

Lint the entire OpenSnag codebase:

## TypeScript
1. Run `cd /Users/callmehuyv/Desktop/open-snag && pnpm exec tsc --noEmit 2>&1`
2. Fix any TypeScript errors

## Rust
1. Run `cd /Users/callmehuyv/Desktop/open-snag/src-tauri && cargo clippy 2>&1`
2. Fix any clippy warnings
