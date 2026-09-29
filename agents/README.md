# Agent Model

Persistent agents are limited to managers. Workers should be ephemeral.

## Managers
1. Chief of Staff — OpenClaw orchestration and routing.
2. Opportunity Manager — business signals, validation and monetization.
3. Career Manager — jobs/freelance research and application preparation.
4. Finance Manager — ETF/DCA, crypto, macro and risk intelligence.
5. Knowledge Manager — Anakalypto research, fact-checking and pedagogy.
6. Engineering Manager — Claude Code/Codex/software delivery.
7. System Manager — memory, skills, evals, configuration and health.

## Worker contract
Every worker receives one objective, bounded context, allowed tools, applicable policies, output schema and stop condition.

Workers do not retain durable hidden state. Useful outputs are promoted to memory after validation.

## Return contract (verified on Telegram, 2026-09-29)
A manager that delegates owes its parent a final, non-empty report: result, checks performed and
limits. On OpenClaw, wait with `sessions_yield({ message: … })` carrying that obligation, never
with `acknowledgment` alone: two pilots answered `NO_REPLY` until the obligation moved to
`message` (see `docs/ACTIVATION-2026-09-29.md`, `MANAGER_COMPLETION_GUIDANCE`). Proposed tests are
reported as proposed, never as executed. One worker per objective; no follow-up loops.

Only the Chief of Staff delivers to Ivan: after the manager's report, it sends the result with the
`message` tool on the originating Telegram route and checks the receipt (`delivered:false` or
`delivery_queued` is not a delivery; never resend a queued message). A final answer inside the
private resume turn does not reach Telegram (Codex PR #21, verified 2026-09-29).

## Definitions (v1 draft, 2026-09-29)

`agents/managers/<name>.md` defines each manager: `route` (Jev routing label, or `orchestrator`
for the Chief of Staff), allowed `skills`, `runtimes`, mission, flow, approval boundary and stop
condition. The Opportunity Manager above is the `business` route.

```bash
node agents/tools/managers.mjs          # every skill owned by its manager; OpenClaw data rule
node --test 'agents/test/*.test.mjs'
node skills/tools/package.mjs --openclaw --manager career --out <dir>   # one manager's skills
```

Finance runs on OpenClaw for public research only; `veille-investissements` and the investment
frame stay on Claude. Clients and personal finances never reach OpenClaw (Ivan, 2026-09-29).
