import test from "node:test";
import assert from "node:assert/strict";
import { chargerCorpus, rendre, verifierBrief, verifierCas, verifierMessage } from "../rapport-telegram/scripts/verifier.mjs";

const { construction, independant } = chargerCorpus();
const C1 = construction.exemples.find(e => e.id === "C1-plafonds-budget");
const copie = value => structuredClone(value);

test("construction briefs pass the coded checks and render as standalone messages", () => {
  for (const ex of construction.exemples.filter(e => e.brief)) {
    assert.deepEqual(verifierBrief(ex.source, ex.brief), [], ex.id);
    const message = rendre(ex.source, ex.brief);
    assert.deepEqual(verifierMessage(message, ex.source), [], ex.id);
    assert.ok(message.length >= 1000 && message.length <= 1800, `${ex.id}: ${message.length}`);
    assert.ok(message.trimEnd().endsWith(ex.source.url));
  }
  const silent = construction.exemples.find(e => e.id === "C2a-lane-extrait-debut");
  assert.equal(silent.brief, null, "a non-substantive excerpt yields no synthesis");
});

test("independent set: at least ten well-formed cases covering the required categories", () => {
  assert.ok(independant.cas.length >= 10);
  for (const cas of independant.cas) assert.deepEqual(verifierCas(cas), [], cas.id);
  const categories = independant.cas.map(c => c.categorie).join(" | ");
  for (const needed of ["technique utile", "macro", "bruit IA", "doublon", "ancien", "Career", "inaccessible", "incertaine", "plusieurs sujets", "insuffisante", "instructions"])
    assert.match(categories, new RegExp(needed), needed);
  for (const cas of independant.cas.filter(c => c.reel && c.entree.source?.sourceStatus === "read"))
    assert.match(cas.entree.source.lecture.sha256Texte, /^[0-9a-f]{64}$/, `${cas.id} keeps its capture hash`);
});

test("construction and evaluation sets never share a source", () => {
  const urls = set => new Set(set.map(x => x.source?.url ?? x.entree?.source?.url).filter(Boolean));
  const built = urls(construction.exemples), evaluated = urls(independant.cas);
  for (const url of evaluated) assert.ok(!built.has(url), url);
});

test("coded checks reject the classic failures", () => {
  const exact = copie(C1.brief); exact.facts[0].quote = exact.facts[0].quote.replace("’", "'");
  assert.ok(verifierBrief(C1.source, exact).includes("FAIT_0_CITATION_INEXACTE"), "typographic apostrophe retyped");
  const number = copie(C1.brief); number.facts[2].summary = "Une facture surprise de plus de 20 000 dollars.";
  assert.ok(verifierBrief(C1.source, number).includes("FAIT_2_CHIFFRE_NON_ETAYE"));
  const limit = copie(C1.brief); delete limit.uncertainty;
  assert.ok(verifierBrief(C1.source, limit).includes("LIMITE_REQUISE_EXTRAIT_PARTIEL"));
  const orphan = copie(C1.brief); orphan.action = "Fixer un plafond à 50 € par mois.";
  assert.ok(verifierBrief(C1.source, orphan).includes("ACTION_CHIFFRE_ORPHELIN"));
  const trade = copie(C1.brief); trade.action = "Achète des actions de fournisseurs cloud.";
  assert.ok(verifierBrief(C1.source, trade).includes("RECOMMANDATION_TRANSACTION"));
  const goal = copie(C1.brief); goal.goal = "career";
  assert.ok(verifierBrief(C1.source, goal).includes("GOAL_HORS_PRIORITES_ACTIVES"));
  assert.ok(verifierMessage(`${C1.source.url}\nVoir le lien ci-dessus`, C1.source).includes("LIEN_PAS_EN_DERNIER"));
});

test("a case that is not kept can only be silent", () => {
  const cas = copie(independant.cas.find(c => c.id === "I07"));
  cas.attendu.livraison = "digest";
  assert.ok(verifierCas(cas).includes("NON_RETENU_DOIT_ETRE_SILENCE"));
});
