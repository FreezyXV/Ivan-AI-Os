// Finance Engine, public watch: deterministic collection, snapshots and alerts. No LLM, no key,
// no portfolio data. Snapshots stay private in ~/.ivan-ai-os/finance/ (0700/0600), outside Git.
// Usage: node veille.mjs collecter | alertes [--jev] | rapport [--jev]
// Env: IVAN_FINANCE_DIR overrides the private directory (tests).
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classify, pool } from "../../jev-decision/scripts/classify.mjs";
import { isCliEntry } from "../../tools/cli.mjs";

const ECB = key => `https://data-api.ecb.europa.eu/service/data/${key}?lastNObservations=1&format=jsondata`;
// Cadence decides staleness: daily data older than 7 days, monthly older than 70 days;
// policy rates only change at decisions ("evenement"), so their date is never stale.
export const SOURCES = [
  { id: "bce_taux_depot", libelle: "BCE — taux de la facilité de dépôt", unite: "%", cadence: "evenement", type: "ecb", url: ECB("FM/B.U2.EUR.4F.KR.DFR.LEV") },
  { id: "inflation_zone_euro", libelle: "Inflation zone euro (IPCH, sur un an)", unite: "%", cadence: "mois", type: "ecb", url: ECB("HICP/M.U2.N.000000.4D0.ANR") },
  { id: "inflation_sous_jacente", libelle: "Inflation sous-jacente zone euro (hors énergie et alimentation)", unite: "%", cadence: "mois", type: "ecb", url: ECB("HICP/M.U2.N.XEF000.4D0.ANR") },
  { id: "eur_usd", libelle: "EUR/USD (référence BCE)", unite: "USD", cadence: "jour", type: "ecb", url: ECB("EXR/D.USD.EUR.SP00.A") },
  { id: "us_10_ans", libelle: "Taux US à 10 ans", unite: "%", cadence: "jour", type: "fred", url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10" },
  { id: "btc_eur", libelle: "Bitcoin (BTC/EUR, clôture)", unite: "EUR", cadence: "jour", type: "kraken", url: "https://api.kraken.com/0/public/OHLC?pair=XBTEUR&interval=1440" },
  { id: "eth_eur", libelle: "Ether (ETH/EUR, clôture)", unite: "EUR", cadence: "jour", type: "kraken", url: "https://api.kraken.com/0/public/OHLC?pair=ETHEUR&interval=1440" }
];
export const SEUILS = { crypto_7j_pct: 10, change_pct: 2, stale_jours: { jour: 7, mois: 70 } };

export class FinanceError extends Error {}
const fail = code => { throw new FinanceError(code); };
const round = (v, d = 4) => Math.round(v * 10 ** d) / 10 ** d;

export function privateDir(env = process.env) {
  const dir = env.IVAN_FINANCE_DIR ?? path.join(homedir(), ".ivan-ai-os", "finance");
  if (!path.isAbsolute(dir)) fail("FINANCE_DIR_INVALID");
  mkdirSync(path.join(dir, "snapshots"), { recursive: true, mode: 0o700 });
  for (const d of [dir, path.join(dir, "snapshots")]) {
    const s = lstatSync(d);
    if (s.isSymbolicLink() || !s.isDirectory() || (s.mode & 0o077)) fail("FINANCE_DIR_NOT_PRIVATE");
  }
  return realpathSync(dir);
}

// Parsers return { valeur, date_obs, extra? } or throw; each source fails independently.
export const PARSERS = {
  ecb(text) {
    const j = JSON.parse(text);
    const series = Object.values(j.dataSets?.[0]?.series ?? {})[0];
    const [index, obs] = Object.entries(series?.observations ?? {}).at(-1) ?? [];
    const date = j.structure?.dimensions?.observation?.[0]?.values?.[index]?.id;
    if (!Number.isFinite(obs?.[0]) || !date) fail("PARSE_ECB");
    return { valeur: obs[0], date_obs: date };
  },
  fred(text) {
    const rows = text.trim().split("\n").slice(1).map(l => l.split(",")).filter(([, v]) => Number.isFinite(Number(v)) && v !== "");
    if (!rows.length) fail("PARSE_FRED");
    const [date, v] = rows.at(-1);
    return { valeur: Number(v), date_obs: date };
  },
  kraken(text) {
    const j = JSON.parse(text);
    if (j.error?.length) fail("PARSE_KRAKEN");
    const key = Object.keys(j.result ?? {}).find(k => k !== "last");
    // The last OHLC row is the current day, still forming: it is not a close. Kraken's `last`
    // is the time of the last committed candle; filtering on it is idempotent, so a caller that
    // already removed the forming row (Codex runtime) does not lose a real close.
    const all = j.result?.[key];
    const committed = Number(j.result?.last);
    const rows = Array.isArray(all) ? (committed > 0 ? all.filter(r => Number(r[0]) <= committed) : all.slice(0, -1)) : all;
    if (!Array.isArray(rows) || rows.length < 31) fail("PARSE_KRAKEN");
    const close = i => Number(rows.at(i)[4]);
    const last = close(-1);
    return { valeur: last, date_obs: new Date(rows.at(-1)[0] * 1000).toISOString().slice(0, 10),
      extra: { variation_7j_pct: round((last / close(-8) - 1) * 100, 2), variation_30j_pct: round((last / close(-31) - 1) * 100, 2) } };
  }
};

export async function collect(fetchImpl = fetch, now = new Date()) {
  const indicateurs = [], erreurs = [];
  await Promise.all(SOURCES.map(async src => {
    try {
      const response = await fetchImpl(src.url, { redirect: "error", signal: AbortSignal.timeout(15000), headers: { "user-agent": "ivan-ai-os-finance/1.0", accept: "application/json,text/csv" } });
      if (!response.ok) fail(`HTTP_${response.status}`);
      const parsed = PARSERS[src.type](await response.text());
      indicateurs.push({ id: src.id, libelle: src.libelle, unite: src.unite, cadence: src.cadence, source: src.url, ...parsed });
    } catch (error) {
      erreurs.push({ id: src.id, code: error instanceof FinanceError ? error.message : "INDISPONIBLE" });
    }
  }));
  indicateurs.sort((a, b) => SOURCES.findIndex(s => s.id === a.id) - SOURCES.findIndex(s => s.id === b.id));
  return { version: 1, date: now.toISOString().slice(0, 10), collecte_le: now.toISOString(), indicateurs, erreurs };
}

export function saveSnapshot(dir, snapshot) {
  const file = path.join(dir, "snapshots", `${snapshot.date}.json`), temp = `${file}.tmp`;
  writeFileSync(temp, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
  renameSync(temp, file);
  return file;
}

export function snapshots(dir) {
  const folder = path.join(dir, "snapshots");
  return readdirSync(folder).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
    .map(f => JSON.parse(readFileSync(path.join(folder, f), "utf8")));
}

// Deterministic alerts: a fact changed, moved beyond a threshold, or is too old to be trusted.
export function alerts(current, previous) {
  const out = [];
  const before = new Map((previous?.indicateurs ?? []).map(i => [i.id, i]));
  const today = new Date(`${current.date}T00:00:00Z`);
  for (const i of current.indicateurs) {
    const age = Math.round((today - new Date(`${i.date_obs.length === 7 ? `${i.date_obs}-01` : i.date_obs}T00:00:00Z`)) / 864e5);
    if (i.cadence !== "evenement" && age > SEUILS.stale_jours[i.cadence]) out.push({ id: i.id, niveau: "info", texte: `${i.libelle} : dernière donnée du ${i.date_obs} (${age} j), à vérifier à la source.` });
    const prev = before.get(i.id);
    if (i.id === "bce_taux_depot" && prev && prev.valeur !== i.valeur) out.push({ id: i.id, niveau: "important", texte: `${i.libelle} : ${prev.valeur} % → ${i.valeur} %.`, ancien: prev.valeur, nouveau: i.valeur, seuil: "tout changement" });
    if (i.extra && Math.abs(i.extra.variation_7j_pct) >= SEUILS.crypto_7j_pct) out.push({ id: i.id, niveau: "important", texte: `${i.libelle} : ${i.extra.variation_7j_pct > 0 ? "+" : ""}${i.extra.variation_7j_pct} % sur 7 jours.`, ancien: "7 jours avant", nouveau: `${i.extra.variation_7j_pct} %`, seuil: `±${SEUILS.crypto_7j_pct} % sur 7 jours` });
    if (i.id === "eur_usd" && prev && Math.abs(i.valeur / prev.valeur - 1) * 100 >= SEUILS.change_pct) out.push({ id: i.id, niveau: "important", texte: `${i.libelle} : ${prev.valeur} → ${i.valeur}.`, ancien: prev.valeur, nouveau: i.valeur, seuil: `±${SEUILS.change_pct} %` });
    if (["inflation_zone_euro", "inflation_sous_jacente", "us_10_ans"].includes(i.id) && prev && prev.valeur !== i.valeur && prev.date_obs !== i.date_obs) out.push({ id: i.id, niveau: "info", texte: `${i.libelle} : ${prev.valeur} % → ${i.valeur} % (${i.date_obs}).` });
  }
  for (const e of current.erreurs) out.push({ id: e.id, niveau: "info", texte: `${e.id} : source indisponible (${e.code}).` });
  return out;
}

// Jev decides whether a threshold alert is worth Ivan's attention (`alerte.importante`, public
// data only). Routine → downgraded to a note; Jev unavailable → the alert stays important.
export async function judge(list, { classifyImpl = classify, seuil = 0.5 } = {}) {
  const important = list.filter(a => a.niveau === "important");
  const results = await pool(important, a => classifyImpl("alerte.importante",
    { indicateur: a.id, ancien: String(a.ancien), nouveau: String(a.nouveau), seuil: String(a.seuil) }));
  results.forEach((r, i) => {
    if (r.ok) Object.assign(important[i], { jev: r.value.decision, ...(r.value.decision < seuil ? { niveau: "info", texte: `${important[i].texte} (Jev : variation de routine)` } : {}) });
  });
  return list;
}

export function report(current, previous, judged) {
  const list = judged ?? alerts(current, previous);
  const lines = [`# Veille finance publique — ${current.date}`, "", "## À surveiller", ""];
  const important = list.filter(a => a.niveau === "important");
  lines.push(...(important.length ? important.map(a => `- ${a.texte}`) : ["- Rien d'important depuis le dernier relevé."]), "", "## Indicateurs", "", "| Indicateur | Valeur | Date | Variation |", "|---|---|---|---|");
  for (const i of current.indicateurs) {
    const v = i.unite === "%" ? `${i.valeur} %` : i.unite === "USD" ? `${i.valeur}` : `${Math.round(i.valeur).toLocaleString("fr-FR")} €`;
    const d = i.extra ? `7 j : ${i.extra.variation_7j_pct} % · 30 j : ${i.extra.variation_30j_pct} %` : "";
    lines.push(`| [${i.libelle}](${i.source}) | ${v} | ${i.date_obs} | ${d} |`);
  }
  const infos = list.filter(a => a.niveau === "info");
  if (infos.length) lines.push("", "## Notes", "", ...infos.map(a => `- ${a.texte}`));
  lines.push("", "_Information publique, pas un conseil en investissement. Aucune transaction : la décision revient à Ivan._");
  return lines.join("\n");
}

if (isCliEntry(import.meta.url)) {
  const [command] = process.argv.slice(2);
  try {
    const dir = privateDir();
    if (command === "collecter") {
      const snap = await collect();
      saveSnapshot(dir, snap);
      console.log(JSON.stringify({ date: snap.date, indicateurs: snap.indicateurs.length, erreurs: snap.erreurs }));
    } else if (["alertes", "rapport"].includes(command)) {
      const all = snapshots(dir);
      if (!all.length) fail("NO_SNAPSHOT: lancer d'abord « collecter »");
      const [current, previous] = [all.at(-1), all.at(-2)];
      const judged = process.argv.includes("--jev") ? await judge(alerts(current, previous)) : undefined;
      console.log(command === "alertes" ? JSON.stringify(judged ?? alerts(current, previous), null, 2) : report(current, previous, judged));
    } else fail("USAGE: collecter | alertes | rapport");
  } catch (error) {
    console.error(error instanceof FinanceError ? error.message : "FINANCE_ERROR");
    process.exitCode = 1;
  }
}
