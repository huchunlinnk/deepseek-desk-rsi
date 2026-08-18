# deepseek-desk-rsi

**AI for AI**: a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) plugin that makes a *downstream* app keep itself in sync with the fast-moving *upstream* harness — using DSH itself as the worker. DSH maintains DSH.

DeepSeek Harness is in `0.1.x-rc` and its authors promise breaking changes. A desktop shell that pins one rc version rots within days. Instead of a human chasing upstream, this bundle gives the agent a bounded, self-correcting loop over five primitives.

## The loop

```
perceive  →  integrate  →  verify  →  repair (bounded)  →  propose
```

| Stage | Who | How |
|---|---|---|
| perceive | tool `rsi_perceive` | fetch upstream, diff commit log + stat since last sync |
| integrate | agent (existing tools) | apply relevant harness changes to the app's glue with `bash` / `edit` / `subagent` / `workflow` |
| verify | tool `rsi_verify` | the **hard fitness function**: `cargo build --locked && cargo test` + smoke, `ok` only on exit 0 |
| repair | agent + `rsi_checkpoint` / `rsi_rollback` | checkpoint before edits (Memento), roll back and retry after a failed verify |
| propose | tool `rsi_propose` | commit, push a branch, open a PR via `gh` — the PR is the human gate; the loop never merges |

The design constraint that makes RSI tractable here: **verify has a hard, automatable reward signal** ("does it build and pass"), unlike vague "get smarter" objectives.

## Design principles

- **First principles** — the bundle reuses the harness (`@deepseek-ai/dsh-tools`, `@deepseek-ai/cordis` are peer deps provided by DSH); it never reimplements bash, git, or subagents.
- **Occam's razor** — plain ESM JavaScript, zero build step, zero `prepare` script; a git install works out of the box.
- **Design patterns** — the loop is a *Pipeline*; checkpoints are *Memento*; the PR is a *Command* gate; the repair loop is *bounded recursion*.

## Install

```sh
dsh plugin --profile rsi add github:YOUR_ORG/deepseek-desk-rsi#main
dsh --profile rsi "Run the daily upstream sync: perceive, integrate, verify, repair if needed, then propose a PR."
```

The `profile/` directory is a starting headless profile; copy it into `$DSH_HOME/profiles/rsi` and set the git remote / verify command for your repo.

## Tools

- `rsi_perceive` — diff upstream since a base ref.
- `rsi_checkpoint` — commit a labeled snapshot (Memento capture).
- `rsi_rollback` — `git reset --hard` back to a checkpoint (Memento restore).
- `rsi_verify` — run the fitness command; the loop's truth signal.
- `rsi_propose` — open a PR via `gh`; the human review gate.

## Verify locally

```sh
mkdir -p node_modules/@deepseek-ai
ln -s /path/to/deepseek-harness/vendor/cordis node_modules/@deepseek-ai/cordis
ln -s /path/to/deepseek-harness/packages/core/tools node_modules/@deepseek-ai/dsh-tools
node scripts/smoke.js
```

## License

MIT
