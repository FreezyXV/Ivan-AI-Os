import test from "node:test";
import assert from "node:assert/strict";
import { chargerCorpus } from "../rapport-telegram/scripts/verifier.mjs";
import { noter, preparer, tableau } from "../rapport-telegram/scripts/evaluer.mjs";

const corpus = chargerCorpus();

test("prepared inputs never leak expected answers or capture notes", () => {
  const { empreinte, lignes } = preparer(corpus);
  assert.match(empreinte, /^[0-9a-f]{16}$/);
  assert.ok(lignes.length >= 10);
  for (const l of lignes) {
    const texte = JSON.stringify(l);
    for (const fuite of ["attendu", "justification", "interdits", "doit_contenir", "lecture"]) assert.ok(!texte.includes(`"${fuite}"`), `${l.id}: ${fuite}`);
  }
});

test("scoring separates relevance from the coded checks", () => {
  const i01 = corpus.independant.cas.find(c => c.id === "I01").entree.source;
  const quote = "Updates are now available in v16.3.8 (Active LTS) and v15.5.27 (Maintenance LTS) to address these issues.";
  assert.ok(i01.excerpt.includes(quote));
  const bon = { goal: "engineering", facts: [{ summary: "Correctifs publiés en v16.3.8 et v15.5.27.", quote }],
    utility: "Utile pour les projets Next.js.", action: "Vérifier la version de next dans les dépôts actifs.", uncertainty: "Extrait partiel." };
  const { resultats, synthese } = noter([
    { id: "I01", selection: { decision: "keep", confidence: 0.8 }, brief: bon },
    { id: "I03", selection: { decision: "keep", confidence: 0.9 }, brief: bon },
    { id: "I07", selection: { decision: "review", confidence: 0.6 } },
    { id: "I08", selection: { decision: "skip", confidence: 0.8 } }
  ], corpus);
  const r = Object.fromEntries(resultats.map(x => [x.id, x]));
  assert.equal(r.I01.pertinence, 2);
  assert.ok(r.I01.erreurs.includes("MANQUE:images.remotePatterns"), "required element missing is reported");
  assert.equal(r.I03.pertinence, 0, "AI noise sent as keep");
  assert.ok(r.I03.erreurs.includes("SYNTHESE_POUR_UN_CAS_NON_RETENU"));
  assert.equal(r.I07.pertinence, 2);
  assert.equal(r.I08.pertinence, 2, "tolerated skip");
  assert.equal(synthese.keep, 50);
  assert.match(tableau({ resultats, synthese }), /à noter par un humain/);
});
