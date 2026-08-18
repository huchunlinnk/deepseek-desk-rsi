import { defineTool } from '@deepseek-ai/dsh-tools'
import { run } from '../lib/exec.js'

const DESCRIPTION = [
  'Create a durable checkpoint of the current working tree so a later failed',
  'integration can be rewound. Stages all changes (including untracked files),',
  'commits them with a machine-readable label, and returns the commit SHA.',
  'Pair with rsi_rollback. This is the Memento snapshot of the repair loop:',
  'checkpoint before risky edits, rollback after a failed verify.',
].join(' ')

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function registerCheckpoint(ctx) {
  ctx.tools.register(defineTool({
    name: 'rsi_checkpoint',
    description: DESCRIPTION,
    parameters: {
      label: { type: 'string', required: true, description: 'Checkpoint label (e.g. pre-integrate-2026-08-18).' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const add = await run('git add -A')
      if (!add.ok) return `rsi_checkpoint: git add failed\n${add.stderr}`

      const commit = await run(`git commit -m "rsi checkpoint: ${args.label}" --allow-empty`)
      if (!commit.ok) return `rsi_checkpoint: commit failed\n${commit.stderr}`

      const sha = await run('git rev-parse HEAD')
      return `checkpoint committed at ${sha.stdout.trim()} (label: ${args.label})`
    },
  }))
}
