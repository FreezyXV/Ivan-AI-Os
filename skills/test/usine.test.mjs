import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { outcomes, privateDir, recommend, record, stats, validateOutcome } from "../usine-logicielle/scripts/usine.mjs";

const o = (pr, categorie, constructeur, resultat, bloquants = resultat === "accepte" ? 0 : 1) =>
  ({ pr, date: "2026-09-29", categorie, constructeur, relecteur: constructeur === "claude" ? "codex" : "claude", resultat, bloquants });

test("the shipped history is valid and reflects the reviewed PRs", () => {
  const list = outcomes();
  assert.equal(list.length, 14);
  assert.deepEqual([stats(list).infra.codex.acceptes, stats(list).outillage.claude.acceptes], [3, 0]);
});

test("recommendation: owner first, then measurement, then roadmap prior, then alternation", () => {
  const measured = [o(1, "tests", "claude", "accepte"), o(2, "tests", "claude", "accepte"), o(3, "tests", "claude", "accepte"),
    o(4, "tests", "codex", "corrige"), o(5, "tests", "codex", "accepte"), o(6, "tests", "codex", "corrige")];
  assert.equal(recommend("tests", measured).constructeur, "claude", "measurement beats the 'codex' prior");
  assert.match(recommend("tests", measured).raison, /mesuré : claude 3\/3, codex 1\/3/);
  assert.equal(recommend("tests", measured, { proprietaire: "codex" }).constructeur, "codex");
  assert.match(recommend("frontend", []).raison, /a priori/);
  assert.equal(recommend("frontend", []).constructeur, "codex");
  assert.equal(recommend("data", [o(1, "data", "claude", "accepte")]).constructeur, "codex", "alternate to measure the other builder");
  assert.throws(() => recommend("cuisine", []), /CATEGORIE_INVALIDE/);
});

test("outcomes are validated and the private ledger overrides a re-recorded PR", t => {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-usine-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = privateDir({ IVAN_ENGINEERING_DIR: path.join(root, "eng") });
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  assert.throws(() => validateOutcome({ ...o(9, "tests", "claude", "accepte"), bloquants: 1 }), /ACCEPTE_AVEC_BLOQUANTS/);
  assert.throws(() => validateOutcome({ ...o(9, "tests", "claude", "accepte"), relecteur: "claude" }), /AGENTS_INVALIDES/);
  record(dir, { ...o(14, "backend", "codex", "accepte"), note: "second passage validé" });
  assert.equal(statSync(path.join(dir, "ledger.jsonl")).mode & 0o777, 0o600);
  assert.equal(outcomes(dir).find(x => x.pr === 14).resultat, "accepte");
});
