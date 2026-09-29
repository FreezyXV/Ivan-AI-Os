import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { garden, loadNotes, report } from "../system-steward/scripts/jardinier.mjs";
import { audit, LIMITS } from "../system-steward/scripts/audit.mjs";
import { AGENT_ROOT, add, init } from "../memoire-obsidian/scripts/memoire.mjs";

function vault(t) {
  const v = mkdtempSync(path.join(tmpdir(), "ivan-garden-"));
  t.after(() => rmSync(v, { recursive: true, force: true }));
  mkdirSync(path.join(v, ".obsidian")); init(v);
  return v;
}
const base = { sources: ["https://example.org/a"], sensibilite: "interne", agent: "t" };

test("gardener finds duplicates, possible contradictions, stale proposals and recurring sources without writing", t => {
  const v = vault(t);
  add(v, { ...base, type: "connaissance", titre: "Taux de dépôt BCE septembre", body: "Le taux est de 2,5 %.", now: new Date("2026-08-01T00:00:00Z") });
  add(v, { ...base, type: "decision", titre: "Taux dépôt BCE septembre décision", body: "Taux retenu 2,5 %." , now: new Date("2026-09-20T00:00:00Z") });
  add(v, { ...base, type: "connaissance", titre: "Population France 2024", sources: ["https://example.org/insee"], body: "68,4 millions d'habitants." });
  add(v, { ...base, type: "decision", titre: "France population 2024 chiffre", sources: ["https://example.org/insee"], body: "67 millions d'habitants." });
  add(v, { ...base, type: "journal", titre: "Vieux compte rendu", body: "x", now: new Date("2026-05-01T00:00:00Z") });
  const before = readdirSync(path.join(v, AGENT_ROOT, "inbox")).length;
  const f = garden(loadNotes(v), "2026-09-29");
  assert.equal(f.doublons.length, 1);
  assert.equal(f.contradictions.length, 1);
  assert.ok(f.perimees.some(p => /proposition non validée depuis 59 j/.test(p.raison)));
  assert.ok(f.perimees.some(p => /journal de 151 j/.test(p.raison)));
  assert.equal(f.sources_recurrentes[0].notes, 3);
  assert.match(report(f, 5), /Propositions seulement : aucune note n'a été modifiée/);
  assert.equal(readdirSync(path.join(v, AGENT_ROOT, "inbox")).length, before, "read-only");
  assert.match(report(garden([], "2026-09-29"), 0), /la mémoire est propre/);
});

test("auditor measures description cost and flags long descriptions, duplicated rules and bloated instructions", t => {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-audit-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const skills = path.join(root, "skills");
  const rule = "- Ne jamais inventer une expérience, un chiffre, un diplôme ou une certification dans un livrable.";
  const meta = 'metadata:\n  version: "1.0.0"\n  famille: t\n  manager: system\n  risque: lecture\n  profil: "non"\n  statut: actif\n  provenance: "t"';
  for (const [name, desc] of [["alpha", "x".repeat(LIMITS.description_chars + 1)], ["beta", "Short."]]) {
    mkdirSync(path.join(skills, name), { recursive: true });
    writeFileSync(path.join(skills, name, "SKILL.md"), `---\nname: ${name}\ndescription: ${desc}\n${meta}\n---\n# ${name}\n${rule}\n`);
  }
  writeFileSync(path.join(root, "AGENTS.md"), Array(LIMITS.instruction_lines + 5).fill("rule").join("\n"));
  const a = audit({ root: skills, repo: root });
  const text = a.findings.map(f => `${f.skill}:${f.texte}`).join("\n");
  assert.ok(a.cout_descriptions_tokens > 150);
  assert.match(text, /alpha:description de 601 caractères/);
  assert.match(text, /alpha, beta:règle dupliquée/);
  assert.match(text, /AGENTS\.md:65 lignes/);
  assert.match(text, /actif sans evals\.json/);
});
