import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { qualiteFiche, verifierFiche } from "../business-engine/scripts/fiche.mjs";

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
    [f => { f.hypothese = "Hypothèse : 5 000 € de MRR en trois mois avec une offre dédiée."; }, "MONTANT_NON_ETAYE_HYPOTHESE"],
    [f => { f.hypothese = "Hypothèse : cette offre générerait un revenu récurrent rapide."; }, "REVENU_INVENTE_HYPOTHESE"],
    [f => { f.prochainTest.description = "Contacter dix équipes sur LinkedIn pour présenter l'offre cette semaine."; }, "TEST_IRREVERSIBLE_OU_CONTACT"],
    [f => { f.prochainTest.coutEur = 49; }, "TEST_COUT_NON_NUL"],
    [f => { f.decision = "lancer"; }, "DECISION_SANS_RESULTAT_MOTEUR"],
    [f => { f.acheteur.statut = "établi"; }, "ACHETEUR_ETABLI_SANS_PAIEMENT"],
    [f => { f.decision = "exploratoire"; }, "A_NOTER_PAR_SIGNALS"],
    [f => { f.sourcesDistinctes = 3; }, "SOURCES_DISTINCTES_FAUSSES"],
    [f => { f.objections = []; }, "OBJECTIONS_ABSENTES"]
  ];
  for (const [mutate, code] of cases) { const f = copie(exemple); mutate(f); assert.ok(verifierFiche(f, sources).includes(code), code); }
});

// Codex review of #61 (f3f0861): four counter-examples the verifier accepted, plus malformed input.
test("regression: empty citation, irreversible test, unsupported amount, arbitrary score", () => {
  const empty = copie(exemple); empty.preuves[0].citation = "";
  assert.ok(verifierFiche(empty, sources).includes("PREUVE_0_CITATION_VIDE"));
  const irreversible = copie(exemple); irreversible.prochainTest.reversible = false;
  assert.ok(verifierFiche(irreversible, sources).includes("TEST_NON_REVERSIBLE"));
  const money = copie(exemple), withFive = sources.map(s => s.url === money.preuves[0].url ? { ...s, excerpt: `${s.excerpt} It costs $5 per seat.` } : s);
  money.preuves.push({ url: money.preuves[0].url, date: money.preuves[0].date, type: "offre-existante", citation: "It costs $5 per seat." });
  money.hypothese = "Hypothèse : une offre à 999999 € par an trouverait preneur.";
  assert.ok(verifierFiche(money, withFive).includes("MONTANT_NON_ETAYE_HYPOTHESE"), "a currency in a quote does not support another amount");
  money.hypothese = "Hypothèse : les équipes paient déjà $5 par siège pour un outil de revue.";
  assert.ok(!verifierFiche(money, withFive).some(e => e.startsWith("MONTANT_")), "the exact quoted amount is allowed");
  const arbitrary = copie(exemple); arbitrary.decision = "lancer"; arbitrary.scoreCode = 1;
  const errs = verifierFiche(arbitrary, sources);
  assert.ok(errs.includes("DECISION_SANS_RESULTAT_MOTEUR"), "a declared scoreCode is not engine provenance");
});
test("engine provenance: the recommendation must equal scoreOpportunity on the embedded input", () => {
  const url = exemple.preuves[0].url, url2 = exemple.preuves[2].url;
  const entree = { sujet: "revue-architecturale-code-agents", cible: "équipes utilisant des agents de code", douleur: "revue d'architecture des grosses PR",
    jours_premier_euro: 45, criteres: { demande: { note: 3, preuve: url2 }, paiement: { note: 2, preuve: url }, concurrence: { note: 2, preuve: url },
      fit: { note: 3, preuve: "profil" }, delai_mvp: { note: 3, preuve: "profil" }, cout_acquisition: { note: 2, preuve: url2 } } };
  const ok = copie(exemple); ok.moteur = { source: "signals.mjs#scoreOpportunity", entree }; ok.decision = "abandon"; ok.scoreCode = 15;
  assert.deepEqual(verifierFiche(ok, sources), [], "15/30 → abandonner, consistent");
  const wrong = copie(ok); wrong.decision = "creuser";
  assert.ok(verifierFiche(wrong, sources).includes("DECISION_DIFFERENTE_DU_MOTEUR"));
  const total = copie(ok); total.scoreCode = 25;
  assert.ok(verifierFiche(total, sources).includes("SCORE_DIFFERENT_DU_MOTEUR"));
  const foreign = copie(ok); foreign.moteur.entree.criteres.demande.preuve = "https://example.org/autre";
  assert.ok(verifierFiche(foreign, sources).includes("MOTEUR_PREUVE_NON_CITEE_DEMANDE"));
  const invalid = copie(ok); delete invalid.moteur.entree.criteres.paiement;
  assert.ok(verifierFiche(invalid, sources).some(e => e.startsWith("MOTEUR_INVALIDE")));
});
test("malformed or incomplete JSON returns errors, never throws", () => {
  for (const bad of [null, undefined, {}, [], "x", { preuves: [null, 3, {}] }, { prochainTest: null, acheteur: null, objections: "x" }, { moteur: { entree: null }, decision: "lancer" }])
    assert.ok(Array.isArray(verifierFiche(bad, sources)) && verifierFiche(bad, sources).length > 0, JSON.stringify(bad));
});

// Real native output (runtime 33480ee, B03): mechanically valid, editorially weak. Two new checks.
test("native B03 fiche: mechanically valid, but editorial warnings flag a non-evidence test and a non-market hypothesis", () => {
  const b03 = JSON.parse(readFileSync(new URL("sortie-native-B03.json", dir), "utf8")).fiche;
  assert.deepEqual(verifierFiche(b03, sources), [], "blocking checks unchanged: the runtime keeps accepting it");
  assert.deepEqual(qualiteFiche(b03).sort(), ["HYPOTHESE_SANS_MARCHE", "TEST_SANS_RECHERCHE_DE_PREUVE"]);
  const fixed = copie(b03);
  fixed.hypothese = "Hypothèse : des équipes qui paient un outil d'emailing tarifé au contact chercheraient une offre en libre-service tarifée à l'usage.";
  fixed.prochainTest.description = "Pendant 3 jours, relever dans des discussions publiques déjà en ligne d'autres témoignages distincts sur la tarification au contact et l'engagement annuel ; aucun message.";
  assert.deepEqual(verifierFiche(fixed, sources), []);
  assert.deepEqual(qualiteFiche(fixed), []);
  assert.deepEqual(qualiteFiche(exemple), [], "the 2-source example has no warning");
});
