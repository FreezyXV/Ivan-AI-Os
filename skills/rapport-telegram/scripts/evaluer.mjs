// Banc d'évaluation K06 : prépare les entrées du jeu indépendant (sans les attendus) pour un
// passage unique dans le parcours réel (Codex), puis note les sorties. Aucun appel réseau ici.
//   node skills/rapport-telegram/scripts/evaluer.mjs preparer > entrees.jsonl
//   node skills/rapport-telegram/scripts/evaluer.mjs noter sorties.jsonl > notes.md
// Ligne de sortie attendue : {"id","variante"?,"selection":{"decision","confidence"},"brief"?,
//   "message"?,"durationMs"?,"promptChars"?,"usage"?}. La notation codée couvre la pertinence et
// les contrôles du contrat ; fidélité, utilité, action et effort restent à noter par un humain.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chargerCorpus, verifierBrief, verifierMessage } from "./verifier.mjs";

export function preparer({ independant } = chargerCorpus()) {
  const lignes = independant.cas.filter(c => c.entree?.source).map(c => {
    const { lecture, ...item } = c.entree.source;
    return { id: c.id, item };
  });
  const empreinte = createHash("sha256").update(JSON.stringify(lignes)).digest("hex").slice(0, 16);
  return { empreinte, lignes };
}

const decisionAttendue = cas => [cas.attendu.selection, ...(cas.attendu.tolere ? [cas.attendu.tolere] : [])];

export function noter(sorties, { independant } = chargerCorpus()) {
  const parId = new Map(independant.cas.map(c => [c.id, c]));
  const resultats = sorties.map(s => {
    const cas = parId.get(s.id);
    if (!cas) return { id: s.id, erreurs: ["CAS_INCONNU"] };
    const decision = s.selection?.decision;
    const pertinence = decisionAttendue(cas).includes(decision) ? 2 : (decision === "review" || cas.attendu.selection === "review") ? 1 : 0;
    const erreurs = [];
    if (s.brief && cas.attendu.selection !== "keep") erreurs.push("SYNTHESE_POUR_UN_CAS_NON_RETENU");
    if (s.brief) {
      erreurs.push(...verifierBrief(cas.entree.source, s.brief));
      const texte = [s.message ?? "", ...s.brief.facts.map(f => f.summary)].join(" ").replaceAll(".", ",");
      for (const terme of cas.doit_contenir ?? []) if (!texte.includes(terme.replaceAll(".", ","))) erreurs.push(`MANQUE:${terme}`);
      if (s.message) erreurs.push(...verifierMessage(s.message, cas.entree.source));
    }
    return { id: s.id, variante: s.variante ?? "-", attendu: cas.attendu.selection, decision: decision ?? "-",
      confiance: s.selection?.confidence ?? null, pertinence, longueur: s.message?.length ?? null,
      promptChars: s.promptChars ?? null, durationMs: s.durationMs ?? null, erreurs };
  });
  const decides = resultats.filter(r => r.decision !== "-");
  const taux = d => decides.length ? Math.round(100 * decides.filter(r => r.decision === d).length / decides.length) : 0;
  return { resultats, synthese: { cas: resultats.length, keep: taux("keep"), review: taux("review"), skip: taux("skip"),
    pertinence: resultats.reduce((a, r) => a + (r.pertinence ?? 0), 0), pertinenceMax: 2 * resultats.length,
    controlesEnEchec: resultats.filter(r => r.erreurs.length).length } };
}

export function tableau({ resultats, synthese }) {
  const lignes = ["| Cas | Variante | Attendu | Décision (conf.) | Pertinence | Contrôles | Longueur | Fidélité | Utilité | Action | Effort |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
    ...resultats.map(r => `| ${r.id} | ${r.variante} | ${r.attendu} | ${r.decision}${r.confiance === null ? "" : ` (${r.confiance})`} | ${r.pertinence}/2 | ${r.erreurs.join(", ") || "ok"} | ${r.longueur ?? "-"} | _ | _ | _ | _ |`)];
  return `${lignes.join("\n")}\n\nKEEP ${synthese.keep} % · REVIEW ${synthese.review} % · SKIP ${synthese.skip} % · pertinence ${synthese.pertinence}/${synthese.pertinenceMax} · contrôles en échec ${synthese.controlesEnEchec}\nFidélité, utilité, action, effort : 0–2 chacun, à noter par un humain (contrat § 9).\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [commande, fichier] = process.argv.slice(2);
  if (commande === "preparer") {
    const { empreinte, lignes } = preparer();
    console.error(`corpus ${empreinte}, ${lignes.length} entrées (attendus exclus)`);
    for (const l of lignes) console.log(JSON.stringify(l));
  } else if (commande === "noter" && fichier) {
    const sorties = readFileSync(fichier, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
    console.log(tableau(noter(sorties)));
  } else {
    console.error("usage : evaluer.mjs preparer | noter <sorties.jsonl>");
    process.exit(2);
  }
}
