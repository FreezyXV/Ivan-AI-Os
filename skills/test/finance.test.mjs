import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PARSERS, SOURCES, alerts, collect, judge, privateDir, report, saveSnapshot, snapshots } from "../finance-engine/scripts/veille.mjs";

const ecb = (date, value) => JSON.stringify({ dataSets: [{ series: { "0:0": { observations: { "0": [value] } } } }], structure: { dimensions: { observation: [{ values: [{ id: date }] }] } } });
const kraken = (closes, start = Date.UTC(2026, 7, 29) / 1000) => JSON.stringify({ error: [], result: { XXBTZEUR: closes.map((c, i) => [start + i * 86400, "0", "0", "0", String(c)]), last: 0 } });
const closes = (last, sevenAgo) => [...Array(23).fill(100), sevenAgo, ...Array(6).fill(100), last];

function fixtureFetch({ failing = [], dfr = 2.5 } = {}) {
  return async url => {
    const src = SOURCES.find(s => s.url === url);
    if (failing.includes(src.id)) return { ok: false, status: 503, text: async () => "" };
    const body = { bce_taux_depot: ecb("2026-09-16", dfr), inflation_zone_euro: ecb("2025-12", 1.9), inflation_sous_jacente: ecb("2025-12", 2.3),
      eur_usd: ecb("2026-09-29", 1.1355), us_10_ans: "observation_date,DGS10\n2026-09-24,5.18\n2026-09-25,.\n",
      btc_eur: kraken(closes(112, 100)), eth_eur: kraken(closes(101, 100)) }[src.id];
    return { ok: true, status: 200, text: async () => body };
  };
}
const NOW = new Date("2026-09-29T08:00:00Z");

test("parsers read ECB, FRED (skipping missing values) and Kraken with 7/30-day changes", () => {
  assert.deepEqual(PARSERS.ecb(ecb("2026-09-16", 2.5)), { valeur: 2.5, date_obs: "2026-09-16" });
  assert.deepEqual(PARSERS.fred("d,v\n2026-09-24,5.18\n2026-09-25,.\n"), { valeur: 5.18, date_obs: "2026-09-24" });
  assert.deepEqual(PARSERS.kraken(kraken(closes(112, 100))).extra, { variation_7j_pct: 12, variation_30j_pct: 12 });
  assert.throws(() => PARSERS.kraken(JSON.stringify({ error: ["EGeneral"] })), /PARSE_KRAKEN/);
});

test("collection is resilient to one failing source and snapshots are private", async t => {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-finance-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = privateDir({ IVAN_FINANCE_DIR: path.join(root, "finance") });
  const snap = await collect(fixtureFetch({ failing: ["us_10_ans"] }), NOW);
  assert.equal(snap.indicateurs.length, SOURCES.length - 1);
  assert.deepEqual(snap.erreurs, [{ id: "us_10_ans", code: "HTTP_503" }]);
  const file = saveSnapshot(dir, snap);
  assert.equal(statSync(file).mode & 0o777, 0o600);
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  assert.equal(snapshots(dir).length, 1);
});

test("alerts flag a rate change, a large crypto move, stale monthly data and outages", async () => {
  const previous = await collect(fixtureFetch({ dfr: 2.75 }), new Date("2026-09-28T08:00:00Z"));
  const current = await collect(fixtureFetch({ failing: ["eth_eur"] }), NOW);
  const list = alerts(current, previous);
  const text = list.map(a => `${a.niveau}:${a.id}`);
  assert.ok(text.includes("important:bce_taux_depot"));
  assert.ok(text.includes("important:btc_eur"));
  assert.ok(text.includes("info:inflation_zone_euro"), "December data read in September is stale");
  assert.ok(text.includes("info:eth_eur"));
  assert.ok(!text.includes("important:eur_usd"));
  assert.ok(!text.includes("info:bce_taux_depot"), "a policy rate dated at its last decision is not stale");
  const md = report(current, previous);
  assert.match(md, /## À surveiller[\s\S]*2\.75 % → 2\.5 %[\s\S]*\+12 % sur 7 jours/);
  assert.match(md, /pas un conseil en investissement/);
});

test("a quiet day says so and keeps sources linked", async () => {
  const snap = await collect(fixtureFetch(), NOW);
  const quiet = { ...snap, indicateurs: snap.indicateurs.filter(i => !["btc_eur", "inflation_zone_euro", "inflation_sous_jacente"].includes(i.id)) };
  const md = report(quiet, quiet);
  assert.match(md, /Rien d'important depuis le dernier relevé/);
  assert.match(md, /\]\(https:\/\/data-api\.ecb\.europa\.eu/);
});

import { drift, split, toTarget, validateAllocation } from "../finance-engine/scripts/dca.mjs";
const allocation = { version: 1, versement_mensuel_eur: 1000, valeur_portefeuille_eur: 1000, lignes: [
  { id: "A", reel_pct: 48.9, cible_pct: 45 }, { id: "B", reel_pct: 21.1, cible_pct: 20 }, { id: "C", reel_pct: 14.1, cible_pct: 15 },
  { id: "D", reel_pct: 8.5, cible_pct: 10 }, { id: "E", reel_pct: 7.4, cible_pct: 10 }] };

test("DCA: drift, buy-only split that never sells, and the contribution needed to reach target", () => {
  assert.deepEqual(drift(allocation).map(l => l.ecart_pts), [3.9, 1.1, -0.9, -1.5, -2.6]);
  assert.equal(toTarget(allocation), 86.67);
  const small = split(allocation, 50);
  assert.equal(small.reduce((s, l) => s + l.achat_eur, 0).toFixed(2), "50.00");
  assert.deepEqual(small.map(l => l.achat_eur >= 0), [true, true, true, true, true]);
  assert.equal(small[0].achat_eur, 0, "the overweight line gets nothing while gaps remain");
  const big = split(allocation, 1000);
  assert.equal(big.reduce((s, l) => s + l.achat_eur, 0).toFixed(2), "1000.00");
  for (const l of big) assert.ok(Math.abs(l.apres_pct - l.cible_pct) < 0.01, `${l.id} reaches target`);
  assert.throws(() => validateAllocation({ ...allocation, lignes: allocation.lignes.slice(1) }), /SOMME_REEL_PCT/);
  assert.throws(() => split(allocation, 0), /MONTANT_INVALID/);
  assert.equal(split(allocation).reduce((s, l) => s + l.achat_eur, 0).toFixed(2), "1000.00", "monthly contribution by default");
  const byTarget = split({ ...allocation, valeur_portefeuille_eur: null });
  assert.deepEqual(byTarget.map(l => l.achat_eur), [450, 200, 150, 100, 100], "no value: split by target weights");
  assert.throws(() => split(allocation, 1000, -5), /VALEUR_INVALID/);
  assert.equal(toTarget({ ...allocation, valeur_portefeuille_eur: null }), null);
});

test("Jev judges threshold alerts: routine ones become notes, an outage keeps them important", async () => {
  const previous = await collect(fixtureFetch({ dfr: 2.75 }), new Date("2026-09-28T08:00:00Z"));
  const current = await collect(fixtureFetch(), NOW);
  const judged = await judge(alerts(current, previous), { classifyImpl: async (q, input) => ({ decision: input.indicateur === "btc_eur" ? 0.2 : 0.9, confidence: 0.8, request_id: "r" }) });
  assert.equal(judged.find(a => a.id === "bce_taux_depot").niveau, "important");
  assert.match(judged.find(a => a.id === "btc_eur").texte, /Jev : variation de routine/);
  assert.equal(judged.find(a => a.id === "btc_eur").niveau, "info");
  const down = await judge(alerts(current, previous), { classifyImpl: async () => { throw new Error("down"); } });
  assert.equal(down.filter(a => a.niveau === "important").length, 2, "fail open for alerts: never hidden by an outage");
  assert.doesNotMatch(report(current, previous, judged), /À surveiller[\s\S]*\+12 % sur 7 jours\.\n/);
});
