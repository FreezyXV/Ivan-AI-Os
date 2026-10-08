# Claude Code adapter (PreToolUse → Jev Gateway)

`pre-tool-use.mjs` sends each mutating Claude Code call (Write, Edit, MultiEdit, NotebookEdit,
Bash) to `POST /v1/evaluate-tool` of the local Jev Gateway (contract: `docs/SECURE-GATEWAY.md`).

| Mode (`IVAN_CLAUDE_HOOK_MODE`) | Effect |
|---|---|
| `shadow` (default) | Gateway evaluates and audits; Claude Code is never influenced. |
| `ask` | DENY / REQUIRE_HUMAN / ESCALATE → Claude Code asks Ivan to confirm the call. |
| `gate` | Level-0 rules first (`rules.mjs`): **never** → refused with its reason, no network; **autonome** (read-only, reversible work on agent branches) → no question, no gateway call; the rest → gateway (kernel + Jev), only a negative opinion asks Ivan. |

Never `allow`: the gateway is advisory. Any failure (no token, gateway down, 401/503, timeout,
invalid response) leaves the permission unaffected — this is a pilot, not an enforcement gate.
Latency is not zero: even in `shadow`, a slow gateway can delay a call up to the timeout.
Measure it during the pilot.

Data sent: tool label and file path (canonicalized) or shell command. File contents and edit
strings never leave Claude Code. Reads are not evaluated, to spare the 10 EUR/month Jev budget
(the gateway only consults Jev for ordinary files, never for shell commands or protected paths).

Token: `readDecisionToken()` (same private file as the gateway and OpenClaw plugin); nothing is
stored in settings or Git. Gateway: `IVAN_GATEWAY_URL`, loopback only (default
`http://127.0.0.1:4310`; the coordinated runtime uses `4311`, set in `settings.example.json`). Timeout: `IVAN_CLAUDE_HOOK_TIMEOUT_MS` (default 3000).

Activation (after the coordinated gateway migration, Ivan's GO): merge `settings.example.json` into
this repository's `.claude/settings.json` only. Do not install it globally: the gateway classifies
paths against its single configured workspace, so other repositories would be judged "outside".
Start in `shadow`, compare the gateway audit with actual work for a few days, then consider `ask`.

Tests: `node --test 'hooks/claude/test/*.test.mjs'` — real gateway on an ephemeral port, synthetic
token and workspace, no provider call.

## Level-0 rules (`rules.mjs`, runtime-neutral)

Why: in the shadow pilot (issue #19) every Bash call came back REQUIRE_HUMAN, so `ask` would have
prompted Ivan on `git status`. `gate` decides the obvious cases in code and keeps Jev for the rest.

- **never**: keychain/TypeSafe key, printing secrets, `git stash` (shared with Codex's checkout),
  force push, push to `main`/`foundation/v1`, `gh pr merge`, `reset --hard`/`clean -f`, `rm -rf` of
  a root, `curl | sh`, `sudo`. The agent receives the reason, so it does not retry.
- **autonome**: read-only commands (piped into read-only filters allowed), tests, and reversible
  work Ivan delegated (add/commit/switch on agent branches, push to `agent/*`, draft PR, comments).
- **evaluer**: everything else, including redirections and command substitution.
- Writes: `.env*` never; agents' guardrails (`.claude/settings*`, hook files, constitution, kernel
  policies, `AGENTS.md`) always go to the gateway for an opinion.

Codex: `classifyCommand` / `classifyPath` have no Claude-specific dependency. A Codex hook can
import `hooks/claude/rules.mjs` and map its tool calls to the same verdicts, so both agents obey
one rule set. Its hook contract and wiring stay in Codex's perimeter.

Activation of `gate` (Ivan's GO): set `IVAN_CLAUDE_HOOK_MODE=gate` in `.claude/settings.local.json`
and refresh the pinned snapshot (`~/.ivan-ai-os/claude-hook/<commit>`) from the merged commit.
