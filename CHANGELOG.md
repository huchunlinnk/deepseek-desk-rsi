# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Six RSI tools: `rsi_perceive`, `rsi_checkpoint`, `rsi_rollback`, `rsi_verify`, `rsi_parity`, `rsi_propose`.
- Loop-discipline system-prompt section (`rsi:loop`) enforcing bounded repair.
- `parity.json` contract (128 upstream plugins) + `scripts/gen-parity.mjs` generator + `rsi_parity` exact-set check.
- Headless profile (`base` + `headless` + `dsh-desk-rsi`).
- Smoke and end-to-end loop tests; CI workflow.
