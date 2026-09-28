# Session handoff — 2026-09-28

## Mission
Build Ivan AI OS in private repository `FreezyXV/Ivan-AI-Os`, branch `foundation/v1`. Read `docs/ROADMAP.md`, `docs/USER_ACTIONS.md`, `docs/DECISION-PLANE.md`, and `hooks/openclaw/ivan-route/README.md` first. Continue implementation and verify real behavior with the least necessary changes. Ivan authorized work on his Mac when a local session has access; never presume a cloud session's loopback points to his Mac.

## Working environment and boundaries
- Ivan's Mac runs OpenClaw 2026.9.5 as a LaunchAgent, Gateway on local loopback, Telegram bot `@secretaireivanbot` routed to agent `main`. The `ivan-ai-os-route` plugin is linked from this repo, inspected as loaded, and exposes `ivan_route`.
- The TypeSafe/Jev API key exists on the Mac. `bash scripts/mac-jev-smoke.sh --stay` prompts for it privately and runs Jev Gateway on `http://127.0.0.1:4310` while that terminal remains open. Do not read, copy, display, or commit keys, tokens, cookies, or secret store values.
- Telegram DMs use an allowlist. OpenClaw `tools.deny` contains `exec`; host exec policy is allowlist with approval. The plugin invokes an HTTP service; it does not need to grant shell access to the Telegram agent.
- Obsidian vault is named `Obsidian Notes`; path and permissions are unconfirmed.
- No additional AI subscriptions beyond ChatGPT Plus and Claude Pro. Ivan permits research, source changes, GitHub pushes and Obsidian work; purchases, payments, transactions, external contact and applications require his approval. Never message job prospects.
- A previously shared terminal transcript exposed a Telegram credential and an earlier screenshot showed a Gateway credential. The project docs note future replacement. Never reproduce values in chat or repo.

## Proven as of 2026-09-28
1. Live TypeSafe smoke: HTTP 200, `provider: "jev"`, engineering route for a synthetic Node.js task.
2. `openclaw plugins inspect ivan-ai-os-route --runtime`: plugin loaded with tool `ivan_route`.
3. `openclaw channels status --channel telegram --probe`: Telegram default reported running and connected to `@secretaireivanbot`.
4. Direct OpenClaw Gateway RPC succeeded after using an explicit timeout. The exact Mac command was:
   ```bash
   openclaw gateway call tools.invoke --json --timeout 45000 --params '{"name":"ivan_route","agentId":"main","args":{"text":"Écris un test unitaire pour une fonction Node.js fictive"}}'
   ```
   Result: `ok: true`, `source: "plugin"`, `output.details: {"status":"ROUTED","manager":"engineering","manager_confidence":1,"urgency":0,"needs_details_probability":0.84,"provider":"jev"}`.
5. A preceding RPC without `--timeout` expired after the CLI's 10000 ms default, despite Jev health returning OK. The plugin client was recently changed to allow a 35-second request; the 45-second CLI timeout resolves this direct test.
6. Repo source and tests for Jev Gateway and plugin are in the branch. The latest Mac fast-forward before this handoff pulled commit `7ce24b0` (the handoff commit may be newer).

## Outstanding issue: model-visible tool in Telegram
A screenshot of an earlier OpenClaw conversation showed a Telegram prompt asking the bot to call `ivan_route`, followed by `{"error":"ivan_route unavailable"}`. The direct Gateway RPC success above happened later, so that screenshot is **not** proof of a continuing failure. The direct RPC demonstrates plugin execution, but it does **not** demonstrate that the language model discovers the tool in a live Telegram conversation.

Next, with `mac-jev-smoke.sh --stay` still running, send a fresh DM to `@secretaireivanbot` asking it to call `ivan_route` on the same synthetic request and return raw JSON. Check OpenClaw runtime logs / tool catalog if the assistant reports the tool is unavailable. Confirm actual tool invocation and `provider: "jev"` before checking off Telegram end-to-end integration. Investigate Codex harness dynamic tool discovery or stale session only if reproduction confirms the issue; do not change the tool policy merely to fix an unconfirmed hypothesis. The tool is advisory, not an automatic decision gate or permission system.

## Local-session startup
In the ChatGPT desktop app on Ivan's Mac, choose Codex and attach/select the local folder `~/Ivan-AI-Os` as a local project, keeping the existing checkout instead of creating a detached clone. Open a new chat within that project. If available, use New chat to add the earlier ChatGPT conversation for background, and ask the assistant to read this handoff and the docs named above. First run `pwd`, `uname -s`, `git status --short --branch`, and check whether the Jev Gateway and OpenClaw Gateway are reachable locally. A Linux or cloud shell is not access to Ivan's Mac. Preserve any local uncommitted files (npm install previously dirtied the checkout) and avoid overwriting them.

## Full project vision and product boundaries

Ivan AI OS is Ivan Petrov's private, long-term personal operating system for productive autonomous work, using his Mac and Telegram today and potentially an always-on VPS later. The design is **neurosymbolic**: LLMs perceive, reason and create; TypeSafe/Jev classifies, scores, selects and checks; deterministic code executes; Obsidian stores validated knowledge; Ivan sets strategy and approves consequential actions. The goal is useful outcomes with minimal premium token use, verifiable provenance and a narrow approval boundary. This is the intended architecture, **not** a claim that the later components already run.

Ivan's environment: MacBook Pro 16-inch M1 Pro with 16 GB RAM, iPhone, Cursor/VS Code, OpenClaw, Telegram, GitHub and Obsidian. Current paid AI products are ChatGPT Plus and Claude Pro; assume **no additional recurring AI subscription budget**. A 24/7 VPS around €10–15/month is acceptable *in principle*, with provider, plan, billing and implementation undecided. Local MLX/Ollama is a possible low-cost option subject to quality measurements; do not assume a subscription grants API credits, background execution or suitable commercial terms. Jev API access was confirmed and the live smoke ran, but ongoing usage and cost should be measured.

A six-domain control-plane concept lives in `README.md` and `docs/ARCHITECTURE.md`: OpenClaw as Chief of Staff receives requests, deterministic rules and Jev select a manager, managers delegate bounded jobs to ephemeral workers, tools execute subject to policy, results are checked, and validated evidence is written to memory. The managers are Business/Opportunity, Career, Finance, Knowledge/Anakalypto, Engineering and System. Persistent managers are a target architecture; the current `ivan_route` plugin is **only a model-visible advisory tool**. It does not select the conversation model, automatically route every message, spawn workers, enforce permissions or intercept tool calls. Do not present any target diagram as implemented.

The intended decision cascade is deterministic code → Jev → qualified local model → premium model → Ivan for actions requiring his approval. Context delivery is metadata filtering → targeted retrieval → relevance selection → compact evidence for the worker. Claude Code and Codex are peer builder and independent reviewer, with Jev assessing findings and disagreements; avoid duplicate writing or invoking both by default. Use observed accuracy, cost, latency and outcome to revise routing. A Jev probability is evidence for classification and never independently grants permission.

## A-to-Z workstreams and acceptance criteria

The order below follows `docs/ROADMAP.md`; detailed designs are still provisional. Build incrementally, keep the roadmap factual, and mark a phase complete only after a real workflow has been observed and checked.

| Phase | Intended work | Evidence required |
| --- | --- | --- |
| 0 — Foundation | Versioned constitution, policies, repository layout, schemas, basic service and CI; later private always-on runtime. | Source and CI already exist. VPS and persistent secret handling remain open; do not mark them done. |
| 1 — Decision plane | Jev System One adapter; six-way intent routing; risk classification and policy selection from **trusted local metadata**; authentication, bounded audit, confidence calibration and failure handling. | Live synthetic routing is proven. Before enforcement, inspect concrete tool calls in trusted code and prove that caller-supplied flags/policies cannot weaken decisions. |
| 2 — Agent integration | Telegram/OpenClaw, runtime decision hooks and Codex/Claude adapters, manager dispatch, exact-action human approvals. | First prove a fresh DM through `@secretaireivanbot` really calls `ivan_route` and returns `provider: jev`. Later demonstrate a real policy hook and approval flow; plugin registration or direct RPC alone is insufficient. |
| 3 — Memory | Locate `Obsidian Notes` vault and define read/write/sync permissions; Markdown knowledge with provenance, search and deduplication; optional embeddings/pgvector after measuring retrieval; supervised Dream consolidation. | Retrieve a sourced note, update it safely and reject/flag an unsupported or conflicting memory. Protect personal notes and secrets. |
| 4 — Business Engine | Find, deduplicate and evaluate market signals; distinguish near-term **Cash** opportunities (roughly 1–30 days) from **Venture** opportunities (roughly 6–24+ months); send useful briefs to Telegram. | Trace a recommendation to evidence, assumptions, work estimate and possible return; research and drafts can run autonomously, prospect contact needs Ivan's approval. CatalogDrive may be a candidate, not an automatic commitment. |
| 5 — Career Engine | Find Product Owner, AMOA/Business Analyst and related freelance opportunities, match Ivan's actual profile, prepare tailored CV/materials and track outcomes. | Show sourced offers and truthful tailored drafts; Ivan approves each application/recruiter contact. Relevant profile includes TotalEnergies digital PO/AMOA work, technical delivery and earlier automotive sales; check current CV for exact claims before using numbers. |
| 6 — Finance Engine | Monitor ETF/DCA, macro signals, portfolio allocations and drift; assess crypto as market context where relevant. | Provide sourced scenarios and risk assumptions only. Ivan's stated personal investment preference excluded crypto unless he changes it. No trades, transfers or payments without explicit approval. |
| 7 — Engineering Factory | Decompose a scoped task, select a builder (Claude/Codex) and independent reviewer as justified, run meaningful tests, document evidence, propose branch/PR. | A branch/PR with passing checks, clear review findings and bounded tool access; no automatic production deployment. |
| 8 — Anakalypto | Turn topics into sourced claims, fact checks, visual pedagogy and interactive learning content. | Every important assertion traceable to source; factual and UX review before publication. |
| 9 — System Steward | Observe policy drift, unsafe skills/MCP, prompt bloat, tool and model errors, token/cost telemetry and controlled resets. | Measurable diagnostics and reversible improvements; policy changes require review rather than autonomous relaxation. |
| 10 — ROI scheduler | Schedule jobs by expected value, cost and measured success; reduce duplicate research and noisy alerts. | Demonstrate useful work per euro and per unit time, with a record of skipped, retried and completed tasks. |

The later phases are a roadmap, **not** ten parallel builds. Finish the narrow end-to-end route and trustworthy decision boundary before scaling autonomous workflows. Architecture proposals (PostgreSQL + pgvector, queue/Redis, VPS, private encrypted Mac/VPS networking) remain proposals until deployed and verified.

## Confirmed autonomy and safety rules

- Ivan authorizes research, local project development, drafts, Obsidian notes and GitHub pushes/PR preparation. He wants autonomy for routine implementation and Telegram reports.
- His explicit approval is required for **payments/purchases/subscriptions, financial transactions, messages or applications to third parties, publication under his identity and destructive production actions**. Sending a Telegram message to Ivan as a report is within the intended system; messaging prospects is not.
- Preserve the current `tools.deny: ["exec"]` for the Telegram agent unless Ivan explicitly changes the policy through a scoped decision. A local Codex session acting in its own authorized workspace is a different process from an OpenClaw agent granted host shell access.
- `constitution/CONSTITUTION.md`, relevant policies and `AGENTS.md` govern implementation. Never copy secrets into Git, prompts, logs, Obsidian or a transcript. Rotate previously exposed Telegram and Gateway credentials before broadening integration. Never expose the unauthenticated Jev endpoint publicly.
- The existing `/v1/route` classifier and `ivan_route` are advisory. In particular, `REVIEW` means no authorization. Build hard-rule checks, trusted policy lookup, authentication, redacted audit and exact-action approval tokens before making an enforcement claim.

## Concrete continuation for local Codex

1. Verify the execution host is Ivan's Mac (`pwd`, `uname -s`), the checkout and uncommitted files (`git status --short --branch`), and the branch head. Fetch carefully after reviewing local changes. Read `AGENTS.md`, `constitution/CONSTITUTION.md`, `docs/ARCHITECTURE.md`, this handoff, `docs/ROADMAP.md`, `docs/USER_ACTIONS.md`, `docs/DECISION-PLANE.md` and the plugin README. Treat source and current runtime state as authoritative where the handoff ages.
2. Inspect local processes without exposing secrets. Check whether `bash scripts/mac-jev-smoke.sh --stay` is **still** running and `http://127.0.0.1:4310/health` is reachable; if it has stopped, use the hidden prompt workflow when a real Jev test is necessary. Do not assume this cloud session's localhost is Ivan's Mac.
3. Reproduce a fresh synthetic Telegram interaction with `@secretaireivanbot` if the current session can operate it; otherwise obtain Ivan's bot response once. Compare with Gateway logs/tool visibility. The prior screenshot showing `ivan_route unavailable` predates a successful direct RPC and must not be treated as a current failure. Preserve Telegram access rules and avoid speculative config edits. If the model still cannot see the tool, diagnose session/tool catalog/runtime compatibility, then fix and verify. Do not confuse direct RPC success with model tool discovery.
4. On success, update the roadmap with the observed evidence. Next, design and implement the smallest useful trusted policy path (concrete tool metadata, local policy catalog, auth, fail-closed decisions, redacted audit), with focused tests. Plan a persistent deployment and its precise recurring costs for Ivan's approval only when the design is reviewable.
5. Continue phases in order, incrementally; record each milestone, unresolved assumption, test and next action in repository docs. Do not demand the whole project be finished in one session, and do not silently mark planned components complete.

## Broader roadmap
Phase 0 foundation and Phase 1 advisory Jev routing are largely implemented; a persistent private service, trusted policy catalog, authentication, calibration and actual enforcement are pending. Phase 2 integrates agents and Telegram. Later phases add Obsidian memory, business and career engines, financial analysis without automatic trading, an engineering factory, Anakalypto, and ROI/maintenance workflows. See `docs/ROADMAP.md` for checkboxes and precise scope.
