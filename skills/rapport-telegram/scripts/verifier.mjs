// Contrôles déterministes du contrat éditorial des alertes (docs/ALERT-EDITORIAL-CONTRACT.md).
// Nécessaires, jamais suffisants : un brief qui passe peut rester inutile ou mal compris ;
// la grille de qualité (pertinence, fidélité, utilité, action, effort) reste à appliquer.
// Usage : node skills/rapport-telegram/scripts/verifier.mjs  (vérifie le corpus)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ACTIFS = ["business", "finance", "engineering", "system"];
export const SELECTIONS = ["keep", "review", "skip"];
export const LIVRAISONS = ["silence", "digest", "immediat"];
export const LIMITES = { faits: 3, summary: 350, utility: 500, action: 300, uncertainty: 300, message: 2500 };

const nombres = t => (t.match(/\d+(?:[.,]\d+)*/g) ?? []).map(n => n.replaceAll(",", "."));
const texte = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

// Retourne la liste des écarts (vide = conforme). Mêmes règles que le runtime provisoire
// (citation exacte, chiffres du fait présents dans sa citation), plus celles du contrat :
// 3 faits maximum, limite obligatoire si l'extrait est partiel, pas de chiffre orphelin.
export function verifierBrief(source, brief) {
  const e = [];
  if (!brief || typeof brief !== "object") return ["BRIEF_ABSENT"];
  if (!ACTIFS.includes(brief.goal)) e.push("GOAL_HORS_PRIORITES_ACTIVES");
  if (!Array.isArray(brief.facts) || brief.facts.length < 1 || brief.facts.length > LIMITES.faits) e.push("FAITS_1_A_3");
  for (const [i, f] of (brief.facts ?? []).entries()) {
    if (!texte(f?.summary, LIMITES.summary)) e.push(`FAIT_${i}_RESUME_INVALIDE`);
    if (!texte(f?.quote, 600) || !source.excerpt.includes(f.quote)) { e.push(`FAIT_${i}_CITATION_INEXACTE`); continue; }
    const appuis = nombres(f.quote);
    if (nombres(f.summary ?? "").some(n => !appuis.includes(n))) e.push(`FAIT_${i}_CHIFFRE_NON_ETAYE`);
  }
  if (!texte(brief.utility, LIMITES.utility)) e.push("UTILITE_INVALIDE");
  if (!texte(brief.action, LIMITES.action)) e.push("ACTION_INVALIDE");
  if (brief.uncertainty !== undefined && !texte(brief.uncertainty, LIMITES.uncertainty)) e.push("LIMITE_INVALIDE");
  const lecture = source.lecture ?? {};
  if ((lecture.excerptTruncated || lecture.excerptMode === "passages") && !brief.uncertainty) e.push("LIMITE_REQUISE_EXTRAIT_PARTIEL");
  // Un chiffre de l'utilité ou de l'action doit déjà figurer dans un fait étayé.
  const etayes = new Set((brief.facts ?? []).flatMap(f => nombres(f?.quote ?? "")));
  for (const champ of ["utility", "action"]) {
    if (nombres(brief[champ] ?? "").some(n => !etayes.has(n))) e.push(`${champ.toUpperCase()}_CHIFFRE_ORPHELIN`);
  }
  if (/\b(achète|achetez|vends|vendez|investis|investissez)\b/i.test(`${brief.utility} ${brief.action}`)) e.push("RECOMMANDATION_TRANSACTION");
  return e;
}

// Gabarit compatible avec renderBrief du runtime provisoire : titre, date, faits, utilité,
// action, limite, puis la source en dernière ligne.
export function rendre(source, brief) {
  const date = source.publishedAt.slice(0, 10);
  const lignes = [source.title, `${source.producer === "finance-watch" ? "Relevé" : "Publié"} le ${date}.`,
    ...brief.facts.map(f => `• ${f.summary}`), `\nUtilité pour toi : ${brief.utility}`, `\nÀ faire : ${brief.action}`,
    ...(brief.uncertainty ? [`\nLimite : ${brief.uncertainty}`] : []), `\nSource : ${source.url}`];
  return lignes.join("\n");
}

export function verifierMessage(message, source) {
  const e = [];
  if (message.length > LIMITES.message) e.push("MESSAGE_TROP_LONG");
  if (!message.trimEnd().endsWith(source.url)) e.push("LIEN_PAS_EN_DERNIER");
  if (/\|.*\|/.test(message) || /```/.test(message)) e.push("MARKDOWN_COMPLEXE");
  return e;
}

export function verifierCas(cas) {
  const e = [];
  const a = cas.attendu ?? {};
  if (!cas.id || !cas.categorie || typeof cas.reel !== "boolean") e.push("IDENTITE");
  if (!a.decoupage) {
    if (!SELECTIONS.includes(a.selection)) e.push("SELECTION_ATTENDUE");
    if (!LIVRAISONS.includes(a.livraison)) e.push("LIVRAISON_ATTENDUE");
    if (a.selection !== "keep" && a.livraison !== "silence") e.push("NON_RETENU_DOIT_ETRE_SILENCE");
  }
  if (!(cas.justification?.length >= 20)) e.push("JUSTIFICATION");
  if (!Array.isArray(cas.interdits) || !cas.interdits.length) e.push("INTERDITS");
  if (!Array.isArray(cas.preuves) || !cas.preuves.length) e.push("PREUVES");
  const s = cas.entree?.source;
  if (s?.sourceStatus === "read" && !(s.excerpt?.length >= 20 && s.excerpt.length <= 1200)) e.push("EXTRAIT_1200");
  for (const terme of cas.doit_contenir ?? []) if (s && !s.excerpt.replaceAll(".", ",").includes(terme.replaceAll(".", ","))) e.push(`DOIT_CONTENIR_HORS_EXTRAIT:${terme}`);
  return e;
}

export function chargerCorpus(dir = fileURLToPath(new URL("../corpus/", import.meta.url))) {
  const lire = f => JSON.parse(readFileSync(dir + f, "utf8"));
  return { construction: lire("construction.json"), independant: lire("independant.json") };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { construction, independant } = chargerCorpus();
  let ok = true;
  for (const ex of construction.exemples) {
    if (!ex.brief) { console.log(`${ex.id}: ${ex.decision.livraison} (${ex.decision.raison})`); continue; }
    const message = rendre(ex.source, ex.brief);
    const erreurs = [...verifierBrief(ex.source, ex.brief), ...verifierMessage(message, ex.source)];
    ok &&= !erreurs.length;
    console.log(`${ex.id}: ${message.length} caractères ${erreurs.length ? erreurs.join(", ") : "conforme"}`);
  }
  for (const cas of independant.cas) {
    const erreurs = verifierCas(cas);
    ok &&= !erreurs.length;
    if (erreurs.length) console.log(`${cas.id}: ${erreurs.join(", ")}`);
  }
  console.log(ok ? `corpus conforme (${independant.cas.length} cas indépendants)` : "corpus non conforme");
  process.exit(ok ? 0 : 1);
}
