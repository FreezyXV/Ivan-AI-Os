import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { businessBrief, financeBrief } from "./briefs.js";
import { createEngineTools } from "./tools.js";

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-engine-briefs-"));
  const businessDir = path.join(root, "business"), financeDir = path.join(root, "finance");
  mkdirSync(businessDir, { mode: 0o700 });
  mkdirSync(financeDir, { mode: 0o700 });
  mkdirSync(path.join(financeDir, "snapshots"), { mode: 0o700 });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, businessDir, financeDir };
}

test("Business tool returns bounded public scores and links, omitting private profile and content", async t => {
  const { businessDir, financeDir } = fixture(t);
  const rows = [
    { sujet: "emploi-exemple", total: 23, horizon: "cash", decision: "lancer", note_le: "2026-09-29",
      cible: "CLIENT_PRIVATE_SENTINEL", douleur: "PRIVATE_PAIN_SENTINEL",
      criteres: { demande: { preuve: "https://example.org/study?access=PRIVATE_QUERY_SENTINEL" }, fit: { preuve: "profil" } } },
    { sujet: "fausse-opportunite", total: 10, horizon: "venture", decision: "abandonner", criteres: {} }
  ];
  writeFileSync(path.join(businessDir, "opportunites.jsonl"), rows.map(x => JSON.stringify(x)).join("\n") + "\n", { mode: 0o600 });
  const brief = businessBrief(businessDir);
  assert.equal(brief.status, "READY");
  assert.equal(brief.total_subjects, 2);
  assert.equal(brief.opportunities.length, 1);
  assert.deepEqual(brief.opportunities[0].preuves_publiques, ["https://example.org/study"]);
  assert.equal(JSON.stringify(brief).includes("PRIVATE"), false);
  const tool = createEngineTools({ agentId: "ivan-business" }, { businessDir, financeDir });
  assert.equal(tool.name, "ivan_business_brief");
  assert.equal((await tool.execute()).details.status, "READY");
  assert.equal(createEngineTools({ agentId: "main" }, { businessDir, financeDir }), null);
  assert.equal(createEngineTools({ agentId: "ivan-finance" }, { businessDir, financeDir }).name, "ivan_finance_brief");
});

test("Finance tool reads only dated public snapshots and never opens allocation.json", async t => {
  const { businessDir, financeDir } = fixture(t), folder = path.join(financeDir, "snapshots");
  const indicator = value => ({ id: "bce_taux_depot", libelle: "BCE — taux dépôt", valeur: value, unite: "%", date_obs: "2026-09-29",
    source: "https://data.ecb.europa.eu/rates?key=PRIVATE_QUERY_SENTINEL" });
  for (const [date, value] of [["2026-09-28", 2], ["2026-09-29", 2.25]])
    writeFileSync(path.join(folder, `${date}.json`), JSON.stringify({ version: 1, date, indicateurs: [indicator(value)], erreurs: [] }), { mode: 0o600 });
  writeFileSync(path.join(financeDir, "allocation.json"), "PERSONAL_ALLOCATION_SENTINEL", { mode: 0o600 });
  const brief = financeBrief(financeDir);
  assert.equal(brief.status, "READY");
  assert.deepEqual([brief.indicateurs[0].valeur, brief.indicateurs[0].valeur_precedente], [2.25, 2]);
  assert.equal(brief.indicateurs[0].source, "https://data.ecb.europa.eu/rates");
  assert.equal(JSON.stringify(brief).includes("PRIVATE"), false);
  assert.equal(JSON.stringify(brief).includes("PERSONAL"), false);
  assert.equal((await createEngineTools({ agentId: "ivan-finance" }, { businessDir, financeDir }).execute()).details.personal_allocation_included, false);
});

test("private file bounds and symlink protection fail closed without leaking paths or data", async t => {
  const { root, businessDir, financeDir } = fixture(t);
  assert.deepEqual(businessBrief(businessDir), { status: "EMPTY", opportunities: [], total_subjects: 0 });
  assert.deepEqual(financeBrief(financeDir), { status: "EMPTY", indicateurs: [], erreurs: [] });
  writeFileSync(path.join(root, "outside.jsonl"), "PRIVATE_SENTINEL", { mode: 0o600 });
  symlinkSync(path.join(root, "outside.jsonl"), path.join(businessDir, "opportunites.jsonl"));
  const tool = createEngineTools({ agentId: "ivan-business" }, { businessDir, financeDir });
  const result = (await tool.execute()).details;
  assert.deepEqual(result, { status: "UNAVAILABLE", error_code: "BRIEF_UNAVAILABLE" });
  assert.equal(JSON.stringify(result).includes("PRIVATE"), false);
  writeFileSync(path.join(financeDir, "snapshots", "2026-09-29.json"), "x".repeat(100_001), { mode: 0o600 });
  assert.throws(() => financeBrief(financeDir), /BRIEF_UNAVAILABLE/);
});
