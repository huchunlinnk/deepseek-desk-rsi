import { registerPerceive } from './tools/perceive.js'
import { registerCheckpoint } from './tools/checkpoint.js'
import { registerRollback } from './tools/rollback.js'
import { registerVerify } from './tools/verify.js'
import { registerParity } from './tools/parity.js'
import { registerPropose } from './tools/propose.js'
import { registerLoopPrompt } from './prompt.js'

/** Cordis plugin identity, consumed by the DSH loader. */
export const name = 'dsh-desk-rsi'

/** Services this plugin waits for before applying. */
export const inject = ['tools', 'systemPrompt']

/**
 * Register the RSI engine's six tools. The loop itself is orchestrated by the
 * agent (perceive → integrate → verify → parity → repair → propose); this
 * plugin only contributes the RSI-specific primitives.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  registerPerceive(ctx)
  registerCheckpoint(ctx)
  registerRollback(ctx)
  registerVerify(ctx)
  registerParity(ctx)
  registerPropose(ctx)
  registerLoopPrompt(ctx)
}
