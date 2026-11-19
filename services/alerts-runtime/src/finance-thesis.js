import { createHash } from 'node:crypto';
import { canonicalUrl } from './context.js';

const observationError = 'FINANCE_THESIS_OBSERVATION_INVALID';
const scenarioError = 'FINANCE_THESIS_SCENARIOS_INVALID';
const thresholdError = 'FINANCE_THESIS_THRESHOLD_INVALID';
const identifier = /^[a-z0-9][a-z0-9._:-]{0,159}$/i;
const isoUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const hash = text => createHash('sha256').update(text).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };

function timestamp(value) {
  if (typeof value !== 'string' || !isoUtc.test(value) || !Number.isFinite(Date.parse(value))) fail(observationError);
  const normalized = new Date(value).toISOString();
  if (normalized !== (value.includes('.') ? value : value.replace('Z', '.000Z'))) fail(observationError);
  return normalized;
}

// A series ID identifies a specific measurement and method, such as an aggregated
// USD spot price or an official policy rate. A symbol alone is never sufficient.
function observation(raw) {
  if (!raw || typeof raw !== 'object') fail(observationError);
  const { instrumentId, seriesId, measure, unit, value, sourceSha256 } = raw;
  const validUnit = typeof unit === 'string' && (
    (measure === 'price' && /^[A-Z]{3}$/.test(unit)) ||
    (measure === 'rate' && unit === '%') || (measure === 'index' && unit === 'point')
  );
  if (!validUnit || ![instrumentId,seriesId].every(id => typeof id === 'string' && identifier.test(id) && id.includes(':')) ||
      typeof value !== 'number' || !Number.isFinite(value) || (measure !== 'rate' && value <= 0) ||
      typeof sourceSha256 !== 'string' || !/^[a-f\d]{64}$/.test(sourceSha256) ||
      typeof raw.sourceUrl !== 'string' || raw.sourceUrl.length > 500 || /[\x00-\x20\x7f]/.test(raw.sourceUrl)) fail(observationError);
  let sourceUrl;
  try { sourceUrl = canonicalUrl(raw.sourceUrl); } catch { fail(observationError); }
  const asOf = timestamp(raw.asOf), readAt = timestamp(raw.readAt);
  if (Date.parse(asOf) > Date.parse(readAt) + 300000) fail(observationError);
  return {instrumentId, seriesId, measure, unit, value, asOf, readAt, sourceUrl, sourceSha256};
}

// Keep stress results in base 100, apart from the observed price. The shocks are
// inputs to sensitivity arithmetic, never estimated probabilities or prices.
export function buildFinanceThesis(rawObservation, {horizon, shocksBps = [-2000, 0, 2000]} = {}) {
  const baseline = observation(rawObservation);
  if (baseline.measure !== 'price' || !['short','medium','long'].includes(horizon) ||
      !Array.isArray(shocksBps) || shocksBps.length !== 3 ||
      !shocksBps.every(bps => Number.isSafeInteger(bps)) ||
      shocksBps[0] < -10000 || shocksBps[0] >= 0 || shocksBps[1] !== 0 ||
      shocksBps[2] <= 0 || shocksBps[2] > 1000000) fail(scenarioError);
  return {
    version: 'finance-thesis-v1',
    horizon,
    observation: baseline,
    scenarios: ['downside','unchanged','upside'].map((id, index) => ({
      id, shockBps: shocksBps[index], referenceIndex: (10000 + shocksBps[index]) / 100
    })),
    formula: 'indice base 100 = (10 000 + variation supposée en points de base) / 100',
    valuation: null,
    limitations: [
      'Les chocs sont des hypothèses de sensibilité. Ils ne donnent ni probabilité, ni prévision, ni prix cible.',
      'L’indice illustre la seule variation du prix de référence. Frais, fiscalité, change et revenus ne sont pas modélisés.'
    ]
  };
}

const reportedMetricKeys = ['marketCapUsd','volume24hUsd','circulatingSupply','totalSupply','maxSupply'];

// Adapt only the known structured evidence emitted by the existing collector.
// Other asset adapters can construct an observation once their data is verified.
export function financeThesisFromBundle(bundle, options) {
  if (bundle?.topic !== 'finance' || bundle.category !== 'asset' || !Array.isArray(bundle.sources)) return null;
  const marketSources = bundle.sources.filter(source => source?.kind === 'market-data');
  if (marketSources.length !== 1) return null;
  const [source] = marketSources;
  if (typeof source.text !== 'string' || source.text.length > 6000 || source.sha256 !== hash(source.text)) return null;
  let data, baseline;
  try {
    data = JSON.parse(source.text);
    if (data?.provider !== 'CoinPaprika' || data.quoteCurrency !== 'USD' || typeof data.id !== 'string' ||
        !/^[a-z0-9]{1,15}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id) ||
        source.url !== `https://api.coinpaprika.com/v1/tickers/${data.id}` ||
        timestamp(data.asOf) !== timestamp(source.publishedAt)) return null;
    baseline = observation({
      instrumentId: `coinpaprika:${data.id}`, seriesId: `coinpaprika:${data.id}:aggregate:USD`,
      measure: 'price', unit: 'USD', value: data.metrics?.priceUsd, asOf: data.asOf,
      readAt: source.readAt, sourceUrl: source.url, sourceSha256: source.sha256
    });
  } catch { return null; }
  const reportedMetrics = Object.fromEntries(reportedMetricKeys.map(key => [key,data.metrics[key] ?? null]));
  if (Object.values(reportedMetrics).some(value => value !== null && (!Number.isFinite(value) || value < 0))) return null;
  const thesis = buildFinanceThesis(baseline, options);
  return {
    ...thesis,
    reportedMetrics,
    missingMetrics: reportedMetricKeys.filter(key => reportedMetrics[key] === null),
    limitations: [...thesis.limitations,
      'L’agrégateur rapporte des volumes et quantités. La liquidité exécutable, le calendrier des émissions et la capture de valeur restent à établir séparément.'
    ]
  };
}

// Each explicit threshold compares the current observation with the saved
// baseline. An old baseline is valid for a multi-period thesis. A stale current
// reading never reopens it. Two different methodologies may not be mixed.
export function compareFinanceObservations(rawBaseline, rawCurrent, {now, maxAgeMs, threshold} = {}) {
  const baseline = observation(rawBaseline), current = observation(rawCurrent);
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) || !Number.isSafeInteger(maxAgeMs) || maxAgeMs <= 0) {
    fail('FINANCE_THESIS_COMPARISON_INVALID');
  }
  const {kind, value, direction = 'either'} = threshold ?? {};
  if (!['relative-percent','absolute-points'].includes(kind) || typeof value !== 'number' || !Number.isFinite(value) ||
      value <= 0 || !['either','increase','decrease'].includes(direction)) fail(thresholdError);

  const comparedAt = now.toISOString();
  const receipt = {baseline, current, comparedAt, maxAgeMs, threshold:{kind,value,direction}};
  const hold = status => ({...receipt,status,change:null});
  const sameSeries = ['instrumentId','seriesId','measure','unit'].every(key => baseline[key] === current[key]);
  if (!sameSeries || new URL(baseline.sourceUrl).origin !== new URL(current.sourceUrl).origin) return hold('incompatible');
  if ((baseline.measure === 'rate' && kind !== 'absolute-points') ||
      (baseline.measure === 'price' && kind !== 'relative-percent')) fail(thresholdError);
  const asOf = Date.parse(current.asOf);
  if (asOf > now.getTime() || Date.parse(current.readAt) > now.getTime()) return hold('future');
  if (now.getTime() - asOf > maxAgeMs) return hold('stale');
  if (asOf <= Date.parse(baseline.asOf)) return hold('not-newer');

  const difference = current.value - baseline.value;
  const rawChange = kind === 'relative-percent' ? (difference / baseline.value) * 100 : difference;
  if (!Number.isFinite(rawChange)) return hold('unavailable');
  // The reported change and decision use the same precision, including when a
  // decimal threshold sits on a binary floating-point rounding boundary.
  const change = Number(rawChange.toPrecision(12));
  const exceedsThreshold = Math.abs(change) >= value;
  const matchesDirection = direction === 'either' || (direction === 'increase' ? change > 0 : change < 0);
  const unit = kind === 'relative-percent' ? kind : baseline.measure === 'rate' ? 'percentage-points' : 'index-points';
  return {...receipt, status:exceedsThreshold && matchesDirection ? 'material' : 'unchanged', change:{value:change,unit}};
}
