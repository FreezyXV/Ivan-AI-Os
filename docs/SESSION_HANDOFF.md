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

## Broader roadmap
Phase 0 foundation and Phase 1 advisory Jev routing are largely implemented; a persistent private service, trusted policy catalog, authentication, calibration and actual enforcement are pending. Phase 2 integrates agents and Telegram. Later phases add Obsidian memory, business and career engines, financial analysis without automatic trading, an engineering factory, Anakalypto, and ROI/maintenance workflows. See `docs/ROADMAP.md` for checkboxes and precise scope.
