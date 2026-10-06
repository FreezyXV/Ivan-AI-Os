import { PILOT_STATE } from '../../../shared/pilot-state.mjs';
// Public, compact operator context. No profile, portfolio or caller policy.
export const PILOT_CONTEXT = Object.freeze({
  version: 'mac-alerts-20261006-v6',
  active: Object.freeze(['business', 'finance', 'engineering', 'system']),
  deferred: Object.freeze([...PILOT_STATE.pausedRoutes, ...PILOT_STATE.deferredProjects]),
  priorities: Object.freeze(['system','engineering','business','finance']),
  stack: Object.freeze(['Mac','Node.js','TypeScript','Next.js','Git','Codex','Claude Code','OpenClaw','Jev','TypeSafe','Obsidian','Telegram']),
  facts: Object.freeze([
    'Le pilote fonctionne sur un Mac ; aucun serveur permanent n’est activé.',
    'Codex, Claude Code et OpenClaw collaborent avec Git et une mémoire Obsidian.',
    'Ivan construit une entreprise virtuelle : agents coordonnés, skills, mémoire et bots Telegram doivent fonctionner ensemble de façon fiable.',
    'Le besoin immédiat est un système utile sur Mac : résumés autonomes avec faits, utilité concrète et prochaine étape proportionnée, sans devoir ouvrir chaque lien.',
    'Jev (TypeSafe) a un plafond dur mensuel appliqué par le gateway. Les complétions natives et les autres services payants ne sont ni plafonnés ni mesurés par Ivan AI OS.',
    'Les nouveaux projets web partent par défaut sur Next.js et TypeScript ; l’inventaire des projets existants et de leurs versions n’est pas connu du système. Les services sont en Node.js.',
    'La veille Finance porte sur les données publiques BCE, inflation et taux, sans portefeuille.'
  ]),
  goals: Object.freeze({
    business: 'Identifier des problèmes monétisables étayés par des preuves.',
    finance: 'Comprendre les évolutions macro et marchés publics, sans transaction ni portefeuille.',
    engineering: 'Construire Ivan AI OS et rendre le travail logiciel plus efficace.',
    system: 'Fiabiliser le pilote Mac et réduire les coûts, doublons et interruptions.'
  })
});
export const ALERT_SELECTION_QUESTION='alerts.pertinence.mac-v3';
export class AlertError extends Error { constructor(code) { super(code); this.code = code; } }
export const fail = code => { throw new AlertError(code); };
export function canonicalUrl(value) {
  let u; try { u = new URL(value); } catch { fail('ALERT_URL_INVALID'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[|.*\.local$)/i.test(u.hostname)) fail('ALERT_URL_INVALID');
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|ref$)/i.test(key)) u.searchParams.delete(key);
  // Site-specific aliases: arbitrary /resource and /resource/ can differ.
  if(u.hostname==='nextjs.org'&&/^\/blog\/[^/]+\/$/.test(u.pathname))u.pathname=u.pathname.slice(0,-1);
  if(u.hostname==='mistral.ai'&&/^\/news\/[a-z0-9-]+\/*$/.test(u.pathname))u.pathname=u.pathname.replace(/\/*$/,'/');
  u.hash = ''; return u.href;
}
export function sourceMaxAgeHours(item){
  const u=new URL(item.url);
  if(u.hostname==='www.ecb.europa.eu'&&/^\/{1,2}press\/(key|pr|inter)\//.test(u.pathname))return 168;
  if(u.hostname==='nextjs.org'&&/^\/blog\/(?:[a-z0-9-]*security-(?:release|update|advisory)|cve-)/.test(u.pathname))return 168;
  return 72;
}
export function suspiciousSource(text){
  return /ignore\s+(?:(?:all|your|previous)\s+)*instructions|system\s+note\s+to\s+ai|(?:include|send|reveal|print|exfiltrate)\b[^.!?]{0,80}\b(?:secret|token|api[ -]?key)|classify\s+(?:this\s+)?as\s+urgent/i.test(text);
}
export function insufficientShortEvidence(item){
  const excerpt=item.excerpt.trim();
  if(excerpt.length>=200)return false;
  // Length alone is not a quality measure. Hold short incident allegations or
  // rumours lacking named attribution; preserve actual official observations.
  const titleIncident=/\b(?:GitHub|OpenAI|Codex|Claude|Anthropic)\s+(?:is\s+)?(?:down|unavailable|at capacity)\b/i.test(item.title);
  const allegation=titleIncident||/\b(?:(?:GitHub|OpenAI|Codex|Claude|Anthropic|service|server|API)\s+(?:is\s+)?(?:down|unavailable|at capacity)|(?:Codex|Claude|Anthropic)\b[^.!?]{0,40}\bat capacity|down\s+again|outage|hacked|breach|rumou?r|unconfirmed|panne|rumeur|pirat[ée]|non confirm[ée])\b/i.test(excerpt);
  if(!allegation)return false;
  const host=new URL(item.url).hostname;
  if(['www.ecb.europa.eu','nextjs.org','www.githubstatus.com','status.openai.com','status.anthropic.com'].includes(host))return false;
  const attributed=/\b(?:according to|selon)\s+(?:(?:the|la|le)\s+)?(?:ECB|BCE|GitHub|OpenAI|Anthropic|Microsoft|Cloudflare)\b/i.test(excerpt);
  return !attributed;
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
  const coverage=[item.textChars,item.excerptMode,item.excerptTruncated];
  if(coverage.some(v=>v!==undefined)&&(!Number.isSafeInteger(item.textChars)||item.textChars<item.excerpt.replaceAll(' […] ','').length||item.textChars>400000||
     !['head','passages'].includes(item.excerptMode)||typeof item.excerptTruncated!=='boolean'))fail('ALERT_ITEM_INVALID');
  return { producer:item.producer, url:canonicalUrl(item.url), title:item.title.trim(), topic:item.topic,
    scope:'public', publishedAt:item.publishedAt, observedAt:item.observedAt,
    sourceStatus:item.sourceStatus, excerpt:item.excerpt, ...(item.sourceStatus==='read'?{readAt:item.readAt}:{}),
    ...(item.textChars!==undefined?{textChars:item.textChars,excerptMode:item.excerptMode,excerptTruncated:item.excerptTruncated}:{}) };
}
export function prefilter(item, { now = Date.now(), maxAgeHours = sourceMaxAgeHours(item) } = {}) {
  if (!Number.isFinite(now) || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0) fail('ALERT_FILTER_CONFIG_INVALID');
  if (PILOT_CONTEXT.deferred.includes(item.topic)) return { decision:'skip', reason:'TOPIC_DEFERRED' };
  if (Date.parse(item.publishedAt) > now + 300000 || Date.parse(item.observedAt) > now + 300000 || (item.readAt && Date.parse(item.readAt) > now + 300000)) return { decision:'review', reason:'SOURCE_DATE_IN_FUTURE' };
  if (now - Date.parse(item.publishedAt) > maxAgeHours * 3600000) return { decision:'skip', reason:'SOURCE_STALE' };
  if (item.sourceStatus !== 'read') return { decision:'review', reason:'SOURCE_NOT_READ' };
  if(suspiciousSource(item.excerpt))return {decision:'review',reason:'INJECTION_SUSPECTE'};
  if(insufficientShortEvidence(item))return {decision:'review',reason:'SOURCE_EVIDENCE_INSUFFICIENT'};
  if(new URL(item.url).hostname==='nextjs.org'&&
      /\b(?:we plan to publish|we will publish|upcoming security release)\b/i.test(item.excerpt)&&
      !/\b(?:updates are now available|patched versions are available|we have released)\b/i.test(item.excerpt))
    return {decision:'review',reason:'SOURCE_RELEASE_PREVIEW'};
  return { decision:'select', reason:'SELECTION_REQUIRED' };
}
