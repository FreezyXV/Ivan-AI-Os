// Claim verification ledger: evidence rules applied by code so the LLM does not re-read sources
// to decide whether a fact is established. One JSON file per article or topic, kept next to the
// draft (e.g. articles-batch-N.claims.json); public sources only.
// Usage:
//   node affirmations.mjs verifier <fichier.json>   status per claim + summary (exit 1 if blocking)
//   node affirmations.mjs faits <fichier.json>      "Faits clés" + "Sources" Markdown (confirmed only)
//   node affirmations.mjs visuels <fichier.json>    suggested visual formats for the article
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isCliEntry } from "../../tools/cli.mjs";

// Reliability tiers from the domain, deterministic: A institutions/primary, B reference/serious
// press, C everything else. Unknown ≠ false: tier C can support context, not numbers or dates.
const TIER_A = [/\.gouv\.fr$/, /\.gov(\.[a-z]{2})?$/, /(^|\.)europa\.eu$/, /\.int$/, /(^|\.)un\.org$/, /(^|\.)who\.int$/, /(^|\.)insee\.fr$/,
  /(^|\.)ecb\.europa\.eu$/, /(^|\.)banque-france\.fr$/, /(^|\.)oecd\.org$/, /(^|\.)worldbank\.org$/, /(^|\.)imf\.org$/, /\.edu$/, /\.ac\.[a-z]{2}$/,
  /(^|\.)cnrs\.fr$/, /(^|\.)inserm\.fr$/, /(^|\.)nasa\.gov$/, /(^|\.)esa\.int$/, /(^|\.)nature\.com$/, /(^|\.)science\.org$/];
const TIER_B = [/(^|\.)wikipedia\.org$/, /(^|\.)britannica\.com$/, /(^|\.)universalis\.fr$/, /(^|\.)larousse\.fr$/, /(^|\.)lemonde\.fr$/,
  /(^|\.)reuters\.com$/, /(^|\.)apnews\.com$/, /(^|\.)bbc\.(co\.uk|com)$/, /(^|\.)ft\.com$/, /(^|\.)economist\.com$/, /(^|\.)nationalgeographic\.(com|fr)$/];
export const TYPES = ["chiffre", "date", "definition", "relation", "contexte"];
const STRICT = ["chiffre", "date"];

export class ClaimError extends Error {}
const fail = code => { throw new ClaimError(code); };

export function tier(url) {
  let host;
  try { host = new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { fail("SOURCE_URL_INVALID"); }
  return TIER_A.some(r => r.test(host)) ? "A" : TIER_B.some(r => r.test(host)) ? "B" : "C";
}
const domain = url => new URL(url).hostname.replace(/^www\./, "").split(".").slice(-2).join(".");

export function validateLedger(l) {
  if (!l || l.version !== 1 || typeof l.sujet !== "string" || !Array.isArray(l.sources) || !Array.isArray(l.affirmations)) fail("LEDGER_INVALID");
  const ids = new Set();
  for (const s of l.sources) {
    if (typeof s.id !== "string" || ids.has(s.id) || typeof s.titre !== "string" || !s.titre.trim()) fail("SOURCE_INVALID");
    tier(s.url); ids.add(s.id);
  }
  const claimIds = new Set();
  for (const c of l.affirmations) {
    if (typeof c.id !== "string" || claimIds.has(c.id) || typeof c.texte !== "string" || !c.texte.trim() || !TYPES.includes(c.type)) fail(`AFFIRMATION_INVALID_${c.id ?? "?"}`);
    claimIds.add(c.id);
    if (!Array.isArray(c.preuves)) fail(`PREUVES_REQUIRED_${c.id}`);
    for (const p of c.preuves) {
      if (!ids.has(p.source)) fail(`SOURCE_INCONNUE_${c.id}_${p.source}`);
      if (p.valeur !== undefined && typeof p.valeur !== "number" && typeof p.valeur !== "string") fail(`VALEUR_INVALIDE_${c.id}`);
    }
  }
  return l;
}

// Rules: numbers and dates need two independent domains, one of tier A or B; values that differ
// (> 2 % for numbers, any difference for dates/strings) make the claim contested. Other types need
// one source of tier A or B, or two independent sources.
export function verify(ledger) {
  const l = validateLedger(ledger);
  const byId = new Map(l.sources.map(s => [s.id, { ...s, tier: tier(s.url), domaine: domain(s.url) }]));
  return l.affirmations.map(c => {
    const evidence = c.preuves.map(p => ({ ...p, ...byId.get(p.source) }));
    const domains = new Set(evidence.map(e => e.domaine));
    const strong = evidence.some(e => e.tier !== "C");
    const values = evidence.filter(e => e.valeur !== undefined).map(e => e.valeur);
    let contested = false;
    if (values.length > 1) {
      if (values.every(v => typeof v === "number")) contested = (Math.max(...values) - Math.min(...values)) / Math.max(Math.abs(Math.min(...values)), 1e-9) > 0.02;
      else contested = new Set(values.map(String)).size > 1;
    }
    const enough = STRICT.includes(c.type) ? domains.size >= 2 && strong : strong || domains.size >= 2;
    const statut = contested ? "conteste" : enough ? "confirme" : "a_verifier";
    const raison = contested ? `valeurs divergentes : ${values.join(" / ")}`
      : enough ? `${domains.size} domaine(s), meilleure fiabilité ${[...evidence].sort((a, b) => a.tier.localeCompare(b.tier))[0]?.tier}`
      : STRICT.includes(c.type) ? "chiffre/date : 2 domaines indépendants dont un fiable (A/B) requis" : "une source A/B ou deux domaines requis";
    return { id: c.id, type: c.type, statut, raison, texte: c.texte };
  });
}

export function summary(results) {
  const count = s => results.filter(r => r.statut === s).length;
  return { total: results.length, confirmees: count("confirme"), a_verifier: count("a_verifier"), contestees: count("conteste"),
    publiable: results.every(r => r.statut === "confirme") };
}

// Only confirmed claims reach the article; sources are those actually cited by them.
export function facts(ledger) {
  const results = verify(ledger);
  const ok = new Set(results.filter(r => r.statut === "confirme").map(r => r.id));
  const kept = ledger.affirmations.filter(c => ok.has(c.id));
  const cited = new Set(kept.flatMap(c => c.preuves.map(p => p.source)));
  const lines = ["## Faits clés", "", ...kept.filter(c => ["chiffre", "date"].includes(c.type)).map(c => `- ${c.texte}`), "", "## Sources", ""];
  for (const s of ledger.sources.filter(s => cited.has(s.id))) lines.push(`- ${s.auteur ?? new URL(s.url).hostname.replace(/^www\./, "")}, ${s.titre}, ${s.url}`);
  return lines.join("\n");
}

// Visual router: the structure of the verified material decides the format, not taste.
export function visuals(ledger) {
  const confirmed = new Set(verify(ledger).filter(r => r.statut === "confirme").map(r => r.id));
  const claims = ledger.affirmations.filter(c => confirmed.has(c.id));
  const out = [];
  const dates = claims.filter(c => c.type === "date").length;
  const numbers = claims.filter(c => c.type === "chiffre");
  const series = numbers.filter(c => c.serie);
  const places = claims.filter(c => c.lieu).length;
  const relations = claims.filter(c => c.type === "relation").length;
  if (dates >= 5) out.push({ format: "timeline", raison: `${dates} dates confirmées` });
  if (new Set(series.map(c => c.serie)).size && series.length >= 3) out.push({ format: "chart", raison: `série « ${series[0].serie} » (${series.length} points)` });
  else if (numbers.length >= 3) out.push({ format: "chiffres-cles", raison: `${numbers.length} chiffres confirmés` });
  if (places >= 3) out.push({ format: "map", raison: `${places} lieux` });
  if (relations >= 3) out.push({ format: "diagramme", raison: `${relations} relations (processus, causes, composants)` });
  if (!out.length) out.push({ format: "illustration", raison: "aucune structure dominante : une image d'ambiance suffit" });
  return out;
}

if (isCliEntry(import.meta.url)) {
  const [command, file] = process.argv.slice(2);
  try {
    if (!file) fail("USAGE: verifier | faits | visuels <fichier.json>");
    const ledger = JSON.parse(readFileSync(file, "utf8"));
    if (command === "verifier") {
      const results = verify(ledger), s = summary(results);
      console.log(JSON.stringify({ ...s, affirmations: results.filter(r => r.statut !== "confirme").concat(results.filter(r => r.statut === "confirme")) }, null, 2));
      if (!s.publiable) process.exitCode = 1;
    } else if (command === "faits") console.log(facts(ledger));
    else if (command === "visuels") console.log(JSON.stringify(visuals(ledger), null, 2));
    else fail("USAGE: verifier | faits | visuels <fichier.json>");
  } catch (error) {
    console.error(error instanceof ClaimError ? error.message : error instanceof SyntaxError ? "JSON_INVALID" : "CLAIMS_ERROR");
    process.exitCode = 1;
  }
}
