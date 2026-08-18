import { exec as execCallback } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(execCallback)

/** Cap on captured stdout/stderr per run, keeping every tool result bounded. */
const MAX_CAPTURE = 200_000

/** Default command timeout: ten minutes covers a desktop build + test. */
const DEFAULT_TIMEOUT_MS = 600_000

/**
 * @typedef {object} RunResult
 * @property {boolean} ok true only when the command exited with code 0.
 * @property {number} exitCode process exit code (1 when the shell was killed).
 * @property {string} stdout captured stdout, tail-truncated.
 * @property {string} stderr captured stderr, tail-truncated.
 */

/** Keep only the tail of long output so results never blow past MAX_CAPTURE. */
function tail(text, limit) {
  if (text.length <= limit) return text
  return `…[truncated ${text.length - limit} chars]…\n${text.slice(-limit)}`
}

/**
 * Run a shell command and capture bounded output. Never throws — failures come
 * back as `{ ok: false, exitCode, stderr }` so the repair loop can branch on them.
 *
 * @param {string} command shell command to run.
 * @param {{ cwd?: string, timeoutMs?: number }} [options]
 * @returns {Promise<RunResult>}
 */
export async function run(command, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: options.cwd,
      timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxBuffer: 32 * 1024 * 1024,
    })
    return { ok: true, exitCode: 0, stdout: tail(stdout, MAX_CAPTURE), stderr: tail(stderr, MAX_CAPTURE) }
  } catch (error) {
    const err = /** @type {{ code?: number, stdout?: string, stderr?: string, message?: string }} */ (error)
    return {
      ok: false,
      exitCode: typeof err.code === 'number' ? err.code : 1,
      stdout: tail(err.stdout ?? '', MAX_CAPTURE),
      stderr: tail(err.stderr ?? err.message ?? '', MAX_CAPTURE),
    }
  }
}
