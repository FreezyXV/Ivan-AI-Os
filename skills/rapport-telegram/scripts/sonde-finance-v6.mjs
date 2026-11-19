// Sonde Finance v6 (Claude, 2026-10-06) : rejoue sans modèle ni réseau les contrôles de renderBrief
// sur les deux preuves publiques refusées en production (FRED DGS10, entretien BCE/Ansa).
// N'explique PAS les anciens refus (aucun brouillon conservé) : montre seulement ce que le code accepte.
// Usage : <node 24 géré> skills/rapport-telegram/scripts/sonde-finance-v6.mjs
import { fileURLToPath } from "node:url";
const R = fileURLToPath(new URL("../../../", import.meta.url));
const { renderBrief } = await import(R + "services/alerts-runtime/src/pipeline.js");
const { validateItem } = await import(R + "services/alerts-runtime/src/context.js");
const fred = { producer: "finance-watch", url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=2026-10-02&coed=2026-10-02", title: "Taux US à 10 ans",
  topic: "finance", scope: "public", publishedAt: "2026-10-06T05:33:24.866Z", observedAt: "2026-10-06T05:33:24.866Z", readAt: "2026-10-06T05:33:24.866Z", sourceStatus: "read",
  excerpt: "Relevé public du 2026-10-06. Taux US à 10 ans : 5.24 % → 5.28 % (2026-10-02). Période observée : 2026-10-02. Valeur : 5.28 %." };
const ansaText = "INTERVIEW Interview with Ansa Interview with Philip R. […] Italy had a very strong inflation reading yesterday, at 4.1 per cent. […] We've emphasised that this support should be as targeted as possible because a broad-based fiscal support essentially adds to demand in the economy and that is not going to help inflation return to 2 per cent in a timely manner.";
const ansa = { producer: "sentinelle", url: "https://www.ecb.europa.eu/press/inter/date/2026/html/ecb.in261006~bc94400297.en.html", title: "Interview with Ansa",
  topic: "finance", scope: "public", publishedAt: "2026-10-06T07:00:00.000Z", observedAt: "2026-10-06T07:30:00.000Z", readAt: "2026-10-06T07:30:00.000Z", sourceStatus: "read", excerpt: ansaText };
const q = { fred: "Taux US à 10 ans : 5.24 % → 5.28 % (2026-10-02).", italie: "Italy had a very strong inflation reading yesterday, at 4.1 per cent.",
  budget: "We've emphasised that this support should be as targeted as possible because a broad-based fiscal support essentially adds to demand in the economy and that is not going to help inflation return to 2 per cent in a timely manner." };
const brief = facts => ({ goal: "finance", facts, utility: "Suivi public des taux et de l'inflation, sans portefeuille ni transaction.", action: "Rien à faire maintenant.", uncertainty: "Extrait partiel ; une seule observation." });
export const cas = [
  ["FRED, traduction fidèle", fred, [{ summary: "Le taux US à 10 ans est passé de 5,24 % à 5,28 % (observation du 2026-10-02).", quote: q.fred }]],
  ["FRED, écart calculé en points de base", fred, [{ summary: "Le taux US à 10 ans a gagné 4 points de base, à 5,28 %.", quote: q.fred }]],
  ["Ansa, traduction fidèle 1", ansa, [{ summary: "Selon l'entretien, l'inflation italienne a atteint 4,1 % lors du dernier relevé.", quote: q.italie }]],
  ["Ansa, traduction fidèle 2", ansa, [{ summary: "L'interviewé estime qu'un soutien budgétaire large ajoute à la demande et freine le retour de l'inflation à 2 %.", quote: q.budget }]],
  ["Ansa, attribution « BCE » hors citation", ansa, [{ summary: "Selon la BCE, l'inflation italienne a atteint 4,1 %.", quote: q.italie }]],
  ["Ansa, nom « Lane » absent de l'extrait", ansa, [{ summary: "Philip Lane note que l'inflation italienne a atteint 4,1 %.", quote: q.italie }]]
];
export function rejouer() {
  return cas.map(([nom, source, facts]) => {
    try { renderBrief(validateItem(source), brief(facts)); return [nom, "ACCEPTÉ"]; } catch (e) { return [nom, "REFUSÉ " + (e.code ?? e.message)]; }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) for (const [nom, r] of rejouer()) console.log(nom.padEnd(42), r);
