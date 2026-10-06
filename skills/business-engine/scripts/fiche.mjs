// Vérificateur codé des fiches d'opportunité (docs/BUSINESS-OPPORTUNITY-CONTRACT.md).
// Nécessaire, jamais suffisant : une fiche conforme peut rester une mauvaise idée.
// Une recommandation (creuser/lancer) n'est acceptée que si elle est **recalculée** par le vrai
// moteur (signals.mjs#scoreOpportunity) sur l'entrée embarquée, dont les preuves sont citées.
// Usage : node skills/business-engine/scripts/fiche.mjs <fiche.json> <fixtures.jsonl>
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CRITERES, scoreOpportunity } from "./signals.mjs";

// a-noter = assez de preuves pour passer au score codé de signals.mjs (pas une recommandation).
const DECISIONS = ["exploratoire", "a-noter", "abandon", "creuser", "lancer"];
const TYPES = ["douleur", "demande", "offre-existante", "paiement-observe"];
const ENGINE_DECISION = { lancer: "lancer", creuser: "creuser", abandonner: "abandon" };
const REVENUE = /\b(?:MRR|ARR|revenus?|chiffre d'affaires|recettes?)\b/i;
const IRREVERSIBLE = /\b(?:contacter|appeler|écrire à|envoyer (?:un|des) (?:e-?mail|message)s?|démarcher|acheter|payer|publier|lancer une campagne|s'inscrire au nom)\b/i;
// Montants : nombre lié à une devise, dans un sens ou dans l'autre ("$5", "5 €", "10k$", "999999 euros").
const AMOUNT = /(?:[$€£]\s?\d[\d\s.,]*(?:k|K|M)?|\d[\d\s.,]*(?:k|K|M)?\s?(?:[$€£]|euros?\b|dollars?\b|USD\b|EUR\b))/g;
const amountValue = a => {
  const m = a.replace(/\s/g, "").match(/(\d[\d.,]*)(k|K|M)?/);
  if (!m) return null;
  const n = Number(m[1].replace(/,(?=\d{3}\b)/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) ? n * (m[2] === "M" ? 1e6 : m[2] ? 1e3 : 1) : null;
};
const text = (v, min) => typeof v === "string" && v.trim().length >= min;
const obj = v => v !== null && typeof v === "object" && !Array.isArray(v);

export function verifierFiche(fiche, sources = []) {
  if (!obj(fiche)) return ["FICHE_INVALIDE"];
  const e = [];
  const byUrl = new Map((Array.isArray(sources) ? sources : []).filter(obj).map(s => [s.url, s]));
  for (const champ of ["sujet", "probleme", "hypothese", "limites"]) if (!text(fiche[champ], 10)) e.push(`CHAMP_${champ.toUpperCase()}`);
  if (!obj(fiche.acheteur) || !text(fiche.acheteur.profil, 3) || !["hypothèse", "établi"].includes(fiche.acheteur.statut)) e.push("ACHETEUR");

  const preuves = Array.isArray(fiche.preuves) ? fiche.preuves : [];
  if (!preuves.length) e.push("PREUVES_ABSENTES");
  const valides = [];
  for (const [i, p] of preuves.entries()) {
    if (!obj(p)) { e.push(`PREUVE_${i}_INVALIDE`); continue; }
    const s = byUrl.get(p.url);
    if (!s) { e.push(`PREUVE_${i}_SOURCE_INCONNUE`); continue; }
    if (!TYPES.includes(p.type)) e.push(`PREUVE_${i}_TYPE`);
    // "".includes("") est vrai : une citation vide ou trop courte ne prouve rien.
    if (!text(p.citation, 15)) { e.push(`PREUVE_${i}_CITATION_VIDE`); continue; }
    if (typeof s.excerpt !== "string" || !s.excerpt.includes(p.citation)) {
      e.push(typeof s.title === "string" && s.title.includes(p.citation) ? `PREUVE_${i}_TITRE_SEUL` : `PREUVE_${i}_CITATION_INEXACTE`);
      continue;
    }
    valides.push(p);
  }
  const distinctes = new Set(preuves.filter(obj).map(p => p.url)).size;
  if (fiche.sourcesDistinctes !== distinctes) e.push("SOURCES_DISTINCTES_FAUSSES");
  if (fiche.acheteur?.statut === "établi" && !valides.some(p => p.type === "paiement-observe")) e.push("ACHETEUR_ETABLI_SANS_PAIEMENT");

  // Montants exacts : chaque montant annoncé doit figurer, à l'identique en valeur, dans une citation
  // valide. Une devise présente ailleurs n'étaye pas un autre montant. Pas de revenu inventé.
  const cites = valides.map(p => p.citation).join(" ");
  const citedAmounts = new Set((cites.match(AMOUNT) ?? []).map(amountValue).filter(v => v !== null));
  const t = obj(fiche.prochainTest) ? fiche.prochainTest : {};
  for (const [champ, value] of [["probleme", fiche.probleme], ["hypothese", fiche.hypothese], ["limites", fiche.limites], ["test", t.description]]) {
    if (typeof value !== "string") continue;
    for (const a of value.match(AMOUNT) ?? []) if (!citedAmounts.has(amountValue(a))) { e.push(`MONTANT_NON_ETAYE_${champ.toUpperCase()}`); break; }
    if (REVENUE.test(value) && !REVENUE.test(cites)) e.push(`REVENU_INVENTE_${champ.toUpperCase()}`);
  }

  if (!text(t.description, 20)) e.push("TEST_ABSENT");
  if (!(Number.isInteger(t.dureeJours) && t.dureeJours >= 1 && t.dureeJours <= 7)) e.push("TEST_DUREE");
  if (t.coutEur !== 0) e.push("TEST_COUT_NON_NUL");
  if (t.reversible !== true) e.push("TEST_NON_REVERSIBLE");
  if (t.contactTiers !== false || IRREVERSIBLE.test(t.description ?? "")) e.push("TEST_IRREVERSIBLE_OU_CONTACT");
  if (!Array.isArray(fiche.objections) || !fiche.objections.some(o => text(o, 10))) e.push("OBJECTIONS_ABSENTES");
  if (!DECISIONS.includes(fiche.decision)) e.push("DECISION_INVALIDE");

  // Provenance moteur : recalcul, jamais confiance dans un scoreCode déclaré.
  if (fiche.moteur !== undefined) {
    if (!obj(fiche.moteur) || fiche.moteur.source !== "signals.mjs#scoreOpportunity" || !obj(fiche.moteur.entree)) e.push("MOTEUR_INVALIDE");
    else {
      let r;
      try { r = scoreOpportunity(fiche.moteur.entree); } catch (err) { e.push(`MOTEUR_INVALIDE:${String(err?.message ?? "").slice(0, 60)}`); }
      if (r) {
        if (ENGINE_DECISION[r.decision] !== fiche.decision) e.push("DECISION_DIFFERENTE_DU_MOTEUR");
        if (fiche.scoreCode !== undefined && fiche.scoreCode !== r.total) e.push("SCORE_DIFFERENT_DU_MOTEUR");
        const citees = new Set(valides.map(p => p.url));
        for (const c of CRITERES) {
          const v = fiche.moteur.entree.criteres?.[c];
          if (v?.note > 1 && v.preuve !== "profil" && !citees.has(v.preuve)) e.push(`MOTEUR_PREUVE_NON_CITEE_${c.toUpperCase()}`);
        }
      }
    }
  } else if (["creuser", "lancer"].includes(fiche.decision)) e.push("DECISION_SANS_RESULTAT_MOTEUR");

  // Deux sources distinctes et un signal de marché : la fiche doit passer au score codé.
  if (fiche.decision === "exploratoire" && distinctes >= 2 && valides.some(p => ["offre-existante", "paiement-observe"].includes(p.type))) e.push("A_NOTER_PAR_SIGNALS");
  return e;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [fichePath, fixturesPath] = process.argv.slice(2);
  const sources = readFileSync(fixturesPath, "utf8").trim().split("\n").map(l => JSON.parse(l).item);
  const erreurs = verifierFiche(JSON.parse(readFileSync(fichePath, "utf8")), sources);
  console.log(erreurs.length ? erreurs.join("\n") : "fiche conforme (contrôles codés seulement)");
  process.exit(erreurs.length ? 1 : 0);
}
