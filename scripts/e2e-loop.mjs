// End-to-end loop test against real git plumbing, without the DSH runtime.
//
// Exercises the perceive → checkpoint → (edit) → rollback chain in real
// temporary repos, so the git-dependent tools are proven against actual git
// rather than mocks. verify/parity are command wrappers already covered by
// their own tests; they run here with stub commands.
//
// The RSI tools operate on process.cwd() — the same model as the daily-sync
// job, whose agent runs with the target repo as its working directory.
//
// Run: node scripts/e2e-loop.mjs
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run } from '../lib/exec.js'
import { apply } from '../index.js'

const assert = (cond, msg) => { if (!cond) throw new Error(`FAIL: ${msg}`) }
const git = async (cmd, cwd) => {
  const res = await run(cmd, { cwd })
  assert(res.ok, `git ${cmd} failed: ${res.stderr}`)
  return res.stdout.trim()
}

// 1. Build an "upstream" repo with one commit, and a "desktop" repo that tracks it.
const root = mkdtempSync(join(tmpdir(), 'rsi-e2e-'))
const upstream = join(root, 'upstream')
const desktop = join(root, 'desktop')
for (const dir of [upstream, desktop]) {
  mkdirSync(dir)
  await git('git init -q', dir)
  await git('git config user.email t@t && git config user.name t', dir)
}
writeFileSync(join(upstream, 'feature.txt'), 'upstream change\n')
await git('git add -A && git commit -qm "upstream: add feature"', upstream)
writeFileSync(join(desktop, 'glue.txt'), 'desktop glue\n')
await git('git add -A && git commit -qm "desktop: initial glue"', desktop)
await git(`git remote add upstream ${upstream}`, desktop)

// 2. Run the loop from the desktop repo, as the daily-sync agent would.
process.chdir(desktop)
const tools = {}
apply({ tools: { register: (d) => { tools[d.name] = d } }, systemPrompt: { section: () => () => {} } })

// perceive: upstream should be 1 commit ahead of HEAD.
const perceived = await tools.rsi_perceive.execute({ upstream: 'upstream' })
assert(perceived.includes('1 commit(s) ahead'), `perceive reported wrong count:\n${perceived}`)

// checkpoint: snapshot the current state.
const checkpoint = await tools.rsi_checkpoint.execute({ label: 'pre-integrate' })
const sha = checkpoint.match(/at ([0-9a-f]{7,})/)[1]
assert(sha.length >= 7, `checkpoint did not return a sha: ${checkpoint}`)

// integrate: make a change that we will later discard.
writeFileSync(join(desktop, 'glue.txt'), 'desktop glue (broken integration)\n')

// rollback: rewind to the checkpoint, discarding the integration.
const rolled = await tools.rsi_rollback.execute({ sha })
assert(rolled.includes('rewound'), `rollback failed: ${rolled}`)
assert((await git('cat glue.txt', desktop)) === 'desktop glue', 'rollback did not restore glue.txt')

// verify: passes on a stub command.
const verify = await tools.rsi_verify.execute({ command: 'true' })
assert(JSON.parse(verify).ok === true, `verify should pass on "true": ${verify}`)

// parity: exact-set membership over a stubbed dump.
writeFileSync('parity.json', JSON.stringify({ profile: 'web', requiredPlugins: ['@deepseek-ai/dsh-llm'] }))
const parity = await tools.rsi_parity.execute({
  manifest: 'parity.json',
  dumpCommand: "echo 'name: @deepseek-ai/dsh-llm'",
})
assert(JSON.parse(parity).ok === true, `parity should pass: ${parity}`)

console.log('[e2e-loop] OK: perceive → checkpoint → integrate → rollback → verify → parity all passed')
