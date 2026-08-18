# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Six RSI tools: `rsi_perceive`, `rsi_checkpoint`, `rsi_rollback`, `rsi_verify`, `rsi_parity`, `rsi_propose`.
- Loop-discipline system-prompt section (`rsi:loop`) that enforces the bounded `perceive → integrate → verify → parity → repair → propose` order.
- `parity.json` (the 128-plugin upstream contract) plus `scripts/gen-parity.mjs` to regenerate it from the official `dsh-base` + `dsh-web-app` bundles.
- Headless profile (`dsh-base` + `dsh-headless` + `dsh-desk-rsi`).
- Smoke test (register all tools + the prompt) and end-to-end loop test (real-git `perceive → checkpoint → rollback → verify → parity`).
- CI workflow that installs the prebuilt `@deepseek-ai/dsh-tools` and runs both tests.
- English and Chinese READMEs.

### Fixed

- `rsi_parity` exact-name matching: a substring check previously let `dsh-llm` falsely match `dsh-llm-retry`.
