import { defineTool } from '@deepseek-ai/dsh-tools'
import { run } from '../lib/exec.js'

const DESCRIPTION = [
  'Diff the local checkout against an upstream git remote to see what changed',
  'since the last sync. Fetches the upstream branch, then reports the commit',
  'count, commit log, and per-file stat between the base ref and the upstream',
  'tip. This is the perceive stage of the RSI loop.',
].join(' ')

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function registerPerceive(ctx) {
  ctx.tools.register(defineTool({
    name: 'rsi_perceive',
    description: DESCRIPTION,
    parameters: {
      upstream: { type: 'string', required: true, description: 'Name of the upstream git remote (e.g. upstream).' },
      branch: { type: 'string', description: 'Upstream branch to diff against. Default: main.' },
      baseRef: { type: 'string', description: 'Local ref marking the last-synced commit. Default: HEAD.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const branch = args.branch ?? 'main'
      const base = args.baseRef ?? 'HEAD'
      const upstreamRef = `${args.upstream}/${branch}`

      const fetch = await run(`git fetch ${args.upstream} ${branch}`)
      if (!fetch.ok) return `rsi_perceive: fetch failed\n${fetch.stderr}`

      const range = `${base}..${upstreamRef}`
      const count = await run(`git rev-list --count ${range}`)
      const log = await run(`git log --oneline --no-decorate ${range}`)
      const stat = await run(`git diff --stat ${range}`)

      return [
        `Upstream ${args.upstream}/${branch} is ${count.stdout.trim()} commit(s) ahead of ${base}.`,
        '',
        '## Commits',
        log.ok ? log.stdout || '(none)' : `error: ${log.stderr}`,
        '## Changed files',
        stat.ok ? stat.stdout || '(none)' : `error: ${stat.stderr}`,
      ].join('\n')
    },
  }))
}
