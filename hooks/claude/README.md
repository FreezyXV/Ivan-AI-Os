# Claude Code adapter (PreToolUse → Jev Gateway)

`pre-tool-use.mjs` sends each mutating Claude Code call (Write, Edit, MultiEdit, NotebookEdit,
Bash) to `POST /v1/evaluate-tool` of the local Jev Gateway (contract: `docs/SECURE-GATEWAY.md`).

| Mode (`IVAN_CLAUDE_HOOK_MODE`) | Effect |
|---|---|
| `shadow` (default) | Gateway evaluates and audits; Claude Code is never influenced. |
| `ask` | DENY / REQUIRE_HUMAN / ESCALATE → Claude Code asks Ivan to confirm the call. |

Never `allow`: the gateway is advisory. Any failure (no token, gateway down, 401/503, timeout,
invalid response) leaves Claude Code unaffected — this is a pilot, not an enforcement gate.

Data sent: tool label and file path (canonicalized) or shell command. File contents and edit
strings never leave Claude Code. Reads are not evaluated, to spare the 10 EUR/month Jev budget
(the gateway only consults Jev for ordinary files, never for shell commands or protected paths).

Token: `readDecisionToken()` (same private file as the gateway and OpenClaw plugin); nothing is
stored in settings or Git. Gateway: `IVAN_GATEWAY_URL`, loopback only, default
`http://127.0.0.1:4310`. Timeout: `IVAN_CLAUDE_HOOK_TIMEOUT_MS` (default 3000).

Activation (after the coordinated gateway migration, Ivan's GO): merge `settings.example.json` into
`.claude/settings.json` (project) or `~/.claude/settings.json` (all projects), start in `shadow`,
compare gateway audit with actual work for a few days, then consider `ask`.

Tests: `node --test 'hooks/claude/test/*.test.mjs'` — real gateway on an ephemeral port, synthetic
token and workspace, no provider call.
