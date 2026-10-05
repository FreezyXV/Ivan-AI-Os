import { readDecisionToken } from '../../jev-gateway/src/runtime-token.js';
import { PILOT_CONTEXT, fail, validateItem, suspiciousSource } from './context.js';

export function createJevSelector({ gatewayUrl = 'http://127.0.0.1:4311',
  token = readDecisionToken(), timeoutMs = 10000, fetchImpl = fetch } = {}) {
  let url;
  try { url = new URL(gatewayUrl); } catch { fail('ALERT_SELECTOR_CONFIG_INVALID'); }
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      typeof token !== 'string' || token.length < 32 || token.length > 4000 || /\s/.test(token) ||
      !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000)
    fail('ALERT_SELECTOR_CONFIG_INVALID');
  return async (raw, _context, { signal } = {}) => {
    const item = validateItem(raw);
    // Local exclusions are free even if this adapter is called outside the queue.
    if (PILOT_CONTEXT.deferred.includes(item.topic)) return { decision: 'skip', confidence: 1,
      provider: 'deterministic-kernel', context_version: PILOT_CONTEXT.version };
    if (item.sourceStatus !== 'read'||suspiciousSource(item.excerpt)) return { decision: 'review', confidence: 0,
      provider: 'deterministic-kernel', context_version: PILOT_CONTEXT.version };
    const body = { scope: 'public', topic: item.topic, title: item.title,
      excerpt: item.excerpt, context_version: PILOT_CONTEXT.version };
    try {
      const response = await fetchImpl(new URL('/v1/alerts/select', url), {
        method: 'POST', redirect: 'error', signal: signal ? AbortSignal.any([signal,AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!response.ok) fail('ALERT_SELECTION_UNAVAILABLE');
      const result = await response.json();
      if (result?.question !== 'alerts.pertinence.mac-v1' ||
          !['keep', 'review', 'skip'].includes(result.decision) ||
          !['jev', 'deterministic-kernel'].includes(result.provider) ||
          !Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1 ||
          result.context_version !== PILOT_CONTEXT.version ||
          !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(result.request_id ?? '')) fail('ALERT_SELECTION_UNAVAILABLE');
      const p = result.probabilities, keys = ['keep', 'review', 'skip'];
      const probabilities = p && typeof p === 'object' && Object.keys(p).length === 3 && keys.every(k => Number.isFinite(p[k]) && p[k] >= 0 && p[k] <= 1) &&
        Math.abs(keys.reduce((sum, k) => sum + p[k], 0) - 1) <= 0.03 ? Object.fromEntries(keys.map(k => [k, p[k]])) : undefined;
      return { decision: result.decision, confidence: result.confidence,
        provider: result.provider, context_version: result.context_version, request_id: result.request_id,
        ...(probabilities ? { probabilities } : {}) };
    } catch { fail('ALERT_SELECTION_UNAVAILABLE'); }
  };
}
