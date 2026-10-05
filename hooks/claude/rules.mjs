// Level-0 rules for agent tool calls (roadmap: code before Jev, Jev before the LLM). Runtime-
// neutral: Claude Code uses it in pre-tool-use.mjs; Codex can import it for its own hook.
//   never     → refuse, with the reason, without any network call (constitution, secrets, shared repo)
//   autonome  → reversible or read-only work Ivan already delegated: no question, no gateway call
//   evaluer   → the gateway (kernel + Jev) gives an audited opinion; in gate mode it never asks Ivan
// No rule ever grants permission: the runtime's own permission system stays in charge.

const NEVER = [
  [/\b(?:jev-keychain|mac-jev-keychain)\b|\bsecurity\s+(?:find|dump)-(?:generic|internet)-password\b|\bsecurity\s+dump-keychain\b/, "lecture de la clé TypeSafe ou du Trousseau : interdite aux agents"],
  // Paths may be quoted: this rule always sees the full text.
  [/(?:^|[\s;&|])(?:cat|less|more|head|tail|bat|grep|cp|scp|curl\b.*-d\s*@)\s[^|;&]*(?:\.env(?!\.example)(?:\.[\w-]+)?\b|decision-token|\.ssh\/id_|\.aws\/credentials)/, "lecture ou copie d'un secret", { texteComplet: true }],
  [/\bgit\s+stash\b/, "git stash : la pile est partagée avec le checkout de Codex (committer le travail en cours)"],
  [/\bgit\s+push\b[^;&|]*(?:\s--force(?:-with-lease)?\b|\s-f\b|\s\+\S)/, "push forcé : réécrit l'historique partagé"],
  [/\bgit\s+push\b[^;&|]*\s(?:origin\s+)?(?:HEAD:)?(?:main|master|foundation\/v1)\b/, "push direct sur main ou foundation/v1 : passer par une PR et le GO d'Ivan"],
  [/\bgh\s+pr\s+merge\b/, "fusion de PR : GO d'Ivan requis"],
  [/\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-[a-z]*f/, "commande destructive sur le dépôt de travail"],
  [/\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(?:-\S+\s+)*(?:\/|~\/?|\$HOME\/?|\.\/?|\*)(?:\s|$)/, "suppression récursive d'une racine (/, ~, ., *)"],
  [/\b(?:curl|wget)\b[^|;&]*\|\s*(?:sudo\s+)?(?:ba|z|da)?sh\b/, "exécution d'un script téléchargé"],
  [/\bsudo\b/, "élévation de privilèges"]
];

// Single commands (optionally piped into read-only filters) that read or build locally.
const READ_ONLY = /^(?:git\s+(?:status|diff|log|show|branch|rev-parse|ls-files|ls-remote|fetch|remote\s+-v|worktree\s+list|merge-tree|blame)\b|ls\b|pwd\b|cat\b|head\b|tail\b|wc\b|grep\b|rg\b|find\b(?![^|]*-(?:delete|exec|ok)\b)|which\b|echo\b|date\b|stat\b|file\b|du\b|df\b|diff\b|sed\s+-n\b|node\s+--test\b|npm\s+test\b|npm\s+run\s+(?:test|lint)\b|python3\s+-m\s+(?:pytest|py_compile)\b|gh\s+(?:pr|issue|run)\s+(?:view|list|checks|diff|watch)\b|gh\s+api\s+(?!.*(?:-X|--method)\s*(?:POST|PUT|PATCH|DELETE)))/;
const FILTERS = /^(?:grep|rg|head|tail|wc|sort|uniq|cut|tr|sed\s+-n|jq|column|awk\s+'[^']*'$)\b/;
// Reversible work on the agent's own branches, delegated by Ivan (CLAUDE.md autonomy).
const AUTONOMOUS = /^(?:git\s+(?:add|commit|switch|checkout\s+-b|restore\s+--staged|worktree\s+add|rebase\s+origin\/agent\/)\b|git\s+push\b(?=[^;&|]*\bagent\/)|mkdir\b|touch\b|gh\s+pr\s+(?:create\s+--draft|comment|review\s+--comment|ready|edit)\b|gh\s+issue\s+(?:create|comment)\b|node\s+(?:skills|agents|hooks|scripts)\/)/;

function segments(command) {
  // Split on control operators outside quotes; a heredoc body is data, not commands.
  const body = command.replace(/<<-?\s*'?(\w+)'?[\s\S]*?\n\1\b/g, "<<HEREDOC");
  const parts = [], ops = [];
  let current = "", quote = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) { if (c === quote) quote = null; current += c; continue; }
    if (c === "'" || c === '"') { quote = c; current += c; continue; }
    const two = body.slice(i, i + 2);
    if (["&&", "||"].includes(two)) { parts.push(current); ops.push(two); current = ""; i++; continue; }
    if (c === ";" || c === "\n") { parts.push(current); ops.push(";"); current = ""; continue; }
    if (c === "|") { parts.push(current); ops.push("|"); current = ""; continue; }
    current += c;
  }
  parts.push(current);
  return { parts: parts.map(p => p.trim().replace(/^(?:cd\s+\S+\s*&&\s*)/, "")).filter(Boolean), ops };
}

const writes = segment => /(?:^|[^>2&])>{1,2}\s*(?!\/dev\/null|&)\S/.test(segment.replace(/'[^']*'|"[^"]*"/g, "''")) || /\$\(|`/.test(segment.replace(/'[^']*'/g, "''"));

// Quoted prose and heredoc bodies are data (commit messages, issue bodies, notes) unless a shell
// or language interpreter would execute them; then the whole text is scanned.
const INTERPRETER = /(?:^|[\s;&|(])(?:(?:ba|z|da|k)?sh|eval|xargs|ssh|source|exec|(?:python3?|node|perl|ruby)\s+-[ce])\b/;
export function commandWords(command) {
  if (INTERPRETER.test(command)) return command;
  return command.replace(/<<-?\s*'?(\w+)'?[\s\S]*?\n\1\b/g, "<<HEREDOC").replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, "''");
}

export function classifyCommand(command) {
  if (typeof command !== "string" || !command.trim()) return { verdict: "evaluer", raison: "commande vide" };
  const words = commandWords(command);
  for (const [pattern, raison, options] of NEVER) if (pattern.test(options?.texteComplet ? command : words)) return { verdict: "never", raison };
  const { parts, ops } = segments(command);
  let level = "read_only";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].replace(/^cd\s+\S+$/, "pwd");
    const piped = i > 0 && ops[i - 1] === "|";
    if (writes(p)) return { verdict: "evaluer", raison: "redirection ou sous-commande" };
    if (piped && FILTERS.test(p)) continue;
    if (READ_ONLY.test(p)) continue;
    if (AUTONOMOUS.test(p)) { level = "autonome"; continue; }
    return { verdict: "evaluer", raison: `commande non classée : ${p.split(/\s+/).slice(0, 3).join(" ")}` };
  }
  return { verdict: "autonome", raison: level === "read_only" ? "lecture seule" : "travail réversible sur branche d'agent" };
}

// Files whose change would weaken the agents' own guardrails.
const GUARDRAIL_FILES = /(?:^|\/)(?:\.claude\/settings(?:\.local)?\.json$|\.codex\/config\.toml$|hooks\/claude\/(?:rules|pre-tool-use)\.mjs$|constitution\/|policies\/kernel\/|AGENTS\.md$)/;
export function classifyPath(file) {
  if (typeof file !== "string") return { verdict: "evaluer", raison: "chemin absent" };
  if (/(?:^|\/)\.env(?:\.[\w-]+)?$/.test(file) && !/\.env\.example$/.test(file)) return { verdict: "never", raison: "écriture d'un fichier de secrets" };
  if (GUARDRAIL_FILES.test(file)) return { verdict: "evaluer", raison: "garde-fou des agents : avis requis" };
  return { verdict: "evaluer", raison: "fichier du projet" };
}
