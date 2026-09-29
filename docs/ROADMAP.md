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
- [x] Shadow evaluator loads global kernel policies from the repository and rejects caller policy lists; catalog revision recorded
- [x] Optional authenticated `/v1/evaluate-tool` prototype: conservative classification, bounded redacted audit and keyed action correlation; 43 local tests pass on the follow-up review branch (see `docs/TRUSTED-EVALUATION.md`)
- [x] Activate private authenticated Mac runtime on 4311 with the metadata contract and estimated 10 EUR/month budget, on Ivan's GO (see docs/ACTIVATION-2026-09-29.md)
- [ ] Activate trusted native call capture; observer pilot remains separate
- [x] Source on the secure-gateway branch authenticates decision endpoints, rejects routing prose and shares a durable estimated 10 EUR/month Jev budget; 54 tests and isolated native verification pass (see `docs/SECURE-GATEWAY.md`)
- [ ] Calibration on labeled requests and permission scenarios

## Phase 2 — Agent integration
- [x] After merged PRs #6/#7/#8, prepare a private native-valid configuration preserving the Secretary workspace and a pinned runtime snapshot; no activation (see docs/COORDINATED-ACTIVATION.md)
- [x] Source-only OpenClaw 2026.9.5 advisory routing tool with mocked tests
- [x] Interactive local Jev smoke mode to keep the Gateway available for OpenClaw integration testing
- [x] Install the linked plugin on Ivan's Mac and inspect runtime registration (`Status: loaded`, `Tools: ivan_route`)
- [x] Direct OpenClaw Gateway `tools.invoke` reached the linked plugin and returned a live Jev engineering route (`provider: jev`); the CLI required `--timeout 45000`
- [x] Actual Telegram DM calls `ivan_route` and returns live `provider: jev`; verified 2026-09-28 at 19:26 UTC with explicit dynamic-tool discovery (see `docs/TELEGRAM-VERIFICATION.md`)
- [ ] Reassess the official TypeSafe decision plugin once a compatible OpenClaw release and package are available (host 2026.9.6+)
- [x] Inactive native observer captures original/completion parameters and detects rewrites; verified against the installed 2026.9.5 hook runner in isolation (see `hooks/openclaw/ivan-observer/README.md`)
- [ ] Scoped live observer pilot after private secret provisioning and credential replacement
- [ ] Native OpenClaw `before_tool_call` policy gate, based on trusted tool metadata
- [ ] Claude Code and Codex adapters verified against their current runtime hook contracts
- [ ] Human approvals bound to exact proposed actions

- [x] Claude source registry: 16 skills and 7 manager definitions, packaging corrections reviewed at fa9c9e0, 13/13 tests
- [x] Install nine reviewed career/knowledge/system skills for Telegram with reduced private profiles, outside Git
- [x] Configure all seven roles and verify Telegram → Jev → Engineering → isolated worker → manager report → Telegram; test code proposed, not executed (2026-09-29)
- [ ] Measure useful workflows for the five other managers and the source-code builder/reviewer bridge
- [x] Prepare seven private manager workspaces, including public Finance without a profile; native OpenClaw configuration validates in isolation
- [x] Review Claude Code shadow adapter against a real isolated gateway, six tests; source merged, Claude notified for project-only shadow activation against 4311

## Phase 3 — Memory
- [x] Locate chosen vault `~/Ivan AI OS Brain/Obsidian/Ivan AI Os Notes`; scoped Claude helper merged in #8
- [ ] Verify vault sync permissions; bounded OpenClaw read tool is active, Claude memory skill adaptation remains separate
- [x] Activate bounded read-only memory plugin for System/Knowledge: 10 tests, real native RPC and Telegram/System retrieval with provenance; report delivered after explicit receipt (see docs/MEMORY-PILOT-2026-09-29.md)
- [x] Retrieve one validated Markdown note with title/date/provenance through Telegram and System
- [ ] Correct chief delivery after private completion; safe ingestion, writes and conflicting-memory workflow remain open
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
