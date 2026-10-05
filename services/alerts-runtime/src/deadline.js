import { AlertError, fail } from './context.js';

// A callback receives a signal so a native adapter can cancel its request.
// The queue still finishes on time if an injected callback ignores that signal.
export async function withDeadline(call, timeoutMs, code) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 10 || timeoutMs > 60000)
    fail('ALERT_DEADLINE_CONFIG_INVALID');
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AlertError(code));
    }, timeoutMs);
  });
  try { return await Promise.race([Promise.resolve().then(() => call(controller.signal)), deadline]); }
  finally { clearTimeout(timer); }
}
