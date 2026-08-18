import { defineTool } from '@deepseek-ai/dsh-tools'
import { run } from '../lib/exec.js'

const DESCRIPTION = [
  'Rewind the working tree to a checkpoint SHA produced by rsi_checkpoint,',
  'discarding every change made after it. Destructive: call only after a',
  'failed rsi_verify, and only on a checkpoint you trust. This is the Memento',
  'restore of the repair loop.',
].join(' ')

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function registerRollback(ctx) {
  ctx.tools.register(defineTool({
    name: 'rsi_rollback',
    description: DESCRIPTION,
    parameters: {
      sha: { type: 'string', required: true, description: 'Checkpoint SHA returned by rsi_checkpoint.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const reset = await run(`git reset --hard ${args.sha}`)
      if (!reset.ok) return `rsi_rollback: reset failed\n${reset.stderr}`
      return `working tree rewound to ${args.sha}`
    },
  }))
}
