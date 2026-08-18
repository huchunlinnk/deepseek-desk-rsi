// Smoke test: verifies the bundle loads and registers all five rsi_* tools.
//
// Requires the @deepseek-ai/cordis and @deepseek-ai/dsh-tools packages to be
// resolvable (they are provided by a DSH profile install, or symlink a DSH
// checkout's packages into node_modules for local development).
import { apply, name } from '../index.js'

/** @type {Array<{ name: string, description: string, execute: Function }>} */
const registered = []
const fakeCtx = {
  tools: {
    register(definition) {
      registered.push(definition)
    },
  },
}

apply(fakeCtx)

const expected = ['rsi_perceive', 'rsi_checkpoint', 'rsi_rollback', 'rsi_verify', 'rsi_propose']
const actual = registered.map((tool) => tool.name)

if (name !== 'dsh-desk-rsi') throw new Error(`bad plugin name: ${name}`)
for (const tool of expected) {
  if (!actual.includes(tool)) throw new Error(`missing tool: ${tool}`)
  const definition = registered.find((t) => t.name === tool)
  if (typeof definition.execute !== 'function') throw new Error(`tool ${tool} has no execute`)
  if (typeof definition.description !== 'string' || definition.description.length === 0) {
    throw new Error(`tool ${tool} has no description`)
  }
}

console.log(`[smoke] OK: ${name} registered ${actual.length} tools: ${actual.join(', ')}`)
