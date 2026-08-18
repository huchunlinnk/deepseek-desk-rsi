import { registerPerceive } from './tools/perceive.js'
import { registerCheckpoint } from './tools/checkpoint.js'
import { registerRollback } from './tools/rollback.js'
import { registerVerify } from './tools/verify.js'
import { registerPropose } from './tools/propose.js'

/** Cordis plugin identity, consumed by the DSH loader. */
export const name = 'dsh-desk-rsi'

/** Services this plugin waits for before applying. */
export const inject = ['tools']

/**
 * Register the RSI engine's five tools. The loop itself is orchestrated by the
 * agent (perceive → integrate → verify → repair → propose); this plugin only
 * contributes the RSI-specific primitives.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  registerPerceive(ctx)
  registerCheckpoint(ctx)
  registerRollback(ctx)
  registerVerify(ctx)
  registerPropose(ctx)
}
