import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildFinanceThesis, compareFinanceObservations, financeThesisFromBundle } from '../src/finance-thesis.js';

const now = new Date('2026-11-19T13:00:00Z');
const sha = text => createHash('sha256').update(text).digest('hex');
const quoteUrl = 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin';
const quote = {
  instrumentId: 'coinpaprika:btc-bitcoin', seriesId: 'coinpaprika:btc-bitcoin:aggregate:USD',
  measure: 'price', unit: 'USD', value: 10,
  asOf: '2026-11-19T12:00:00Z', readAt: '2026-11-19T12:05:00Z',
  sourceUrl: quoteUrl, sourceSha256: sha('synthetic base quote')
};

function marketWith(overrides = {}) {
  const text = JSON.stringify({
    provider: 'CoinPaprika', id: 'btc-bitcoin', quoteCurrency: 'USD', asOf: quote.asOf,
    metrics: { priceUsd: 10, circulatingSupply: 20, maxSupply: null, volume24hUsd: 40 },
    ...overrides
  });
  return {kind: 'market-data', url: quoteUrl, publishedAt: quote.asOf, readAt: quote.readAt, text, sha256: sha(text)};
}

test('asset scenarios are reproducible sensitivity arithmetic with explicit assumptions and source', () => {
  const result = buildFinanceThesis(quote,{horizon:'medium',shocksBps:[-1500,0,2500]});
  assert.equal(result.valuation, null);
  assert.equal(result.horizon, 'medium');
  assert.equal(result.observation.sourceSha256, quote.sourceSha256);
  assert.deepEqual(result.scenarios.map(s => [s.shockBps,s.referenceIndex]), [[-1500,85],[0,100],[2500,125]]);
  assert.match(result.formula, /100/);
  assert.match(result.limitations.join(' '), /prix cible/);
  assert.throws(() => buildFinanceThesis(quote,{horizon:'medium',shocksBps:[-10,10,20]}), {code:'FINANCE_THESIS_SCENARIOS_INVALID'});
  assert.throws(() => buildFinanceThesis({...quote,value:0},{horizon:'medium'}), {code:'FINANCE_THESIS_OBSERVATION_INVALID'});
});

test('the dossier uses verified provider evidence and preserves missing supply as unknown', () => {
  const raw = marketWith();
  const bundle = {topic:'finance',category:'asset',sources:[raw]};
  const result = financeThesisFromBundle(bundle,{horizon:'short'});
  assert.equal(result.observation.instrumentId, 'coinpaprika:btc-bitcoin');
  assert.equal(result.observation.value, 10);
  assert.equal(result.observation.unit, 'USD');
  assert.equal(result.observation.sourceSha256, raw.sha256);
  assert.equal(result.reportedMetrics.maxSupply, null);
  assert.equal(result.reportedMetrics.volume24hUsd, 40);
  assert.equal(result.reportedMetrics.marketCapUsd, null);
  assert.match(result.limitations.join(' '), /liquidité exécutable/);
  assert.equal(financeThesisFromBundle({...bundle,sources:[{...raw,sha256:sha('wrong')}]}), null);
  assert.equal(financeThesisFromBundle({...bundle,sources:[{...raw,url:'https://example.com/v1/tickers/btc-bitcoin'}]}), null);
  assert.equal(financeThesisFromBundle({...bundle,sources:[marketWith({id:'eth-ethereum'})]}), null);
  assert.equal(financeThesisFromBundle({...bundle,sources:[marketWith({asOf:'2026-11-19T12:01:00Z'})]}), null);
  assert.equal(financeThesisFromBundle({...bundle,category:'macro'}), null);
});

const nextQuote = (value, overrides = {}) => ({...quote, value, asOf:'2026-11-19T12:30:00Z',
  readAt:'2026-11-19T12:55:00Z', sourceSha256:sha('synthetic next quote '+value), ...overrides});
const check = (baseline, current, threshold = {kind:'relative-percent',value:10}) =>
  compareFinanceObservations(baseline,current,{now,maxAgeMs:3600000,threshold});

test('material change compares validated readings inclusively with a threshold and direction', () => {
  const result = check(quote,nextQuote(11));
  assert.equal(result.status,'material');
  assert.deepEqual(result.change,{value:10,unit:'relative-percent'});
  assert.equal(result.current.sourceSha256,nextQuote(11).sourceSha256);
  assert.equal(check(quote,nextQuote(10.9)).status,'unchanged');
  assert.equal(check(quote,nextQuote(11),{kind:'relative-percent',value:10,direction:'decrease'}).status,'unchanged');
  assert.equal(check(quote,nextQuote(9),{kind:'relative-percent',value:10,direction:'decrease'}).status,'material');
});

test('an incompatible, undated, stale or unrepeated quote never triggers a watch', () => {
  for (const patch of [{unit:'EUR'},{seriesId:'venue:bitcoin'},{instrumentId:'coinpaprika:other'},{sourceUrl:'https://example.com/quote'}]) {
    assert.equal(check(quote,nextQuote(11,patch)).status,'incompatible');
  }
  assert.equal(check(quote,nextQuote(11,{asOf:'2026-11-19T13:01:00Z',readAt:'2026-11-19T13:02:00Z'})).status,'future');
  assert.equal(check(quote,nextQuote(11,{asOf:quote.asOf})).status,'not-newer');
  assert.equal(check({...quote,asOf:'2026-11-19T10:00:00Z'},nextQuote(11,{asOf:'2026-11-19T11:50:00Z'})).status,'stale');
  assert.throws(() => check(quote,nextQuote(11,{asOf:'2026-02-30T12:00:00Z'})), {code:'FINANCE_THESIS_OBSERVATION_INVALID'});
});

test('macro comparisons distinguish percentage points from relative price changes', () => {
  const rate = {...quote, instrumentId:'ecb:deposit-facility',seriesId:'ecb:deposit-facility:rate',measure:'rate',unit:'%',value:4};
  const change = { ...rate, asOf:'2026-11-19T12:30:00Z',value:4.1,sourceSha256:sha('rate 4.1'),readAt:'2026-11-19T12:50:00Z' };
  const result = check(rate,change,{kind:'absolute-points',value:0.1});
  assert.equal(result.status,'material');
  assert.deepEqual(result.change,{value:0.1,unit:'percentage-points'});
  assert.throws(() => check(rate,change),{code:'FINANCE_THESIS_THRESHOLD_INVALID'});
});
