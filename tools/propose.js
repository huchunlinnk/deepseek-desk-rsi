import { defineTool } from '@deepseek-ai/dsh-tools'
import { run } from '../lib/exec.js'

const DESCRIPTION = [
  'Open a pull request with the integrated changes. Commits everything, pushes',
  'a new branch, and creates the PR via the gh CLI. The PR is the human review',
  'gate: the sync loop never merges on its own. Requires an authenticated gh.',
  'Include the rsi_verify result in the body as evidence.',
].join(' ')

/** Single-quote a string for safe interpolation into a POSIX shell command. */
function quote(text) {
  return `'${text.replace(/'/g, `'\\''`)}'`
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function registerPropose(ctx) {
  ctx.tools.register(defineTool({
    name: 'rsi_propose',
    description: DESCRIPTION,
    parameters: {
      branch: { type: 'string', required: true, description: 'New branch name (e.g. rsi/sync-2026-08-18).' },
      title: { type: 'string', required: true, description: 'Pull request title.' },
      body: { type: 'string', description: 'PR body; paste the rsi_verify output here.' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const checkout = await run(`git checkout -b ${quote(args.branch)}`)
      if (!checkout.ok && !checkout.stderr.includes('already exists')) {
        return `rsi_propose: checkout failed\n${checkout.stderr}`
      }

      const add = await run('git add -A')
      if (!add.ok) return `rsi_propose: git add failed\n${add.stderr}`

      const commit = await run(`git commit -m ${quote(args.title)} --allow-empty`)
      if (!commit.ok) return `rsi_propose: commit failed\n${commit.stderr}`

      const push = await run(`git push -u origin ${quote(args.branch)}`)
      if (!push.ok) return `rsi_propose: push failed\n${push.stderr}`

      const pr = await run(`gh pr create --title ${quote(args.title)} --body ${quote(args.body ?? '')} --base main`)
      if (!pr.ok) return `rsi_propose: gh pr create failed\n${pr.stderr}`

      return `PR opened: ${pr.stdout.trim()}`
    },
  }))
}
