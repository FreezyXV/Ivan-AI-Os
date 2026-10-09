# Implementation Roadmap

## Phase 0 — Foundation
- [x] Private repository, constitution, schemas and policy catalog skeleton
- [x] Jev Gateway skeleton and Docker control-plane skeleton
- [ ] VPS provisioned; deferred by Ivan on 2026-10-08 for the first months of a local Mac pilot. Reassess only after measured need for 24/7 operation and a separately approved purchase.
- [x] Prepare a Linux systemd Jev gateway candidate with private credentials, persistent budget and authenticated startup probe; local mock integration tested, VPS not provisioned

## Phase 1 — Decision plane
- [x] Correct TypeSafe System One request/response adapter for Choice
- [x] Batched Choice/Noul/Score request router for the six domains
- [x] Conservative mock mode, low-confidence review, malformed-response tests
- [x] TypeSafe API access confirmed by Ivan; no key stored in this repository
- [x] Live Jev route smoke from Ivan's Mac with a hidden, ephemeral API key (HTTP 200, engineering ROUTED); persistent runtime remains pending
- [x] Shadow evaluator loads global kernel policies from the repository and rejects caller policy lists; catalog revision recorded
- [x] Optional authenticated `/v1/evaluate-tool` prototype: conservative classification, bounded redacted audit and keyed action correlation; 43 local tests pass on the follow-up review branch (see `docs/TRUSTED-EVALUATION.md`)
- [x] Activate private authenticated Mac runtime on 4311 with the metadata contract and estimated 10 EUR/month budget, on Ivan's GO (see docs/ACTIVATION-2026-09-29.md)
- [x] Activate authenticated `/v1/classify` with ten registered questions and the shared Jev budget; real Noul and Choice replies verified on public inputs (see docs/CLASSIFY-GATEWAY.md)
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
- [x] Activate manager-scoped, read-only prepared Business and Finance briefs; native RPC verifies both managers and denies main (PR #36)
- [x] Adapt and activate Business/Finance public briefs and System/Knowledge memory skills against their native tools; explicit missing capabilities fail instead of silently omitting selected skills (PR #47, 14 tests and four native loaded-skill checks)
- [x] Recover from temporary Keychain unavailability in the same Mac runner, with bounded private status and cancellable retry; live pinned cutover and restart preserve credentials/budget (PR #46, 9 tests)
- [x] Replace the slow internal gateway restart in future config rollouts with a bounded launchd restart, health check and automatic config rollback (PR #36)
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
- [x] Controlled consolidation, first step: read-only memory gardener (duplicates, possible contradictions, stale proposals) proposing, never rewriting (#27)
- [ ] Jev `memoire.contradiction` gate and scheduled garden (Codex runtime)

## Phase 4 — Business Engine
Signals → dedupe → evidence → validation → Cash/Venture recommendations → Telegram.
- [x] Signals ledger, recurrence by distinct sources, evidence-first /30 scoring, Cash/Venture, first real cycle (#23)
- [ ] Jev `signal.pertinent` / `preuve.suffisante` gates and weekly schedule (needs `/v1/classify`)

## Phase 5 — Career Engine
Offers → matching → tailored materials → human approval before outreach/application.

## Phase 6 — Finance Engine
ETF/DCA + crypto + macro + portfolio drift; propose only, never trade.
- [x] Public watch by code (ECB, FRED, Kraken), private snapshots, threshold alerts (#24)
- [x] Private DCA split: 1000 EUR/month by target weights, buy-only rebalancing option (#24, #32)
- [ ] Daily schedule, Jev `alerte.importante`, Telegram brief (Codex runtime)

## Phase 7 — Engineering Factory
Task decomposition → Claude/Codex builder-reviewer → tests → branch/PR.
- [x] Builder/reviewer routing: files' owner → measured success on reviewed PRs → prior → alternation (#29)
- [x] Claude Code hook `gate`: level-0 rules, Jev for ambiguous calls, active in this project (#28, #31)
- [ ] Codex hook on the same rules; Jev `tache.categorie` / `constat.severite`

## Phase 8 — Anakalypto
Topic → sources → claims → fact-check → pedagogy → visuals → interactive content → QA.
- [x] Coded evidence rules and visual router (#25); v2 short visual cards, 19 domains, reconstruction series (#26)
- [x] Topic discovery by code: Wikimedia trends + seven science feeds, deals dropped (#33)
- [x] First reconstruction card drafted end-to-end; publication blocked until Jev answers (by design)
- [x] Mandatory Jev gates live (`sujet.captivant`, `sujet.domaine`, `publication.prete`) and first glass card validated without publication
- [ ] Bind Anakalypto publication receipts to the gateway audit before any automatic publication

## Phase 9 — System Steward
Prompt bloat, skills, policy conflicts, token telemetry and controlled resets.
- [x] Skills/config auditor (description cost, duplicates, bloat) and evals for every active skill (#27)
- [ ] Token telemetry per workflow and controlled resets

## Phase 10 — ROI scheduler
Measure outcomes and allocate compute to useful workflows.
