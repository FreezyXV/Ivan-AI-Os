// Vérificateur codé des fiches d'opportunité (docs/BUSINESS-OPPORTUNITY-CONTRACT.md).
// Nécessaire, jamais suffisant : une fiche conforme peut rester une mauvaise idée.
// Usage : node skills/business-engine/scripts/fiche.mjs <fiche.json> <fixtures.jsonl>
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// a-noter = assez de preuves pour passer au score codé de signals.mjs (pas une recommandation).
const DECISIONS = ["exploratoire", "a-noter", "abandon", "creuser", "lancer"];
const TYPES = ["douleur", "demande", "offre-existante", "paiement-observe"];
const MONEY = /(?:€|\$|\beuros?\b|\bdollars?\b|\bMRR\b|\bARR\b|\brevenu|\bchiffre d'affaires)/i;
const IRREVERSIBLE = /\b(?:contacter|appeler|écrire à|envoyer (?:un|des) (?:e-?mail|message)s?|démarcher|acheter|payer|publier|lancer une campagne|s'inscrire au nom)\b/i;

export function verifierFiche(fiche, sources) {
  const e = [];
  const byUrl = new Map(sources.map(s => [s.url, s]));
  for (const champ of ["sujet", "probleme", "hypothese", "limites"]) if (!(typeof fiche?.[champ] === "string" && fiche[champ].trim().length >= 10)) e.push(`CHAMP_${champ.toUpperCase()}`);
  if (!fiche?.acheteur?.profil || !["hypothèse", "établi"].includes(fiche.acheteur.statut)) e.push("ACHETEUR");
  const preuves = Array.isArray(fiche?.preuves) ? fiche.preuves : [];
  if (!preuves.length) e.push("PREUVES_ABSENTES");
  for (const [i, p] of preuves.entries()) {
    const s = byUrl.get(p.url);
    if (!s) { e.push(`PREUVE_${i}_SOURCE_INCONNUE`); continue; }
    if (!TYPES.includes(p.type)) e.push(`PREUVE_${i}_TYPE`);
    if (typeof p.citation !== "string" || !s.excerpt.includes(p.citation)) e.push(`PREUVE_${i}_CITATION_INEXACTE`);
    if (p.citation && s.title.includes(p.citation) && !s.excerpt.includes(p.citation)) e.push(`PREUVE_${i}_TITRE_SEUL`);
  }
  const distinctes = new Set(preuves.map(p => p.url)).size;
  if (fiche?.sourcesDistinctes !== distinctes) e.push("SOURCES_DISTINCTES_FAUSSES");
  if (fiche?.acheteur?.statut === "établi" && !preuves.some(p => p.type === "paiement-observe")) e.push("ACHETEUR_ETABLI_SANS_PAIEMENT");
  // Aucun montant ni revenu inventé : un montant n'est permis que s'il figure dans une citation.
  const cite = preuves.map(p => p.citation ?? "").join(" ");
  for (const champ of ["probleme", "hypothese", "limites"]) if (MONEY.test(fiche?.[champ] ?? "") && !MONEY.test(cite)) e.push(`MONTANT_INVENTE_${champ.toUpperCase()}`);
  const t = fiche?.prochainTest ?? {};
  if (!(typeof t.description === "string" && t.description.length >= 20)) e.push("TEST_ABSENT");
  if (!(Number.isInteger(t.dureeJours) && t.dureeJours >= 1 && t.dureeJours <= 7)) e.push("TEST_DUREE");
  if (t.coutEur !== 0) e.push("TEST_COUT_NON_NUL");
  if (t.contactTiers !== false || IRREVERSIBLE.test(t.description ?? "")) e.push("TEST_IRREVERSIBLE_OU_CONTACT");
  if (!Array.isArray(fiche?.objections) || !fiche.objections.length) e.push("OBJECTIONS_ABSENTES");
  if (!DECISIONS.includes(fiche?.decision)) e.push("DECISION_INVALIDE");
  if (["creuser", "lancer"].includes(fiche?.decision) && !Number.isFinite(fiche?.scoreCode)) e.push("DECISION_SANS_SCORE_CODE");
  // Deux sources distinctes et un signal de marché : la fiche doit passer au score codé.
  if (fiche?.decision === "exploratoire" && distinctes >= 2 && preuves.some(p => ["offre-existante", "paiement-observe"].includes(p.type))) e.push("A_NOTER_PAR_SIGNALS");
  return e;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [fichePath, fixturesPath] = process.argv.slice(2);
  const sources = readFileSync(fixturesPath, "utf8").trim().split("\n").map(l => JSON.parse(l).item);
  const erreurs = verifierFiche(JSON.parse(readFileSync(fichePath, "utf8")), sources);
  console.log(erreurs.length ? erreurs.join("\n") : "fiche conforme (contrôles codés seulement)");
  process.exit(erreurs.length ? 1 : 0);
}
