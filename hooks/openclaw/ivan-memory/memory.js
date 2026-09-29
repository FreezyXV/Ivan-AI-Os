import { constants, openSync, closeSync, readSync, fstatSync, lstatSync, realpathSync, opendirSync } from "node:fs";
import path from "node:path";

// Search order: validated knowledge first, proposals last. Journals are never "valide",
// so scanning them would only consume the file budget without ever returning a note.
const SEARCH_FOLDERS = ["connaissances", "decisions", "inbox"];
const ID = /^(inbox|connaissances|decisions|journal)\/[a-z0-9][a-z0-9-]{0,100}\.md$/;
const MAX_BYTES = 65536, MAX_HEADER = 8192, MAX_FILES = 200, MAX_BODY = 4000;
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
function note(vaultPath, id, withBody) {
  const root = rootFor(vaultPath), file = fileFor(root, id);
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = fstatSync(fd);
    if (!before.isFile() || before.nlink !== 1 || before.size > MAX_BYTES) fail("MEMORY_NOTE_UNAVAILABLE");
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
      const buffer = Buffer.alloc(before.size - n); let offset = 0;
      while (offset < buffer.length) { const got = readSync(fd, buffer, offset, buffer.length - offset, n + offset); if (!got) break; offset += got; }
      if (offset !== buffer.length) fail("MEMORY_NOTE_CHANGED");
      const text = buffer.toString("utf8");
      if (credentials.test(text)) fail("MEMORY_NOTE_UNAVAILABLE");
      body = { text: text.slice(0, MAX_BODY), truncated: text.length > MAX_BODY };
    }
    const after = fstatSync(fd), current = lstatSync(fileFor(root, id));
    if (before.ino !== current.ino || before.dev !== current.dev || before.size !== after.size || before.mtimeMs !== after.mtimeMs) fail("MEMORY_NOTE_CHANGED");
    return { id, ...metadata, ...(body ?? {}), content_is_untrusted_data: true };
  } finally { closeSync(fd); }
}
export function readNote(vaultPath, id) { return note(vaultPath, id, true); }
export function searchNotes(vaultPath, query, limit = 3) {
  if (typeof query !== "string" || !query.trim() || query.length > 80 || /[\x00-\x1f]/.test(query) || credentials.test(query) || !Number.isInteger(limit) || limit < 1 || limit > 3) fail("MEMORY_QUERY_INVALID");
  const root = rootFor(vaultPath), ids = []; let scanned = 0, truncated = false;
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
  const words = normalize(query.trim()).split(/\s+/), hits = [];
  // Keep folder priority; sort only within a folder for stable results.
  for (const id of ids.sort((a, b) => SEARCH_FOLDERS.indexOf(a.split("/")[0]) - SEARCH_FOLDERS.indexOf(b.split("/")[0]) || (a < b ? -1 : a > b ? 1 : 0))) {
    try {
      const entry = note(vaultPath, id, false), title = normalize(entry.title);
      if (words.every(word => title.includes(word))) hits.push(entry);
    } catch (error) {
      if (!(error instanceof MemoryReadError) || !["MEMORY_NOTE_UNAVAILABLE", "MEMORY_LINK_REFUSED", "MEMORY_NOTE_CHANGED"].includes(error.message)) throw error;
    }
    if (hits.length === limit) break;
  }
  return { notes: hits, title_search_only: true, body_read: false, ...(truncated ? { index_truncated: true } : {}) };
}
