import { defineTool } from '@deepseek-ai/dsh-tools'
import { run } from '../lib/exec.js'

const DEFAULT_COMMAND = 'cargo build --locked && cargo test'
const DEFAULT_TIMEOUT_MS = 600_000

const DESCRIPTION = [
  'Run the hard fitness function: build and test the desktop repo, plus a',
  'headless smoke run. Returns ok=true only if the whole command exits 0. This',
  'single, automatable signal drives the repair loop — if it fails, roll back',
  'to the last checkpoint and retry.',
].join(' ')

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function registerVerify(ctx) {
  ctx.tools.register(defineTool({
    name: 'rsi_verify',
    description: DESCRIPTION,
    parameters: {
      command: { type: 'string', description: `Verification command. Default: ${DEFAULT_COMMAND}` },
      cwd: { type: 'string', description: 'Working directory. Default: the process cwd.' },
      timeoutMs: { type: 'number', description: `Timeout in ms. Default: ${DEFAULT_TIMEOUT_MS}` },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const result = await run(args.command ?? DEFAULT_COMMAND, {
        cwd: args.cwd,
        timeoutMs: args.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      })
      return JSON.stringify(result, null, 2)
    },
  }))
}
