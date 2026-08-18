import { readFile } from 'node:fs/promises'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { run } from '../lib/exec.js'

const DEFAULT_MANIFEST = 'parity.json'
const DEFAULT_DUMP_COMMAND = 'npx @deepseek-ai/dsh --profile web --dump-config'
const HTTP_TIMEOUT_MS = 5000

const DESCRIPTION = [
  'Verify 1:1 feature parity between the original DeepSeek Harness and the',
  'native desktop app, against a parity.json manifest. Checks (1) every HTTP',
  'endpoint answers with the expected status, and (2) the composed profile',
  'dump still contains every required plugin name. This is the "identical',
  'surface" gate: ok=true only when nothing is missing.',
].join(' ')

/**
 * @param {string} url endpoint URL.
 * @param {number} expectedStatus HTTP status that signals ready.
 * @returns {Promise<{ ok: boolean, detail: string }>}
 */
async function httpOk(url, expectedStatus) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) })
    return { ok: res.status === expectedStatus, detail: `status ${res.status}` }
  } catch (err) {
    const e = /** @type {{ cause?: unknown, message?: string }} */ (err)
    return { ok: false, detail: String(e.cause ?? e.message ?? err) }
  }
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

      /** @type {Array<{ kind: string, name: string, ok: boolean, detail?: string }>} */
      const checks = []

      for (const ep of manifest.endpoints ?? []) {
        const { ok, detail } = await httpOk(ep.url, ep.status ?? 200)
        checks.push({ kind: 'endpoint', name: ep.url, ok, detail })
      }

      const dump = await run(args.dumpCommand ?? DEFAULT_DUMP_COMMAND)
      if (!dump.ok) {
        checks.push({ kind: 'composition', name: 'dump-config', ok: false, detail: dump.stderr.slice(-2000) })
      } else {
        const required = manifest.requiredPlugins ?? []
        let missing = 0
        for (const plugin of required) {
          if (!dump.stdout.includes(plugin)) {
            missing += 1
            checks.push({ kind: 'plugin', name: plugin, ok: false })
          }
        }
        checks.push({
          kind: 'composition',
          name: 'dump-config',
          ok: true,
          detail: `${required.length - missing}/${required.length} required plugins present`,
        })
      }

      const failed = checks.filter((check) => !check.ok)
      return JSON.stringify({
        ok: failed.length === 0,
        profile: manifest.profile,
        total: checks.length,
        passed: checks.length - failed.length,
        failed: failed.length,
        failures: failed.map((check) => ({ kind: check.kind, name: check.name, detail: check.detail })),
      }, null, 2)
    },
  }))
}
