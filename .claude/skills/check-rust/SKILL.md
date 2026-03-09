---
name: check-rust
description: Check Rust code compiles without errors. Use when Rust code has been modified.
allowed-tools: Bash
---

Check that the Rust backend compiles:

1. Run `cd /Users/callmehuyv/Desktop/open-snag/src-tauri && cargo check 2>&1`
2. If there are errors, analyze and fix them
3. Run `cargo clippy 2>&1` for lint warnings
4. Fix any clippy warnings that are not false positives
