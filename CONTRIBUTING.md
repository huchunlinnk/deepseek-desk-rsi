# Contributing

Thanks for helping build the RSI engine. This is a DeepSeek Harness (DSH) plugin; the loop it drives is **AI for AI** — DSH maintains DSH.

## Development

```sh
# 1. Clone and wire the DSH peer types for local tests
git clone <this-repo>
mkdir -p node_modules/@deepseek-ai
ln -s /path/to/deepseek-harness/vendor/cordis node_modules/@deepseek-ai/cordis
ln -s /path/to/deepseek-harness/packages/core/tools node_modules/@deepseek-ai/dsh-tools

# 2. Test
npm test                 # smoke (register 6 tools + prompt) + e2e (real-git loop)

# 3. Regenerate the parity contract after an upstream harness change
node scripts/gen-parity.mjs /path/to/deepseek-harness
```

## Conventions

- **Plain ESM JavaScript + JSDoc.** No build step, so a git install works out of the box.
- **One tool per file** under `tools/`, orchestration only in `index.js`, discipline in `prompt.js`.
- **Secrets never in source.** Use env vars / GitHub secrets / the DSH credential store.
- **Tests describe behavior.** Run `npm test` before opening a PR; add a test for any new tool.

## Submitting

1. Open an issue first for anything larger than a bug fix.
2. Branch, change, test.
3. Open a PR; keep it small and one-concern.
4. Tag the repo `dsh` and `dsh-plugin` so the community hub indexes it.
