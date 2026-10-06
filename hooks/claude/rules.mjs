// Level-0 rules for agent tool calls (roadmap: code before Jev, Jev before the LLM). Runtime-
// neutral: Claude Code uses it in pre-tool-use.mjs; Codex can import it for its own hook.
//   never     → refuse, with the reason, without any network call (constitution, secrets, shared repo)
//   autonome  → reversible or read-only work Ivan already delegated: no question, no gateway call
//   evaluer   → the gateway (kernel + Jev) gives an opinion; only a negative one asks Ivan
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

// Escaped \` and \$ inside double quotes are literal text, never a substitution.
const writes = segment => /(?:^|[^>2&])>{1,2}\s*(?!\/dev\/null|&)\S/.test(segment.replace(/'[^']*'|"[^"]*"/g, "''")) || /\$\(|`/.test(segment.replace(/'[^']*'/g, "''").replace(/\\[`$]/g, ""));

// Quoted prose and heredoc bodies are data (commit messages, issue bodies, notes) unless a shell
// or language interpreter would execute them; then the whole text is scanned.
const INTERPRETER = /(?:^|[\s;&|(])(?:(?:ba|z|da|k)?sh|eval|xargs|ssh|source|exec|(?:python3?|node|perl|ruby)\s+-[ce])\b/;
// Quoted text is data, except what the shell executes inside double quotes: $(...) and `...`.
// The interpreter test runs on this stripped form (executed position only): "bash" inside a PR
// body or a commit message no longer counts, while `bash -c '…'`, `node -e "…"`, `eval`, a heredoc
// fed to a shell or a substitution keep the whole text scanned (Codex review f4aba0b).
function stripData(command) {
  return command.replace(/<<-?\s*'?(\w+)'?[\s\S]*?\n\1\b/g, "<<HEREDOC")
    .replace(/'[^']*'|"((?:\\.|[^"\\])*)"/g, (whole, dq) => {
      if (dq === undefined) return "''";
      const executed = dq.replace(/\\./g, "").match(/\$\([^)]*\)|`[^`]*`/g);
      return executed ? `'' ${executed.join(" ")}` : "''";
    });
}
// git global options placed before the subcommand must not hide it from the rules below
// (found live on 2026-10-06; completed after Codex review REVIEW-CODEX-PR65). Closed list of
// Git 2.42 global options: flags without value, options taking a value (separate or "="),
// and "=value only" options. An option outside this list is not understood: the command is
// left as is and ends up evaluer (never a silent pass).
const GIT_FLAGS = new Set(["-p", "-P", "--paginate", "--no-pager", "--bare", "--no-replace-objects", "--no-lazy-fetch",
  "--no-optional-locks", "--literal-pathspecs", "--glob-pathspecs", "--noglob-pathspecs", "--icase-pathspecs", "--exec-path"]);
const GIT_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--super-prefix", "--config-env", "--attr-source"]);
const GIT_EQUALS_ONLY = new Set(["--exec-path", "--list-cmds"]);
function skipGitOptions(tokens) {
  let i = 0;
  while (i < tokens.length && tokens[i].startsWith("-")) {
    const t = tokens[i], name = t.split("=")[0];
    if (t.includes("=") && (GIT_WITH_VALUE.has(name) || GIT_EQUALS_ONLY.has(name))) { i += 1; continue; }
    if (GIT_WITH_VALUE.has(t)) { i += 2; continue; }
    if (GIT_FLAGS.has(t)) { i += 1; continue; }
    return null; // unknown option: do not guess
  }
  return i;
}
export function normalizeGit(text) {
  return text.replace(/\bgit((?:\s+-\S+(?:\s+(?!-)\S+)?)+)(?=\s)/g, (whole, opts) => {
    const tokens = opts.trim().split(/\s+/);
    // Re-scan token by token: a value token following -C/-c must not be read as the subcommand.
    const n = skipGitOptions(tokens);
    if (n === null) return whole;
    return ["git", ...tokens.slice(n)].join(" ");
  });
}
export function commandWords(command) {
  const stripped = normalizeGit(stripData(command));
  if (INTERPRETER.test(stripped)) return normalizeGit(command);
  return stripped;
}

export function classifyCommand(command) {
  if (typeof command !== "string" || !command.trim()) return { verdict: "evaluer", raison: "commande vide" };
  const words = commandWords(command);
  for (const [pattern, raison, options] of NEVER) if (pattern.test(options?.texteComplet ? command : words)) return { verdict: "never", raison };
  const { parts, ops } = segments(command);
  let level = "read_only";
  for (let i = 0; i < parts.length; i++) {
    const p = normalizeGit(parts[i]).replace(/^cd\s+\S+$/, "pwd");
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
