// Topic discovery for Anakalypto: Wikimedia daily top pageviews (public, no key, 0 token),
// deterministic cleanup, recurrence over several days, exclusion of covered topics, then the
// mandatory Jev gate `sujet.captivant`. Without Jev, topics stay "en_attente_jev" (never selected).
// Usage: node sujets.mjs [--source tout|wikipedia|flux] [--langue fr] [--jours 3] [--max 150] [--jev]   (trends are people-heavy:
// a wide pool lets Jev keep the few domain-relevant topics for well under a cent)
// Covered topics: one title per line in ~/.ivan-ai-os/anakalypto/couverts.txt (optional).
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classify, JevError } from "../../jev-decision/scripts/classify.mjs";

export const DOMAINES = JSON.parse(readFileSync(new URL("../domaines.json", import.meta.url), "utf8"));
// Under-covered domains first: deficit = target articles per domain - current articles.
export const deficit = slug => {
  const d = DOMAINES.domaines.find(x => x.slug === slug);
  return d ? Math.max(0, DOMAINES.cible_par_domaine - d.articles) : 0;
};

// Namespaces, portals, lists, dates and browser artifacts carry no encyclopedic topic.
const EXCLUDE = [/^(Wikipédia|Wikipedia|Spécial|Special|Fichier|File|Portail|Portal|Aide|Help|Catégorie|Category|Modèle|Template|Projet|Discussion|Utilisateur|User):/i,
  /^Accueil_principal$|^Main_Page$/i, /^Liste_|^List_of_/i, /^\d{1,4}$/, /^\d{1,2}_[a-zéû]+$/i, /^Cookie_\(informatique\)$|^HTTP_cookie$/i, /^-$/];
export const eligible = title => !EXCLUDE.some(r => r.test(title));
const label = title => title.replace(/_/g, " ");

export function aggregate(days, covered = new Set()) {
  const topics = new Map();
  days.forEach((articles, dayIndex) => {
    for (const { article, views } of articles) {
      if (!eligible(article) || covered.has(label(article).toLowerCase())) continue;
      const t = topics.get(article) ?? { titre: label(article), vues: 0, jours: 0, dernier_jour: -1 };
      t.vues += views; if (t.dernier_jour !== dayIndex) { t.jours++; t.dernier_jour = dayIndex; }
      topics.set(article, t);
    }
  });
  // Sustained interest (present several days) outranks a one-day spike of the same volume.
  return [...topics.values()].map(({ dernier_jour, ...t }) => ({ ...t, score: Math.round(Math.log10(t.vues + 1) * 100 * (1 + 0.25 * (t.jours - 1))) }))
    .sort((a, b) => b.score - a.score);
}

export async function fetchDays({ langue = "fr", jours = 3, today = new Date(), fetchImpl = fetch }) {
  const days = [];
  for (let i = 1; i <= jours; i++) {
    const d = new Date(today.getTime() - i * 864e5);
    const [y, m, dd] = [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, "0"), String(d.getUTCDate()).padStart(2, "0")];
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${langue}.wikipedia/all-access/${y}/${m}/${dd}`;
    const r = await fetchImpl(url, { headers: { "user-agent": "ivan-ai-os-anakalypto/1.0" }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) continue;
    days.push((await r.json()).items?.[0]?.articles ?? []);
  }
  if (!days.length) throw new Error("WIKIMEDIA_UNAVAILABLE");
  return days;
}

// Jev decides twice: is it captivating, and which of Anakalypto's 19 domains does it belong to.
// A topic without both Jev decisions is never "retenu". Retained topics are ordered by the
// deficit of their domain, then by score.
export async function gate(candidates, { classifyImpl = classify, langue = "fr", seuil = 0.6 } = {}) {
  const out = [];
  const slugs = DOMAINES.domaines.map(d => d.slug);
  for (const c of candidates) {
    try {
      // Only defined, public fields reach Jev (feed items have no pageview counts).
      const input = Object.fromEntries(Object.entries({ titre: c.titre, langue: c.langue ?? langue, vues: c.vues, jours: c.jours }).filter(([, v]) => v !== undefined));
      const r = await classifyImpl("sujet.captivant", input);
      const entry = { ...c, jev: { decision: r.decision, confidence: r.confidence, request_id: r.request_id }, statut: r.decision >= seuil ? "retenu" : "ecarte_par_jev" };
      if (entry.statut === "retenu") {
        const d = await classifyImpl("sujet.domaine", { titre: c.titre, langue: c.langue ?? langue, domaines: slugs.join(",") });
        if (!slugs.includes(d.decision)) entry.statut = "ecarte_hors_domaines";
        else Object.assign(entry, { domaine: d.decision, priorite: deficit(d.decision), jev_domaine: { confidence: d.confidence, request_id: d.request_id } });
      }
      out.push(entry);
    } catch (error) {
      const code = error instanceof JevError ? error.message : "JEV_UNAVAILABLE";
      // Fail closed for the whole batch once Jev is unavailable: no silent fallback selection.
      return [...out, ...candidates.slice(out.length).map(x => ({ ...x, statut: "en_attente_jev", jev_erreur: code }))];
    }
  }
  return out.sort((a, b) => (b.statut === "retenu") - (a.statut === "retenu") || (b.priorite ?? 0) - (a.priorite ?? 0) || (b.score ?? 0) - (a.score ?? 0));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const args = process.argv.slice(2);
  const opt = (flag, d) => { const i = args.indexOf(flag); return i < 0 ? d : args[i + 1]; };
  try {
    const file = path.join(homedir(), ".ivan-ai-os", "anakalypto", "couverts.txt");
    const covered = new Set(existsSync(file) ? readFileSync(file, "utf8").split("\n").map(l => l.trim().toLowerCase()).filter(Boolean) : []);
    const langue = opt("--langue", "fr");
    // --source wikipedia (trends), flux (science feeds, sources.json) or tout (both).
    const source = opt("--source", "tout"), max = Number(opt("--max", 150));
    let candidates = [];
    if (["wikipedia", "tout"].includes(source)) candidates.push(...aggregate(await fetchDays({ langue, jours: Number(opt("--jours", 3)) }), covered).slice(0, max));
    if (["flux", "tout"].includes(source)) {
      const { fetchFeeds } = await import("./flux.mjs");
      const { candidats, erreurs } = await fetchFeeds({ covered });
      candidates.push(...candidats.slice(0, max));
      if (erreurs.length) console.error(`Flux indisponibles : ${erreurs.map(e => `${e.source} (${e.code})`).join(", ")}`);
    }
    const result = args.includes("--jev") ? await gate(candidates, { langue }) : candidates.map(c => ({ ...c, statut: "en_attente_jev" }));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message?.startsWith?.("WIKIMEDIA") ? error.message : "SUJETS_ERROR");
    process.exitCode = 1;
  }
}
