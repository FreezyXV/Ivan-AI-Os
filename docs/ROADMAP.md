# Implementation Roadmap

## Phase 0 — Foundation
- [x] Private repository, constitution, schemas and policy catalog skeleton
- [x] Jev Gateway skeleton and Docker control-plane skeleton
- [ ] VPS provisioned; runtime secrets configured

## Phase 1 — Decision plane
- [x] Correct TypeSafe System One request/response adapter for Choice
- [x] Batched Choice/Noul/Score request router for the six domains
- [x] Conservative mock mode, low-confidence review, malformed-response tests
- [x] TypeSafe API access confirmed by Ivan; no key stored in this repository
- [x] Live Jev route smoke from Ivan's Mac with a hidden, ephemeral API key (HTTP 200, engineering ROUTED); persistent runtime remains pending
- [ ] Trusted policy selection from the repository, not from caller-supplied lists
- [ ] Server authentication, deterministic classification from concrete tool calls, redacted audit events
- [ ] Calibration on labeled requests and permission scenarios

## Phase 2 — Agent integration
- [x] Source-only OpenClaw 2026.9.5 advisory routing tool with mocked tests
- [x] Interactive local Jev smoke mode to keep the Gateway available for OpenClaw integration testing
- [x] Install the linked plugin on Ivan's Mac and inspect runtime registration (`Status: loaded`, `Tools: ivan_route`)
- [x] Direct OpenClaw Gateway `tools.invoke` reached the linked plugin and returned a live Jev engineering route (`provider: jev`); the CLI required `--timeout 45000`
- [ ] Confirm an actual Telegram message calls `ivan_route` and returns a live `provider: jev` result
- [ ] Reassess the official TypeSafe decision plugin once a compatible OpenClaw release and package are available (host 2026.9.6+)
- [ ] Native OpenClaw `before_tool_call` policy gate, based on trusted tool metadata
- [ ] Claude Code and Codex adapters verified against their current runtime hook contracts
- [ ] Human approvals bound to exact proposed actions

## Phase 3 — Memory
- [ ] Map `Obsidian Notes` vault path and sync permissions
- [ ] Markdown ingestion, retrieval and provenance
- [ ] Embeddings + pgvector only after basic retrieval needs are measured
- [ ] Controlled Dream consolidation

## Phase 4 — Business Engine
Signals → dedupe → evidence → validation → Cash/Venture recommendations → Telegram.

## Phase 5 — Career Engine
Offers → matching → tailored materials → human approval before outreach/application.

## Phase 6 — Finance Engine
ETF/DCA + crypto + macro + portfolio drift; propose only, never trade.

## Phase 7 — Engineering Factory
Task decomposition → Claude/Codex builder-reviewer → tests → branch/PR.

## Phase 8 — Anakalypto
Topic → sources → claims → fact-check → pedagogy → visuals → interactive content → QA.

## Phase 9 — System Steward
Prompt bloat, skills, policy conflicts, token telemetry and controlled resets.

## Phase 10 — ROI scheduler
Measure outcomes and allocate compute to useful workflows.
