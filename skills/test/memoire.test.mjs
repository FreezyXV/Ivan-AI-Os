import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { AGENT_ROOT, add, init, list, parseNote, resolveVault, verify } from "../memoire-obsidian/scripts/memoire.mjs";

function vault(t) {
  const dir = mkdtempSync(path.join(tmpdir(), "ivan-vault-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(path.join(dir, ".obsidian"));
  writeFileSync(path.join(dir, "Bienvenue.md"), "note personnelle d'Ivan");
  return resolveVault({ IVAN_OBSIDIAN_VAULT: dir }, "/nonexistent");
}
const note = extra => ({ type: "connaissance", titre: "Taux du Livret A en 2026", sources: ["https://example.org/source"], sensibilite: "public", agent: "claude-code", body: "Fait synthétique.", now: new Date("2026-09-29T10:00:00Z"), ...extra });

test("vault resolution requires an absolute Obsidian vault", t => {
  const dir = mkdtempSync(path.join(tmpdir(), "ivan-notvault-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.throws(() => resolveVault({}, "/nonexistent"), /VAULT_NOT_CONFIGURED/);
  assert.throws(() => resolveVault({ IVAN_OBSIDIAN_VAULT: "relative" }, "/nonexistent"), /VAULT_NOT_CONFIGURED/);
  assert.throws(() => resolveVault({ IVAN_OBSIDIAN_VAULT: path.join(dir, "missing") }, "/nonexistent"), /VAULT_NOT_FOUND/);
  assert.throws(() => resolveVault({ IVAN_OBSIDIAN_VAULT: dir }, "/nonexistent"), /NOT_AN_OBSIDIAN_VAULT/);
  const config = path.join(dir, "config.json");
  mkdirSync(path.join(dir, ".obsidian"));
  writeFileSync(config, JSON.stringify({ obsidian_vault: dir }));
  assert.ok(resolveVault({}, config).endsWith(path.basename(dir)));
});

test("init creates only the agent area, idempotently, and never touches Ivan's notes", t => {
  const v = vault(t);
  const created = init(v);
  assert.ok(created.includes(path.join(AGENT_ROOT, "inbox")) && created.includes(path.join(AGENT_ROOT, "LISEZ-MOI.md")));
  assert.deepEqual(init(v), []);
  assert.equal(readFileSync(path.join(v, "Bienvenue.md"), "utf8"), "note personnelle d'Ivan");
});

test("notes are proposals with provenance, deduplicated and never overwritten", t => {
  const v = vault(t);
  init(v);
  const rel = add(v, note({ confiance: "0.8" }));
  assert.equal(rel, path.join(AGENT_ROOT, "inbox", "taux-du-livret-a-en-2026.md"));
  const parsed = parseNote(readFileSync(path.join(v, rel), "utf8"));
  assert.deepEqual(parsed.data.sources, ["https://example.org/source"]);
  assert.equal(parsed.data.statut, "propose");
  assert.equal(parsed.data.confiance, "0.8");
  assert.throws(() => add(v, note()), error => error.message === "NOTE_EXISTS" && error.path === rel);
  const journal = add(v, note({ type: "journal", titre: "Fin de lot 12", sensibilite: "interne" }));
  assert.equal(journal, path.join(AGENT_ROOT, "journal", "2026-09-29-fin-de-lot-12.md"));
  assert.deepEqual(verify(v), []);
  assert.equal(statSync(path.join(v, rel)).mode & 0o777, 0o600);
  assert.equal(statSync(path.join(v, AGENT_ROOT, "journal")).mode & 0o777, 0o700);
  assert.equal(statSync(path.join(v, AGENT_ROOT, "LISEZ-MOI.md")).mode & 0o777, 0o600);
});

test("missing provenance, sensitivity, credentials and linked agent areas are refused", t => {
  const v = vault(t);
  for (const [extra, code] of [[{ sources: [] }, /SOURCE_REQUIRED/], [{ sensibilite: undefined }, /SENSITIVITY_REQUIRED/],
    [{ type: "autre" }, /TYPE_INVALID/], [{ agent: "" }, /AGENT_REQUIRED/], [{ confiance: "2" }, /CONFIDENCE_INVALID/],
    [{ body: "clé sk-" + "a".repeat(24) }, /CREDENTIAL_REFUSED/], [{ titre: "***" }, /TITLE_INVALID/],
    // Synthetic shapes from Codex's review: Telegram bot token and bearer header.
    [{ body: `bot ${"1".repeat(9)}:${"A".repeat(35)}` }, /CREDENTIAL_REFUSED/],
    [{ body: `Authorization: Bearer ${"b".repeat(40)}` }, /CREDENTIAL_REFUSED/],
    [{ sources: [`https://api.example.org/?h=Bearer ${"c".repeat(30)}`] }, /CREDENTIAL_REFUSED/],
    [{ body: `clé apikey_${"d".repeat(24)}` }, /CREDENTIAL_REFUSED/]]) {
    assert.throws(() => add(v, note(extra)), code);
  }
  const outside = mkdtempSync(path.join(tmpdir(), "ivan-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  symlinkSync(outside, path.join(v, AGENT_ROOT));
  assert.throws(() => add(v, note()), /AGENT_AREA_LINK_REFUSED/);
  assert.throws(() => init(v), /AGENT_AREA_LINK_REFUSED/);
  assert.equal(existsSync(path.join(outside, "inbox")), false);
});

test("verification flags incomplete notes and listing hides confidential notes from OpenClaw", t => {
  const v = vault(t);
  init(v);
  add(v, note());
  add(v, note({ titre: "Mission client synthétique", sensibilite: "confidentiel" }));
  writeFileSync(path.join(v, AGENT_ROOT, "inbox", "manuelle.md"), "---\ntype: connaissance\ntitre: x\n---\nsans source");
  const problems = verify(v);
  assert.ok(problems.some(p => /manuelle.md: sources manquant/.test(p)));
  assert.deepEqual(list(v, "interne").map(n => n.titre), ["Taux du Livret A en 2026"]);
  assert.equal(list(v, "confidentiel").length, 2);
  assert.throws(() => list(v, "secret"), /SENSITIVITY_INVALID/);
});
