# Security Policy

## Reporting a vulnerability

Do **not** open a public issue for a security vulnerability. Report it privately to the maintainers via GitHub's **"Report a vulnerability"** flow (Security → Advisories → New draft advisory) or the private disclosure channel named in the repository README.

Please include:

- The affected component and version.
- A minimal reproduction or the exact conditions.
- The impact (what an attacker gains).

## Security model

`deepseek-desk-rsi` drives a **DeepSeek Harness agent** that can edit files, run shell commands, and open pull requests. Treat a running loop as a local user with shell access. Key properties you should preserve:

1. **Never commit secrets.** API keys and tokens belong in environment variables, GitHub Actions secrets, or the DSH credential store — never in source, `cordis.patch.yml`, `parity.json`, or logs.
2. **The PR is the gate.** The loop proposes pull requests but never merges. Keep branch protection so no credential grants the loop merge rights.
3. **Trust your upstream.** `rsi_perceive` diffs and `integrate` applies upstream `deepseek-harness` changes, which reach the real runtime. Pin the upstream remote to a commit you trust, and review every PR the loop opens before merging.
4. **Bounded recursion.** The loop discipline (`prompt.js`) caps repair attempts and checkpoints before edits, so a misbehaving sync rolls back rather than accumulates damage.

## Reporting in this project

Security-related changes follow the same path as code: open a PR, note the security rationale, and it will be reviewed before merge. Do not include exploit details in the PR description; keep those in the private advisory.
