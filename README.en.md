# deepseek-desk-rsi

English | [中文](./README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) plugin that makes a *downstream* app keep itself in sync with the fast-moving *upstream* harness — using DSH itself as the worker.

**AI for AI: DSH maintains DSH.**

## Why this exists

DeepSeek Harness is in `0.1.x-rc` and ships breaking changes often. A desktop shell (or any downstream app) that pins one version rots within days. Chasing upstream by hand is a full-time job. This bundle hands that job to an agent — with hard, automatable success signals so the loop can't drift.

## Why — the biggest advantages

1. **AI for AI, genuinely.** The worker is DeepSeek Harness itself: it diffs upstream, edits the integration glue, builds, tests, rolls back, and opens a PR — no human in the loop except the final merge.
2. **"一模一样" is machine-checked, not a promise.** `rsi_parity` enforces a 128-plugin contract (`parity.json`, generated from the official `dsh-base` + `dsh-web-app` bundles). Any upstream add/rename/remove surfaces as a hard failure — exact-name matching, not substring.
3. **Evolution that cannot run away.** Bounded repair (max 3 rounds), Memento checkpoints (`rsi_checkpoint` / `rsi_rollback`), and a PR gate — the loop proposes, a human merges.
4. **Zero-build install.** Plain ESM + JSDoc, no `prepare` script: `dsh plugin add github:huchunlinnk/deepseek-desk-rsi#main` just works.

## The loop

```
perceive  →  integrate  →  verify  →  parity  →  repair (bounded)  →  propose
```

| Stage | Who | How |
|---|---|---|
| perceive | tool `rsi_perceive` | fetch upstream, diff commit log + stat since last sync |
| integrate | agent (existing tools) | apply the relevant harness changes to the app's glue with `bash` / `edit` / `subagent` / `workflow` |
| verify | tool `rsi_verify` | the **hard fitness function**: `cargo build && cargo test && bash scripts/smoke-web.sh`, `ok` only on exit 0 |
| parity | tool `rsi_parity` | the **identical-surface gate**: every required plugin in `parity.json` is still present |
| repair | agent + `rsi_checkpoint` / `rsi_rollback` | checkpoint before edits (Memento), roll back and retry after a failed verify/parity |
| propose | tool `rsi_propose` | commit, push a branch, open a PR via `gh` — the human gate |

The loop discipline is enforced by a system-prompt section (`rsi:loop`) that the bundle injects, so the agent cannot silently skip a stage.

## Tools

| Tool | Purpose | Design pattern |
|---|---|---|
| `rsi_perceive` | diff upstream since a base ref | — |
| `rsi_checkpoint` | commit a labeled snapshot | Memento (capture) |
| `rsi_rollback` | `git reset --hard` back to a checkpoint | Memento (restore) |
| `rsi_verify` | run the build/test/serve fitness command | — |
| `rsi_parity` | check `parity.json` against `--dump-config` (exact-set) | — |
| `rsi_propose` | open a PR via `gh` | Command (review gate) |

The five stages are a **Pipeline**; the whole loop is **bounded recursion** (max 3 repair rounds).

## Install

```sh
dsh plugin --profile rsi add github:huchunlinnk/deepseek-desk-rsi#main
dsh --profile rsi "Run the daily upstream sync: perceive, integrate, verify, parity, repair if needed, then propose a PR."
```

The `profile/` directory is a starting headless profile (`dsh-base` + `dsh-headless` + `dsh-desk-rsi`). Copy it into `$DSH_HOME/profiles/rsi` and point it at your repo.

## Parity contract

`parity.json` lists every plugin in the official `dsh-base` + `dsh-web-app` bundles (128 plugins) plus the host endpoint. `rsi_parity` fails if any name goes missing after a sync. Regenerate it from the official bundles whenever upstream adds/renames a plugin:

```sh
node scripts/gen-parity.mjs /path/to/deepseek-harness
```

## Design principles

- **First principles** — reuses the harness (`@deepseek-ai/dsh-tools`, `@deepseek-ai/cordis` are peer deps provided by DSH); never reimplements bash, git, or subagents.
- **Occam's razor** — plain ESM JavaScript, zero build, zero `prepare`; a git install works out of the box.
- **Design patterns** — Pipeline (stages), Memento (checkpoint/rollback), Command (PR gate), Strategy (the desktop's update policy), bounded recursion.

## Repository layout

```
index.js           single entry; registers the 6 tools + the loop prompt
prompt.js          the rsi:loop system-prompt section (discipline)
tools/             one tool per file
lib/exec.js        bounded shell runner
scripts/           smoke.js, e2e-loop.mjs, gen-parity.mjs
profile/           starting headless profile
parity.json        128-plugin contract
```

## Testing

```sh
npm install --no-save --no-package-lock @deepseek-ai/dsh-tools   # prebuilt registry + cordis peer
npm test   # smoke (register 6 tools + prompt) + e2e (real-git perceive→checkpoint→rollback→verify→parity)
```

To develop against a locally built harness checkout instead, symlink its packages into `node_modules/@deepseek-ai/` (as the CI once did).

## Security

A running loop is a local user with shell access. Secrets never enter source; the PR is the gate; pin upstream to a commit you trust. See [`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE)
