import { readFile } from 'node:fs/promises'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { run } from '../lib/exec.js'

const DEFAULT_MANIFEST = 'parity.json'
const DEFAULT_DUMP_COMMAND = 'npx @deepseek-ai/dsh --profile web --dump-config'

const DESCRIPTION = [
  'Verify 1:1 feature parity between the original DeepSeek Harness and the',
  'native desktop app: run the composed-profile dump and confirm every required',
  'plugin name from parity.json is still present (exact-name match). This is the',
  '"identical surface" gate — ok=true only when nothing is missing. The web',
  'endpoint smoke lives in rsi_verify via scripts/smoke-web.sh, not here.',
].join(' ')

/**
 * Extract exact plugin `name:` tokens from a `--dump-config` render, handling
 * single-, double-, and unquoted scalars plus subpaths like
 * `@deepseek-ai/dsh-tool-subagent-control/list-agents`. Exact-set membership
 * (not substring) so `dsh-llm` does not falsely match `dsh-llm-retry`.
 *
 * @param {string} text the config-dump output.
 * @returns {Set<string>} parsed plugin names.
 */
function extractPluginNames(text) {
  const names = new Set()
  for (const match of text.matchAll(/name:\s*['"]?([^'"\s]+)/g)) {
    names.add(match[1])
  }
  return names
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function registerParity(ctx) {
  ctx.tools.register(defineTool({
    name: 'rsi_parity',
    description: DESCRIPTION,
    parameters: {
      manifest: { type: 'string', description: `Path to parity.json. Default: ./${DEFAULT_MANIFEST}` },
      dumpCommand: { type: 'string', description: `Command that dumps the composed profile. Default: ${DEFAULT_DUMP_COMMAND}` },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const manifestPath = args.manifest ?? DEFAULT_MANIFEST
      let manifest
      try {
        manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
      } catch (err) {
        const e = /** @type {{ message?: string }} */ (err)
        return JSON.stringify({ ok: false, error: `cannot read manifest ${manifestPath}: ${e.message}` }, null, 2)
      }

      const dump = await run(args.dumpCommand ?? DEFAULT_DUMP_COMMAND)
      if (!dump.ok) {
        return JSON.stringify({
          ok: false,
          profile: manifest.profile,
          error: `dump-config failed: ${dump.stderr.slice(-2000)}`,
        }, null, 2)
      }

      const present = extractPluginNames(dump.stdout)
      const required = manifest.requiredPlugins ?? []
      const missing = required.filter((plugin) => !present.has(plugin))

      return JSON.stringify({
        ok: missing.length === 0,
        profile: manifest.profile,
        required: required.length,
        present: present.size,
        missing: missing.length,
        missingNames: missing,
      }, null, 2)
    },
  }))
}
