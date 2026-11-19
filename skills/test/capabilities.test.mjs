import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildRegistry, SKILLS_ROOT, validateSkill } from "../tools/registry.mjs";
import { loadManagers } from "../../agents/tools/managers.mjs";

const skill = (body, compatibility) => `---\nname: demo\ndescription: Démo de compatibilité pour les tests du registre.\n${compatibility ? `compatibility: "${compatibility}"\n` : ""}metadata:\n  version: "1.0.0"\n  famille: system\n  manager: system\n  risque: lecture\n  profil: "non"\n  statut: actif\n  provenance: "test"\n---\n# Démo\n${body}\n`;

function check(body, compatibility) {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-compat-"));
  try {
    const dir = path.join(root, "demo"); mkdirSync(dir);
    writeFileSync(path.join(dir, "SKILL.md"), skill(body, compatibility));
    return validateSkill(dir).errors;
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test("a skill that runs commands declares where it can run", () => {
  assert.match(check("Lancer `node scripts/x.mjs`.").join(), /declare compatibility/);
  assert.deepEqual(check("Lancer `node scripts/x.mjs`.", "claude-code, codex"), []);
  assert.match(check("Lancer `node scripts/x.mjs`.", "claude-code, openclaw").join(), /Sans shell \(OpenClaw\)/);
  assert.deepEqual(check("Lancer `node scripts/x.mjs`.\nSans shell (OpenClaw) : lire l'outil natif.", "claude-code, openclaw"), []);
  assert.match(check("Texte.", "claude-code, vscode").join(), /compatibility must list/);
  assert.deepEqual(check("Rédiger un texte sans commande."), []);
});

// Mirrors the OpenClaw manager runtime: tools.deny contains exec, so a skill without
// "openclaw" in its compatibility must not be shipped there (request to Codex, K05).
test("no OpenClaw manager receives a skill it cannot execute", () => {
  const entries = new Map(buildRegistry(SKILLS_ROOT).results.map(r => [r.entry.name, r.entry]));
  const shipped = [];
  for (const m of loadManagers().filter(m => m.runtimes.includes("openclaw"))) {
    for (const name of m.skills) {
      const compat = entries.get(name).compatibility;
      if (!compat || compat.includes("openclaw")) shipped.push(`${m.name}:${name}`);
    }
  }
  for (const item of shipped) {
    const name = item.split(":")[1];
    assert.ok(!/`(?:node|git|gh|npm|curl|python3|bash) [^`]*`/.test(entries.get(name).description), item);
  }
  for (const blocked of ["system:system-steward", "knowledge:encyclopedie-anakalypto", "knowledge:verification-affirmations", "chief-of-staff:jev-decision"])
    assert.ok(!shipped.includes(blocked), `${blocked} needs a shell`);
  assert.ok(shipped.includes("business:business-engine") && shipped.includes("chief-of-staff:passation-session"), "adapted skills stay available");
});

test("paused Career skills say so in their trigger", () => {
  for (const name of ["job-application-optimizer", "interview-prep", "recruiter-outreach"]) {
    const entry = buildRegistry(SKILLS_ROOT).results.find(r => r.entry.name === name).entry;
    assert.match(entry.description, /^Career en pause depuis le 2026-10-05/);
  }
});
