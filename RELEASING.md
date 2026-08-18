# Releasing

Do these once before the first public release.

## 1. Set the org

Replace `YOUR_ORG` with your GitHub user or org in:

- `README.md` (install command)
- `profile/package.json` (the `dsh-desk-rsi` dependency)

## 2. Publish the repo

- Create the GitHub repo and push.
- Add the topics `dsh`, `dsh-plugin`, `deepseek-harness` so the community hub indexes it.
- In repo Settings → General, enable issues with the templates in `.github/ISSUE_TEMPLATE/`.

## 3. Secrets (never committed)

GitHub → Settings → Secrets and variables → Actions, add:

| Name | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | runs the harness (chat + web search) |

## 4. Verify

Push → `ci.yml` runs the smoke + end-to-end loop tests. Tag `v0.1.0` when the tests are green.
