import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fail } from './context.js';

const run = promisify(execFile);
const messageId = value => typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value);

// Contracts observed in OpenClaw 2026.9.5 register.message and Telegram send.
// A dry-run, partial delivery or arbitrary top-level ID is never a receipt.
export function parseTelegramReceipt(output, target) {
  let result;
  try {
    if (typeof output !== 'string' || output.length > 1024 * 1024) throw Error();
    result = JSON.parse(output.slice(output.indexOf('{')));
  } catch { fail('ALERT_TELEGRAM_RECEIPT_INVALID'); }
  const payload = result.payload;
  const native = result.handledBy === 'core' ? payload?.result : payload;
  const delivered = result.handledBy === 'core' ? payload?.deliveryStatus === 'sent' :
    result.handledBy === 'plugin' && payload?.ok === true;
  if (result.action !== 'send' || result.channel !== 'telegram' || result.dryRun !== false ||
      result.ok === false || result.error || result.sentBeforeError || payload?.ok === false ||
      (result.deliveryStatus !== undefined && result.deliveryStatus !== 'sent') ||
      (payload?.deliveryStatus !== undefined && payload.deliveryStatus !== 'sent') || payload?.sentBeforeError ||
      !delivered || !messageId(native?.messageId) || result.messageId !== native.messageId ||
      String(native.chatId) !== target) fail('ALERT_TELEGRAM_RECEIPT_INVALID');
  return { delivered: true, messageId: native.messageId };
}

export function createTelegramDelivery({ target, account, binary = 'openclaw',
  timeoutMs = 20000, silent = true, runImpl = run } = {}) {
  // The caller supplies Ivan's one authorized private chat from private config.
  // No usernames, groups, model-selected recipients or caller-supplied command.
  if (typeof target !== 'string' || !/^[1-9]\d{4,15}$/.test(target) ||
      (account !== undefined && !/^[a-zA-Z0-9_-]{1,64}$/.test(account)) ||
      typeof binary !== 'string' || !binary || typeof runImpl !== 'function' ||
      !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 25000 ||
      typeof silent !== 'boolean') fail('ALERT_TELEGRAM_CONFIG_INVALID');
  return async ({ text, signal }) => {
    if (typeof text !== 'string' || !text.trim() || text.length > 2500 || /\x00/.test(text))
      fail('ALERT_TELEGRAM_MESSAGE_INVALID');
    signal?.throwIfAborted();
    const args = ['message', 'send', '--channel', 'telegram', '--target', target,
      '--message', text, '--json', ...(account ? ['--account', account] : []),
      ...(silent ? ['--silent'] : [])];
    try {
      // Native CLI resolves SecretRefs and channel policies; no raw bot token.
      const { stdout } = await runImpl(binary, args, {
        timeout: timeoutMs, signal, maxBuffer: 1024 * 1024, windowsHide: true
      });
      return parseTelegramReceipt(stdout, target);
    } catch { fail('ALERT_TELEGRAM_DELIVERY_UNKNOWN'); }
  };
}
