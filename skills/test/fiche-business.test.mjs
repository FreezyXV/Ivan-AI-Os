import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { verifierFiche } from "../business-engine/scripts/fiche.mjs";

const dir = new URL("../business-engine/corpus/fiches-v1/", import.meta.url);
const raw = readFileSync(new URL("fixtures.jsonl", dir));
const sources = raw.toString().trim().split("\n").map(l => JSON.parse(l).item);
const labels = JSON.parse(readFileSync(new URL("labels.json", dir), "utf8"));
const exemple = JSON.parse(readFileSync(new URL("exemple-fiche-B01-B02.json", dir), "utf8"));
const copie = v => structuredClone(v);

test("corpus fiches-v1: labels separate, hashed, evidence words present in excerpts", () => {
  assert.equal(createHash("sha256").update(raw).digest("hex"), labels.fixturesSha256);
  const byId = Object.fromEntries(raw.toString().trim().split("\n").map(l => JSON.parse(l)).map(f => [f.id, f.item]));
  for (const l of labels.labels) {
    assert.ok(["utile", "faible", "bruit"].includes(l.attendu), l.id);
    for (const m of l.motsPreuve) assert.ok(byId[l.id].excerpt.toLowerCase().includes(m.toLowerCase()), `${l.id}: ${m}`);
  }
  assert.ok(!raw.toString().includes('"attendu"'), "answers never in fixtures");
});
test("the real example fiche passes the coded checks", () => {
  assert.deepEqual(verifierFiche(exemple, sources), []);
});
test("the verifier rejects the classic failures", () => {
  const cases = [
    [f => { f.preuves[0].citation = "Revue d'architecture indispensable"; }, "PREUVE_0_CITATION_INEXACTE"],
    [f => { f.hypothese = "Hypothèse : 5 000 € de MRR en trois mois avec une offre dédiée."; }, "MONTANT_INVENTE_HYPOTHESE"],
    [f => { f.prochainTest.description = "Contacter dix équipes sur LinkedIn pour présenter l'offre cette semaine."; }, "TEST_IRREVERSIBLE_OU_CONTACT"],
    [f => { f.prochainTest.coutEur = 49; }, "TEST_COUT_NON_NUL"],
    [f => { f.decision = "lancer"; }, "DECISION_SANS_SCORE_CODE"],
    [f => { f.acheteur.statut = "établi"; }, "ACHETEUR_ETABLI_SANS_PAIEMENT"],
    [f => { f.decision = "exploratoire"; }, "A_NOTER_PAR_SIGNALS"],
    [f => { f.sourcesDistinctes = 3; }, "SOURCES_DISTINCTES_FAUSSES"],
    [f => { f.objections = []; }, "OBJECTIONS_ABSENTES"]
  ];
  for (const [mutate, code] of cases) { const f = copie(exemple); mutate(f); assert.ok(verifierFiche(f, sources).includes(code), code); }
});
