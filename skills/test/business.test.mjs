import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { addSignals, canonicalUrl, privateDir, report, recordOpportunity, scoreOpportunity, subjects } from "../business-engine/scripts/signals.mjs";

function dir(t) {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-business-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return privateDir({ IVAN_BUSINESS_DIR: path.join(root, "business") });
}
const signal = (url, extra = {}) => ({ source: "forum", url, titre: "Je paierais pour un outil de devis", sujet: "devis-artisans", type: "demande", date: "2026-09-29", ...extra });
const crit = (note, preuve = "https://example.org/proof") => ({ note, ...(note > 1 ? { preuve } : {}) });
const opportunity = extra => ({ sujet: "devis-artisans", cible: "artisans du bâtiment", douleur: "devis manuels lents", jours_premier_euro: 21,
  monetisation: "service 49 €/mois", validation_7j: "landing + 3 groupes Facebook, seuil 20 inscrits",
  criteres: { demande: crit(4), paiement: crit(4), concurrence: crit(3), fit: crit(4), delai_mvp: crit(4), cout_acquisition: crit(3) }, ...extra });

test("ledger is private and dedupes by canonical URL and by subject title", t => {
  const d = dir(t);
  assert.equal(statSync(d).mode & 0o777, 0o700);
  assert.equal(canonicalUrl("https://www.Example.org/post/?utm_source=x#top"), "example.org/post");
  const first = addSignals(d, [signal("https://example.org/a"), signal("https://www.example.org/a/?utm_campaign=y"), signal("https://other.org/b")]);
  assert.deepEqual(first, { added: 1, duplicates: 2, total: 1 });
  assert.equal(addSignals(d, [signal("https://third.org/c", { titre: "Autre besoin précis" })]).added, 1);
  assert.equal(statSync(path.join(d, "signals.jsonl")).mode & 0o777, 0o600);
  assert.throws(() => addSignals(d, [signal("ftp://x.org/a")]), /URL_INVALID/);
  assert.throws(() => addSignals(d, [signal("https://x.org/a", { type: "rumeur" })]), /SIGNAL_TYPE_INVALID/);
  assert.throws(() => addSignals(d, [signal("https://x.org/a", { extrait: `Bearer ${"a".repeat(30)}` })]), /CREDENTIAL_REFUSED/);
});

test("subjects are ranked by distinct sources, not raw repetition", t => {
  const d = dir(t);
  addSignals(d, [
    signal("https://a.org/1", { titre: "t1" }), signal("https://a.org/2", { titre: "t2" }), signal("https://a.org/3", { titre: "t3" }),
    signal("https://b.org/1", { sujet: "compta-freelance", titre: "u1" }), signal("https://c.org/1", { sujet: "compta-freelance", titre: "u2", preuve_paiement: true })
  ]);
  const ranked = subjects(d, 2);
  assert.deepEqual(ranked.map(s => [s.sujet, s.sources, s.signaux]), [["compta-freelance", 2, 2], ["devis-artisans", 1, 3]]);
  assert.equal(ranked[0].preuve_paiement, true);
});

test("scoring requires evidence, applies eliminators and classifies Cash/Venture", () => {
  const cash = scoreOpportunity(opportunity());
  assert.deepEqual([cash.total, cash.horizon, cash.decision], [22, "cash", "lancer"]);
  assert.equal(scoreOpportunity(opportunity({ jours_premier_euro: 120 })).horizon, "venture");
  assert.throws(() => scoreOpportunity(opportunity({ criteres: { ...opportunity().criteres, demande: { note: 4 } } })), /CRITERE_DEMANDE_PREUVE_REQUIRED/);
  const unpaid = scoreOpportunity(opportunity({ criteres: { ...opportunity().criteres, paiement: crit(0) } }));
  assert.deepEqual([unpaid.decision, unpaid.eliminatoires], ["abandonner", ["aucune_preuve_paiement"]]);
  assert.equal(scoreOpportunity(opportunity({ eliminatoires: ["plateforme_unique"] })).decision, "abandonner");
  assert.throws(() => scoreOpportunity(opportunity({ jours_premier_euro: 0 })), /JOURS_PREMIER_EURO_REQUIRED/);
  // The private profile is evidence for fit and MVP delay only.
  const profile = { ...opportunity().criteres, fit: { note: 5, preuve: "profil" }, delai_mvp: { note: 4, preuve: "profil" } };
  assert.equal(scoreOpportunity(opportunity({ criteres: profile })).total, 23);
  assert.throws(() => scoreOpportunity(opportunity({ criteres: { ...profile, demande: { note: 4, preuve: "profil" } } })), /CRITERE_DEMANDE_PREUVE_REQUIRED/);
});

test("report keeps the latest score per subject, splits Cash/Venture and omits dropped ideas", t => {
  const d = dir(t);
  recordOpportunity(d, opportunity({ criteres: { ...opportunity().criteres, paiement: crit(0) } }));
  recordOpportunity(d, opportunity());
  recordOpportunity(d, opportunity({ sujet: "saas-niche", jours_premier_euro: 90 }));
  recordOpportunity(d, opportunity({ sujet: "abandon", eliminatoires: ["reglementation_lourde"] }));
  const md = report(d, 3);
  assert.match(md, /## Cash[\s\S]*devis-artisans — 22\/30 → lancer[\s\S]*## Venture[\s\S]*saas-niche/);
  assert.doesNotMatch(md, /### abandon/);
  assert.match(md, /3 sujet\(s\) notés, 1 abandonné/);
  assert.equal(readFileSync(path.join(d, "opportunites.jsonl"), "utf8").trim().split("\n").length, 4);
});
