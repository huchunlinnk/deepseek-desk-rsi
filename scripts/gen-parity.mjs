// Regenerate parity.json from the official dsh-base + dsh-web-app bundle patches.
//
// Usage:
//   node scripts/gen-parity.mjs /path/to/deepseek-harness [output]
//
// This keeps the parity contract mechanically derived from the source of truth
// (the official bundle layers) instead of hand-edited. Re-run it whenever the
// upstream harness adds, removes, or renames a plugin.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const checkout = process.argv[2]
if (!checkout) {
  console.error('usage: node scripts/gen-parity.mjs /path/to/deepseek-harness [output]')
  process.exit(1)
}

const base = readFileSync(resolve(checkout, 'packages/bundle/base/cordis.patch.yml'), 'utf8')
const web = readFileSync(resolve(checkout, 'packages/bundle/web-app/cordis.patch.yml'), 'utf8')

const names = new Set()
for (const src of [base, web]) {
  for (const match of src.matchAll(/name:\s*['"]([^'"]+)['"]/g)) {
    names.add(match[1])
  }
}

const manifest = {
  profile: 'web',
  hostUrl: 'http://127.0.0.1:3080',
  endpoints: [{ url: 'http://127.0.0.1:3080/', status: 200 }],
  dumpCommand: 'npx @deepseek-ai/dsh --profile web --dump-config',
  requiredPlugins: [...names].sort(),
  note: 'requiredPlugins is the union of the dsh-base and dsh-web-app bundle rows — the complete original DeepSeek Harness feature surface. After an RSI sync, a missing name means upstream removed or renamed a capability and the desktop no longer has 1:1 parity.',
}

const out = process.argv[3] ?? 'parity.json'
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`wrote ${out}: ${names.size} required plugins`)
