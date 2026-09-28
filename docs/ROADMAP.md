# Implementation Roadmap

## Phase 0 — Foundation
- [x] Private repository, constitution, schemas and policy catalog skeleton
- [x] Jev Gateway skeleton and Docker control-plane skeleton
- [ ] VPS provisioned; runtime secrets configured

## Phase 1 — Decision plane
- [x] Correct TypeSafe System One request/response adapter for Choice
- [x] Conservative mock mode, low-confidence review, malformed-response tests
- [ ] Confirm TypeSafe API access and test with a runtime secret
- [ ] Trusted policy selection from the repository, not from caller-supplied lists
- [ ] Server authentication, deterministic classification from concrete tool calls, redacted audit events
- [ ] Calibrated Score/Noul questions on labeled scenarios (no generic "ranking" endpoint)
- [ ] Evaluation suite for the intended allow/review/deny boundaries

## Phase 2 — Agent guards
- [ ] Claude Code tool adapter verified against its current hook contract
- [ ] Codex adapter verified against its current runtime capabilities
- [ ] OpenClaw execution gate and end-to-end tests
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
