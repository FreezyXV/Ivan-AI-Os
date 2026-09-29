import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, linkSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readNote, searchNotes } from "./memory.js";
import { createMemoryTools } from "./tools.js";
import { init, add } from "../../../skills/memoire-obsidian/scripts/memoire.mjs";

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-memory-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const vault = path.join(root, "vault"); mkdirSync(vault); mkdirSync(path.join(vault, ".obsidian")); init(vault);
  function make(titre, { sensitivity = "interne", status = "valide", body = "Sourced synthetic finding.", type = "decision" } = {}) {
    const full = add(vault, { type, titre, sources: ["https://example.com/source"], sensibilite: sensitivity, agent: "synthetic", body });
    const file = path.join(vault, full); writeFileSync(file, readFileSync(file, "utf8").replace("statut: propose", `statut: ${status}`));
    return { id: full.slice("Ivan AI OS/".length), file };
  }
  return { root, vault, make };
}
test("reads Claude-format validated agent notes with provenance; titles search ignores bodies", t => {
  const f = fixture(t), n = f.make("Décision architecture", { body: "A body word: PostgreSQL." });
  const before = statSync(n.file);
  const hits = searchNotes(f.vault, "decision architecture");
  assert.equal(hits.notes.length, 1); assert.equal(hits.body_read, false); assert.equal(hits.notes[0].text, undefined);
  assert.equal(searchNotes(f.vault, "PostgreSQL").notes.length, 0);
  const value = readNote(f.vault, n.id);
  assert.deepEqual(value.sources, ["https://example.com/source"]); assert.match(value.text, /PostgreSQL/);
  assert.equal(value.content_is_untrusted_data, true); assert.equal(value.status, "valide");
  assert.equal(statSync(n.file).mtimeMs, before.mtimeMs);
});
test("confidential, proposed, unknown and duplicated classifications cannot reach the model", t => {
  const f = fixture(t);
  const confidential = f.make("Private topic", { sensitivity: "confidentiel" });
  const proposed = f.make("Pending topic", { status: "propose" });
  const unknown = f.make("Unknown topic");
  writeFileSync(unknown.file, readFileSync(unknown.file, "utf8").replace("sensibilite: interne", "sensibilite: unknown"));
  const duplicate = f.make("Duplicate topic");
  writeFileSync(duplicate.file, readFileSync(duplicate.file, "utf8").replace("sensibilite: interne", "sensibilite: confidentiel\nsensibilite: interne"));
  for (const n of [confidential, proposed, unknown, duplicate]) assert.throws(() => readNote(f.vault, n.id), /MEMORY_NOTE_UNAVAILABLE/);
  assert.deepEqual(searchNotes(f.vault, "topic").notes, []);
});
test("personal notes and traversal/absolute ids are inaccessible", t => {
  const f = fixture(t); writeFileSync(path.join(f.vault, "personal.md"), "Personal note.");
  for (const id of ["../personal.md", "inbox/../../personal.md", "/tmp/personal.md", "personal.md", "inbox/nested/note.md", "inbox/%2e%2e.md"]) {
    assert.throws(() => readNote(f.vault, id), /MEMORY_ID_INVALID/);
  }
  assert.deepEqual(searchNotes(f.vault, "Personal").notes, []);
});
test("file, folder and area symlinks and hardlinks are refused", t => {
  const f = fixture(t), outside = path.join(f.root, "outside.md"); writeFileSync(outside, "Outside.");
  symlinkSync(outside, path.join(f.vault, "Ivan AI OS/inbox/symlink.md"));
  linkSync(outside, path.join(f.vault, "Ivan AI OS/inbox/hardlink.md"));
  for (const id of ["inbox/symlink.md", "inbox/hardlink.md"]) assert.throws(() => readNote(f.vault, id), /MEMORY_LINK_REFUSED/);
  rmSync(path.join(f.vault, "Ivan AI OS/decisions"), { recursive: true });
  symlinkSync(f.root, path.join(f.vault, "Ivan AI OS/decisions"));
  assert.throws(() => searchNotes(f.vault, "Outside"), /MEMORY_LINK_REFUSED/);
});
test("sources and human validation are required even when a title matches", t => {
  const f = fixture(t), n = f.make("Source missing");
  writeFileSync(n.file, readFileSync(n.file, "utf8").replace("  - https://example.com/source\n", ""));
  assert.deepEqual(searchNotes(f.vault, "Source").notes, []);
  assert.throws(() => readNote(f.vault, n.id), /MEMORY_NOTE_UNAVAILABLE/);
});
test("agent root links and excessive directory entries cannot expand the scan", t => {
  const f = fixture(t);
  for (let i = 0; i < 201; i++) writeFileSync(path.join(f.vault, "Ivan AI OS/inbox", `unindexed-${i}.txt`), "Ignored.");
  assert.throws(() => searchNotes(f.vault, "anything"), /MEMORY_INDEX_LIMIT/);
  const agentRoot = path.join(f.vault, "Ivan AI OS"); rmSync(agentRoot, { recursive: true });
  symlinkSync(f.root, agentRoot);
  assert.throws(() => searchNotes(f.vault, "anything"), /MEMORY_LINK_REFUSED/);
});
test("credential patterns in approved headers or bodies prevent disclosure", t => {
  const f = fixture(t), n = f.make("Safe title");
  const secret = ["apikey", "a".repeat(32), "b".repeat(64)].join("_");
  writeFileSync(n.file, readFileSync(n.file, "utf8") + secret);
  assert.throws(() => readNote(f.vault, n.id), /MEMORY_NOTE_UNAVAILABLE/);
  const h = f.make("Safe heading"); writeFileSync(h.file, readFileSync(h.file, "utf8").replace("Safe heading", secret));
  assert.deepEqual(searchNotes(f.vault, "Safe").notes.map(n => n.title), ["Safe title"]);
});
test("query, scan and output limits bound local work and context", t => {
  const f = fixture(t);
  for (const q of ["", " ", "a".repeat(81), "a\nb"]) assert.throws(() => searchNotes(f.vault, q), /MEMORY_QUERY_INVALID/);
  for (const limit of [0, 4, 1.5]) assert.throws(() => searchNotes(f.vault, "Report", limit), /MEMORY_QUERY_INVALID/);
  for (let i = 0; i < 4; i++) f.make(`Report ${i}`);
  assert.equal(searchNotes(f.vault, "Report").notes.length, 3);
  const large = f.make("Long report", { body: "z".repeat(5000) });
  assert.equal(readNote(f.vault, large.id).text.length, 4000); assert.equal(readNote(f.vault, large.id).truncated, true);
  writeFileSync(large.file, readFileSync(large.file, "utf8") + "z".repeat(65536));
  assert.throws(() => readNote(f.vault, large.id), /MEMORY_NOTE_UNAVAILABLE/);
});
test("tool factory permits only trusted system/knowledge identities and sanitizes errors", async t => {
  const f = fixture(t), n = f.make("Approved decision");
  for (const agentId of [undefined, "main", "ivan-finance", "ivan-engineering"]) assert.equal(createMemoryTools({ agentId }, { vaultPath: f.vault }), null);
  for (const agentId of ["ivan-system", "ivan-knowledge"]) {
    const tools = createMemoryTools({ agentId }, { vaultPath: f.vault });
    assert.equal((await tools[0].execute("synthetic", { query: "Approved" })).details.notes.length, 1);
    assert.equal((await tools[1].execute("synthetic", { id: n.id })).details.status, "valide");
    const bad = await tools[1].execute("synthetic", { id: "inbox/missing.md" });
    assert.equal(bad.details.error_code, "MEMORY_UNAVAILABLE"); assert.ok(!JSON.stringify(bad).includes(f.vault));
    const spoof = await tools[0].execute("synthetic", { query: "Approved", agentId: "ivan-system" });
    assert.equal(spoof.details.error_code, "MEMORY_ARGUMENTS_INVALID");
    const disabled = createMemoryTools({ agentId }, {});
    assert.equal((await disabled[0].execute("synthetic", { query: "Approved" })).details.error_code, "MEMORY_CONFIG_REQUIRED");
  }
});
