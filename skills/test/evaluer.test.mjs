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

test("prose-only outputs have no relevance score (N/A), mixed runs count only measured selections", () => {
  const i13 = corpus.independant.cas.find(c => c.id === "I13").entree.source;
  const quote = "Figure 1: ThinkingBox runs an agent against isolated MCP tool sessions, then grades the terminal backend state and side effects it leaves behind.";
  assert.ok(i13.excerpt.includes(quote));
  const brief = { goal: "system", facts: [{ summary: "ThinkingBox évalue l'état final laissé par l'agent.", quote }],
    utility: "Vérifier l'état produit.", action: "Rien à faire maintenant.", uncertainty: "Extrait partiel." };
  const prose = noter([{ id: "I13", variante: "current-v3", selectionMeasured: false, brief },
    { id: "I01", variante: "current-v3", selectionMeasured: false }], corpus);
  for (const r of prose.resultats) assert.equal(r.pertinence, null, "never 0/2 without a measured selection");
  assert.equal(prose.synthese.pertinenceMax, 0);
  assert.equal(prose.synthese.keep, null, "no KEEP rate invented");
  assert.match(tableau(prose), /\| N\/A \|/);
  assert.match(tableau(prose), /pertinence N\/A/);
  const mixed = noter([{ id: "I13", selectionMeasured: false, brief }, { id: "I07", selection: { decision: "review", confidence: 0.6 } }], corpus);
  assert.equal(mixed.synthese.pertinence, 2);
  assert.equal(mixed.synthese.pertinenceMax, 2, "only the measured selection is in the denominator");
  assert.equal(mixed.synthese.review, 100);
});
