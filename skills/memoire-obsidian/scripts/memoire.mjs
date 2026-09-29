// Agent memory in Ivan's Obsidian vault. Agents write only under "<vault>/Ivan AI OS/"; Ivan's
// own notes are never modified. Every note carries provenance and a sensitivity level.
// Usage: node memoire.mjs init | ajouter [options] < body.md | verifier | lister [--max interne]
//   ajouter --type connaissance|decision|journal --titre T --source S [--source S2]
//           --sensibilite public|interne|confidentiel --agent A [--confiance 0-1]
// Vault: $IVAN_OBSIDIAN_VAULT, else "obsidian_vault" in ~/.ivan-ai-os/config.json.
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const AGENT_ROOT = "Ivan AI OS";
export const FOLDERS = { connaissance: "connaissances", decision: "decisions", journal: "journal", inbox: "inbox" };
export const SENSITIVITY = ["public", "interne", "confidentiel"];
const REQUIRED = ["type", "titre", "sources", "sensibilite", "agent", "cree", "statut"];
const CREDENTIALS = [/\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}/, /\bgh[pousr]_[A-Za-z0-9]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];

export class MemoryError extends Error {}

export function resolveVault(env = process.env, configPath = path.join(homedir(), ".ivan-ai-os", "config.json")) {
  let vault = env.IVAN_OBSIDIAN_VAULT;
  if (!vault && existsSync(configPath)) {
    try { vault = JSON.parse(readFileSync(configPath, "utf8")).obsidian_vault; } catch { throw new MemoryError("CONFIG_INVALID"); }
  }
  if (typeof vault !== "string" || !path.isAbsolute(vault)) throw new MemoryError("VAULT_NOT_CONFIGURED");
  let stat;
  try { stat = lstatSync(vault); } catch (error) { throw new MemoryError(error.code === "EPERM" ? "VAULT_ACCESS_DENIED_BY_MACOS" : "VAULT_NOT_FOUND"); }
  if (!stat.isDirectory()) throw new MemoryError("NOT_AN_OBSIDIAN_VAULT");
  // macOS privacy protection (Documents, Desktop…) shows the folder but denies its contents.
  try { readdirSync(vault); } catch (error) { throw new MemoryError(["EPERM", "EACCES"].includes(error.code) ? "VAULT_ACCESS_DENIED_BY_MACOS" : "VAULT_NOT_FOUND"); }
  if (!existsSync(path.join(vault, ".obsidian"))) throw new MemoryError("NOT_AN_OBSIDIAN_VAULT");
  return realpathSync(vault);
}

// The agent area must be a real directory inside the vault, never reached through a link.
function agentDir(vault, ...parts) {
  let current = vault;
  for (const part of [AGENT_ROOT, ...parts]) {
    current = path.join(current, part);
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) throw new MemoryError("AGENT_AREA_LINK_REFUSED");
  }
  return current;
}

export function init(vault) {
  const created = [];
  for (const folder of Object.values(FOLDERS)) {
    const dir = agentDir(vault, folder);
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); created.push(path.relative(vault, dir)); }
  }
  const readme = path.join(agentDir(vault), "LISEZ-MOI.md");
  if (!existsSync(readme)) {
    writeFileSync(readme, `# Mémoire des agents Ivan AI OS

Seul dossier du coffre où les agents écrivent. Tes autres notes ne sont jamais modifiées.

- \`inbox/\` : propositions des agents, à valider (statut \`propose\`).
- \`connaissances/\` : faits validés, chacun avec ses sources.
- \`decisions/\` : décisions et leur justification.
- \`journal/\` : comptes rendus datés des agents.

Sensibilité : \`public\`, \`interne\`, \`confidentiel\`. Les notes confidentielles ne sont jamais lues par
OpenClaw ni envoyées à Jev ; seul Claude y accède.
Pour valider une proposition : passe \`statut: propose\` à \`statut: valide\` et déplace-la.
`, { flag: "wx" });
    created.push(path.relative(vault, readme));
  }
  return created;
}

export function slugify(title) {
  const slug = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  if (!slug) throw new MemoryError("TITLE_INVALID");
  return slug;
}

export function parseNote(text) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text.replace(/\r\n/g, "\n"));
  if (!match) return null;
  const data = {};
  let list = null;
  for (const line of match[1].split("\n")) {
    const item = /^ {2}- (.*)$/.exec(line);
    if (item && list) { data[list].push(item[1].trim()); continue; }
    const kv = /^([a-z_]+):(?: (.*))?$/.exec(line);
    if (!kv) return null;
    list = kv[2] === undefined || kv[2] === "" ? kv[1] : null;
    data[kv[1]] = list ? [] : kv[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return { data, body: match[2] };
}

function notesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? notesUnder(full) : entry.name.endsWith(".md") && entry.name !== "LISEZ-MOI.md" ? [full] : [];
  });
}

export function add(vault, { type, titre, sources = [], sensibilite, agent, confiance, body = "", now = new Date() }) {
  if (!["connaissance", "decision", "journal"].includes(type)) throw new MemoryError("TYPE_INVALID");
  if (!SENSITIVITY.includes(sensibilite)) throw new MemoryError("SENSITIVITY_REQUIRED");
  if (!sources.length || sources.some(s => typeof s !== "string" || !s.trim() || /[\n\r]/.test(s))) throw new MemoryError("SOURCE_REQUIRED");
  if (typeof agent !== "string" || !/^[a-z0-9][a-z0-9 _-]{0,40}$/i.test(agent)) throw new MemoryError("AGENT_REQUIRED");
  if (typeof titre !== "string" || /[\n\r]/.test(titre) || titre.length > 200) throw new MemoryError("TITLE_INVALID");
  if (confiance !== undefined && !(Number(confiance) >= 0 && Number(confiance) <= 1)) throw new MemoryError("CONFIDENCE_INVALID");
  if (CREDENTIALS.some(p => p.test(`${titre}\n${sources.join("\n")}\n${body}`))) throw new MemoryError("CREDENTIAL_REFUSED");
  const slug = slugify(titre);
  const date = now.toISOString().slice(0, 10);
  const name = type === "journal" ? `${date}-${slug}.md` : `${slug}.md`;
  // Deduplicate on the agent area: an existing note is updated by a human or a merge, not duplicated.
  const existing = notesUnder(agentDir(vault)).find(file => path.basename(file) === name);
  if (existing) throw Object.assign(new MemoryError("NOTE_EXISTS"), { path: path.relative(vault, existing) });
  // Journals are records; knowledge and decisions start as proposals for Ivan to validate.
  const folder = type === "journal" ? FOLDERS.journal : FOLDERS.inbox;
  const dir = agentDir(vault, folder);
  mkdirSync(dir, { recursive: true });
  const front = [
    "---", `type: ${type}`, `titre: "${titre.replace(/"/g, "'")}"`, "sources:", ...sources.map(s => `  - ${s.trim()}`),
    `sensibilite: ${sensibilite}`, `agent: ${agent}`, `cree: ${date}`,
    ...(confiance !== undefined ? [`confiance: ${Number(confiance)}`] : []),
    `statut: ${type === "journal" ? "journal" : "propose"}`, "---", ""
  ].join("\n");
  const file = path.join(dir, name);
  writeFileSync(file, `${front}# ${titre}\n\n${body.trim()}\n`, { flag: "wx" });
  return path.relative(vault, file);
}

export function verify(vault) {
  const problems = [];
  for (const file of notesUnder(agentDir(vault))) {
    const rel = path.relative(vault, file);
    const note = parseNote(readFileSync(file, "utf8"));
    if (!note) { problems.push(`${rel}: frontmatter absent ou invalide`); continue; }
    for (const key of REQUIRED) if (!note.data[key] || (Array.isArray(note.data[key]) && !note.data[key].length)) problems.push(`${rel}: ${key} manquant`);
    if (note.data.sensibilite && !SENSITIVITY.includes(note.data.sensibilite)) problems.push(`${rel}: sensibilite invalide`);
    if (CREDENTIALS.some(p => p.test(readFileSync(file, "utf8")))) problems.push(`${rel}: identifiant ou clé détecté`);
  }
  return problems;
}

// Notes a runtime may read: OpenClaw and Jev never receive confidential notes.
export function list(vault, max = "interne") {
  const limit = SENSITIVITY.indexOf(max);
  if (limit < 0) throw new MemoryError("SENSITIVITY_INVALID");
  return notesUnder(agentDir(vault)).flatMap(file => {
    const note = parseNote(readFileSync(file, "utf8"));
    const level = SENSITIVITY.indexOf(note?.data.sensibilite);
    return level >= 0 && level <= limit ? [{ path: path.relative(vault, file), titre: note.data.titre, statut: note.data.statut, sensibilite: note.data.sensibilite }] : [];
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const [command, ...args] = process.argv.slice(2);
  const values = flag => args.flatMap((a, i) => a === flag ? [args[i + 1]] : []);
  const one = flag => values(flag)[0];
  try {
    const vault = resolveVault();
    if (command === "init") console.log(JSON.stringify({ created: init(vault) }));
    else if (command === "ajouter") {
      let body = "";
      if (!process.stdin.isTTY) for await (const chunk of process.stdin) body += chunk;
      console.log(JSON.stringify({ note: add(vault, { type: one("--type"), titre: one("--titre"), sources: values("--source"), sensibilite: one("--sensibilite"), agent: one("--agent"), confiance: one("--confiance"), body }) }));
    } else if (command === "verifier") {
      const problems = verify(vault);
      console.log(problems.length ? problems.join("\n") : "OK");
      process.exitCode = problems.length ? 1 : 0;
    } else if (command === "lister") console.log(JSON.stringify(list(vault, one("--max") ?? "interne"), null, 2));
    else throw new MemoryError("USAGE: init | ajouter | verifier | lister");
  } catch (error) {
    console.error(error instanceof MemoryError ? `${error.message}${error.path ? ` (${error.path})` : ""}` : "MEMORY_ERROR");
    process.exitCode = 1;
  }
}
