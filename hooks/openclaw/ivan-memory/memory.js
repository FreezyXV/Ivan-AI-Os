import { constants, openSync, closeSync, readSync, fstatSync, lstatSync, realpathSync, opendirSync } from "node:fs";
import path from "node:path";

// Search order: validated knowledge first, proposals last. Journals are never "valide",
// so scanning them would only consume the file budget without ever returning a note.
const SEARCH_FOLDERS = ["connaissances", "decisions", "inbox"];
const ID = /^(inbox|connaissances|decisions|journal)\/[a-z0-9][a-z0-9-]{0,100}\.md$/;
const MAX_BYTES = 65536, MAX_HEADER = 8192, MAX_FILES = 200, MAX_BODY = 4000;
const MAX_PASSAGE = 640;
const STOP_WORDS = new Set("a au aux avec c ce ces comment d dans de des du en est et il ils j je l la le les ma mes mon ne nos notre on ou par pas pour pourquoi qu que quel quelle qui s se ses son sur t te ton un une vos votre a an and for how in is of on or the to what why with".split(" "));
// Defensive shapes only, not a claim that arbitrary prose is free of secrets.
const credentials = /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bAKIA[0-9A-Z]{16}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b\d{8,10}:[A-Za-z0-9_-]{35}\b|\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*|\bxox[abprs]-[A-Za-z0-9-]{10,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|\bapikey_[A-Za-z0-9_]{20,}/i;
export class MemoryReadError extends Error {}
const fail = code => { throw new MemoryReadError(code); };
const normalize = text => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function directory(file) {
  const stat = lstatSync(file);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("MEMORY_LINK_REFUSED");
  return realpathSync(file);
}
function rootFor(vaultPath) {
  if (typeof vaultPath !== "string" || !path.isAbsolute(vaultPath)) fail("MEMORY_CONFIG_REQUIRED");
  const vault = directory(vaultPath);
  directory(path.join(vault, ".obsidian"));
  return directory(path.join(vault, "Ivan AI OS"));
}
function fileFor(root, id) {
  if (typeof id !== "string" || !ID.test(id)) fail("MEMORY_ID_INVALID");
  const [folder] = id.split("/");
  directory(path.join(root, folder));
  const file = path.join(root, id), stat = lstatSync(file);
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) fail("MEMORY_LINK_REFUSED");
  if (realpathSync(file) !== file) fail("MEMORY_LINK_REFUSED");
  return file;
}
function parseHeader(text) {
  const data = {}; let list;
  for (const line of text.replace(/\r\n/g, "\n").split("\n").slice(1, -2)) {
    const item = /^ {2}- (.+)$/.exec(line);
    if (item && list) { data[list].push(item[1]); continue; }
    const kv = /^([a-z_]+):(?: (.*))?$/.exec(line);
    if (!kv || Object.hasOwn(data, kv[1])) fail("MEMORY_NOTE_UNAVAILABLE");
    list = kv[2] === undefined || kv[2] === "" ? kv[1] : undefined;
    data[kv[1]] = list ? [] : kv[2].replace(/^"(.*)"$/, "$1");
  }
  if (!["public", "interne"].includes(data.sensibilite) || data.statut !== "valide" ||
      !["connaissance", "decision", "journal"].includes(data.type) ||
      typeof data.titre !== "string" || !data.titre.trim() || data.titre.length > 200 ||
      !Array.isArray(data.sources) || !data.sources.length || data.sources.length > 8 ||
      data.sources.some(s => s.length > 500 || /[\x00-\x1f]/.test(s)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.cree ?? "") || credentials.test(text)) fail("MEMORY_NOTE_UNAVAILABLE");
  return { title: data.titre, type: data.type, sensitivity: data.sensibilite, status: data.statut,
    sources: data.sources, created: data.cree };
}
function sameRevision(first, second) {
  return first.ino === second.ino && first.dev === second.dev && first.size === second.size &&
    first.mtimeNs === second.mtimeNs && first.ctimeNs === second.ctimeNs;
}
function note(root, id, withBody) {
  const file = fileFor(root, id);
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.nlink !== 1n || before.size > BigInt(MAX_BYTES)) fail("MEMORY_NOTE_UNAVAILABLE");
    // Read only the header before the classification decision, not the body of
    // confidential or unvalidated notes. No title/path from refused notes escapes.
    const bytes = Buffer.alloc(MAX_HEADER), byte = Buffer.alloc(1); let n = 0;
    while (n < MAX_HEADER && readSync(fd, byte, 0, 1, n) === 1) {
      bytes[n++] = byte[0];
      if (n >= 8 && byte[0] === 10 && /\n---\r?\n$/.test(bytes.subarray(0, n).toString("utf8"))) break;
    }
    const header = bytes.subarray(0, n).toString("utf8");
    if (!/^---\r?\n/.test(header) || !/\n---\r?\n$/.test(header)) fail("MEMORY_NOTE_UNAVAILABLE");
    const metadata = parseHeader(header);
    let body;
    if (withBody) {
      const buffer = Buffer.alloc(Number(before.size) - n); let offset = 0;
      while (offset < buffer.length) { const got = readSync(fd, buffer, offset, buffer.length - offset, n + offset); if (!got) break; offset += got; }
      if (offset !== buffer.length) fail("MEMORY_NOTE_CHANGED");
      const text = buffer.toString("utf8");
      if (credentials.test(text)) fail("MEMORY_NOTE_UNAVAILABLE");
      body = { text: text.slice(0, MAX_BODY), truncated: text.length > MAX_BODY };
    }
    const after = fstatSync(fd, { bigint: true });
    const current = lstatSync(fileFor(root, id), { bigint: true });
    if (!sameRevision(before, after) || !sameRevision(before, current)) fail("MEMORY_NOTE_CHANGED");
    return {
      entry: { id, ...metadata, ...(body ?? {}), content_is_untrusted_data: true },
      bodyLine: header.split("\n").length,
      revision: current
    };
  } finally { closeSync(fd); }
}
export function readNote(vaultPath, id) { return note(rootFor(vaultPath), id, true).entry; }

function validateQuery(query, limit) {
  if (typeof query !== "string" || !query.trim() || query.length > 80 || /[\x00-\x1f]/.test(query) || credentials.test(query) || !Number.isInteger(limit) || limit < 1 || limit > 3) fail("MEMORY_QUERY_INVALID");
}
function scanNoteIds(root) {
  const ids = [];
  let scanned = 0, truncated = false;
  scan: for (const folder of SEARCH_FOLDERS) {
    const file = path.join(root, folder);
    if (!lstatSync(file, { throwIfNoEntry: false })) continue;
    directory(file);
    const dir = opendirSync(file);
    try { for (let entry; (entry = dir.readSync());) {
      // Bounded work: past the budget, answer from what was scanned rather than failing.
      if (++scanned > MAX_FILES) { truncated = true; break scan; }
      const id = `${folder}/${entry.name}`;
      if (entry.isFile() && ID.test(id)) ids.push(id);
    } } finally { dir.closeSync(); }
  }
  // Keep folder priority; sort only within a folder for stable results.
  ids.sort((a, b) => SEARCH_FOLDERS.indexOf(a.split("/")[0]) - SEARCH_FOLDERS.indexOf(b.split("/")[0]) || (a < b ? -1 : a > b ? 1 : 0));
  return { ids, truncated };
}
function searchableNote(root, id, withBody) {
  try { return note(root, id, withBody); }
  catch (error) {
    if (error?.code === "ENOENT" || (error instanceof MemoryReadError &&
        ["MEMORY_NOTE_UNAVAILABLE", "MEMORY_LINK_REFUSED", "MEMORY_NOTE_CHANGED"].includes(error.message))) return null;
    throw error;
  }
}
export function searchNotes(vaultPath, query, limit = 3) {
  validateQuery(query, limit);
  const root = rootFor(vaultPath), { ids, truncated } = scanNoteIds(root);
  const words = normalize(query.trim()).split(/\s+/), hits = [];
  for (const id of ids) {
    const match = searchableNote(root, id, false);
    if (match && words.every(word => normalize(match.entry.title).includes(word))) hits.push(match.entry);
    if (hits.length === limit) break;
  }
  return { notes: hits, title_search_only: true, body_read: false, ...(truncated ? { index_truncated: true } : {}) };
}

async function openSearchIndex() {
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(":memory:");
    try {
      db.exec(`PRAGMA temp_store = MEMORY;
        CREATE VIRTUAL TABLE note_fts USING fts5(title, body, tokenize = 'unicode61 remove_diacritics 2');`);
      return db;
    } catch (error) {
      db.close();
      throw error;
    }
  } catch {
    fail("MEMORY_FULL_TEXT_UNAVAILABLE");
  }
}

function fullTextTerms(query) {
  const terms = [...new Set(normalize(query).match(/[\p{L}\p{N}]+/gu) ?? [])];
  const keywords = terms.filter(term => !STOP_WORDS.has(term));
  // Operators and punctuation supplied by the caller never pass into MATCH syntax.
  return (keywords.length ? keywords : terms).map(term => `"${term}"`).join(" OR ");
}

function makePassage(text, excerpt, bodyLine) {
  const offset = excerpt ? text.indexOf(excerpt) : -1;
  if (offset < 0) return undefined;
  const passage = excerpt.slice(0, MAX_PASSAGE).trimEnd();
  if (!passage) return undefined;
  const start = bodyLine + (text.slice(0, offset).match(/\n/g)?.length ?? 0);
  return { text: passage, start_line: start, end_line: start + (passage.match(/\n/g)?.length ?? 0) };
}

export async function searchNotePassages(vaultPath, query, limit = 3) {
  validateQuery(query, limit);
  const expression = fullTextTerms(query);
  if (!expression) fail("MEMORY_QUERY_INVALID");
  const db = await openSearchIndex();
  try {
    const root = rootFor(vaultPath), { ids, truncated } = scanNoteIds(root);
    const add = db.prepare("INSERT INTO note_fts(rowid, title, body) VALUES (?, ?, ?)");
    const snapshots = new Map();
    let truncatedBodies = false;
    for (const [index, id] of ids.entries()) {
      const snapshot = searchableNote(root, id, true);
      if (!snapshot) continue;
      const { entry, revision } = snapshot;
      add.run(index + 1, entry.title, entry.text);
      snapshots.set(index + 1, { id, revision });
      truncatedBodies ||= entry.truncated;
    }
    const candidates = db.prepare(`SELECT rowid AS key, snippet(note_fts, 1, '', '', '', 36) AS excerpt
      FROM note_fts WHERE note_fts MATCH ? ORDER BY bm25(note_fts, 4, 1), rowid LIMIT ?`).all(expression, MAX_FILES);
    const notes = [];
    for (const candidate of candidates) {
      const { id, revision } = snapshots.get(candidate.key);
      // Check the note again after ranking. A changed or revoked note contributes no result.
      const current = searchableNote(root, id, true);
      if (!current || !sameRevision(current.revision, revision)) continue;
      const { text, truncated, ...metadata } = current.entry;
      const passage = makePassage(text, candidate.excerpt, current.bodyLine);
      notes.push({ ...metadata, ...(passage ? { passage } : {}), ...(truncated ? { truncated: true } : {}) });
      if (notes.length === limit) break;
    }
    return {
      notes, search_mode: "full-text", title_search_only: false, body_read: true,
      ...(truncated ? { index_truncated: true } : {}),
      ...(truncatedBodies ? { indexed_bodies_truncated: true } : {})
    };
  } finally { db.close(); }
}
