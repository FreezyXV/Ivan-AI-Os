import { PILOT_STATE } from '../../../shared/pilot-state.mjs';
// Public, compact operator context. No profile, portfolio or caller policy.
export const PILOT_CONTEXT = Object.freeze({
  version: PILOT_STATE.version,
  active: Object.freeze(['business', 'finance', 'engineering', 'system']),
  deferred: Object.freeze([...PILOT_STATE.pausedRoutes, ...PILOT_STATE.deferredProjects]),
  goals: Object.freeze({
    business: 'Identifier des problèmes monétisables étayés par des preuves.',
    finance: 'Comprendre les évolutions macro et marchés publics, sans transaction ni portefeuille.',
    engineering: 'Construire Ivan AI OS et rendre le travail logiciel plus efficace.',
    system: 'Fiabiliser le pilote Mac et réduire les coûts, doublons et interruptions.'
  })
});
export class AlertError extends Error { constructor(code) { super(code); this.code = code; } }
export const fail = code => { throw new AlertError(code); };
export function canonicalUrl(value) {
  let u; try { u = new URL(value); } catch { fail('ALERT_URL_INVALID'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[|.*\.local$)/i.test(u.hostname)) fail('ALERT_URL_INVALID');
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|ref$)/i.test(key)) u.searchParams.delete(key);
  u.hash = ''; return u.href;
}
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ||
      !Number.isFinite(Date.parse(value))) return false;
  const normalized = value.length === 20 ? value.replace('Z', '.000Z') : value;
  return new Date(value).toISOString() === normalized;
}
export function validateItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || item.scope !== 'public' ||
      typeof item.producer !== 'string' || !/^[a-z][a-z0-9-]{1,31}$/.test(item.producer) ||
      typeof item.title !== 'string' || !item.title.trim() || item.title.length > 200 ||
      ![...PILOT_CONTEXT.active, ...PILOT_CONTEXT.deferred, 'other'].includes(item.topic) ||
      !timestamp(item.publishedAt) || !timestamp(item.observedAt) ||
      !['read', 'unavailable', 'title-only'].includes(item.sourceStatus) ||
      typeof item.excerpt !== 'string' || item.excerpt.length > 1200 ||
      (item.sourceStatus === 'read' && (!timestamp(item.readAt) || item.excerpt.trim().length < 20))) fail('ALERT_ITEM_INVALID');
  // Producer adapters are responsible for fetching the source. This envelope
  // carries that evidence; a timestamp alone is not a proof of true content.
  return { producer:item.producer, url:canonicalUrl(item.url), title:item.title.trim(), topic:item.topic,
    scope:'public', publishedAt:item.publishedAt, observedAt:item.observedAt,
    sourceStatus:item.sourceStatus, excerpt:item.excerpt, ...(item.sourceStatus==='read'?{readAt:item.readAt}:{}) };
}
export function prefilter(item, { now = Date.now(), maxAgeHours = 72 } = {}) {
  if (!Number.isFinite(now) || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0) fail('ALERT_FILTER_CONFIG_INVALID');
  if (PILOT_CONTEXT.deferred.includes(item.topic)) return { decision:'skip', reason:'TOPIC_DEFERRED' };
  if (Date.parse(item.publishedAt) > now + 300000 || Date.parse(item.observedAt) > now + 300000 || (item.readAt && Date.parse(item.readAt) > now + 300000)) return { decision:'review', reason:'SOURCE_DATE_IN_FUTURE' };
  if (now - Date.parse(item.publishedAt) > maxAgeHours * 3600000) return { decision:'skip', reason:'SOURCE_STALE' };
  if (item.sourceStatus !== 'read') return { decision:'review', reason:'SOURCE_NOT_READ' };
  return { decision:'select', reason:'SELECTION_REQUIRED' };
}
