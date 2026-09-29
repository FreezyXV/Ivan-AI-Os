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

## Definitions (v1 draft, 2026-09-29)

`agents/managers/<name>.md` defines each manager: `route` (Jev routing label, or `orchestrator`
for the Chief of Staff), allowed `skills`, `runtimes`, mission, flow, approval boundary and stop
condition. The Opportunity Manager above is the `business` route.

```bash
node agents/tools/managers.mjs          # every skill owned by its manager; OpenClaw data rule
node --test 'agents/test/*.test.mjs'
node skills/tools/package.mjs --openclaw --manager career --out <dir>   # one manager's skills
```

Finance runs on claude.ai only: clients and personal finances never reach OpenClaw (Ivan, 2026-09-29).
