# Human inputs and confirmed decisions

Confirmed on 2026-09-28:
- Ivan has a TypeSafe/Jev API key. The Mac smoke test succeeded on 2026-09-28 (HTTP 200; Jev returned `ROUTED` for a synthetic engineering request). The script takes the key through a hidden prompt and does not persist it; no always-on runtime is configured yet.
- OpenClaw 2026.9.5 (commit ec9c1a13) runs as a Mac LaunchAgent, with a local Gateway and a Telegram channel. The effective default model was verified locally: `openai/gpt-5.6-terra`, fallback `openai/gpt-5.6-sol`.
- The Telegram channel is routed to the `main` agent; private DMs use an allowlist. Host `exec` was ultimately denied at the tool level. Do not assume a plugin can run shell commands on the Mac.
- The linked `ivan-ai-os-route` plugin was installed on the Mac and inspected with `Status: loaded` and `Tools: ivan_route`; OpenClaw reported its deferred state migration completed. A direct OpenClaw Gateway `tools.invoke` call with `--timeout 45000` returned `ok: true`, `source: plugin`, and a live Jev engineering route. A real Telegram DM also succeeded at 19:26 UTC with explicit dynamic-tool discovery; the actual tool result contains `provider: jev`. See `docs/TELEGRAM-VERIFICATION.md`.
- Obsidian vault name: `Obsidian Notes` (filesystem path and sync arrangement unknown).
- A 24/7 VPS around €10–15/month is acceptable in principle. Provider, exact plan and any purchase remain to be selected/approved.

## Next inputs

1. Telegram verification is complete. An inactive native observer and authenticated shadow evaluator now correlate captured calls. The follow-up review branch has 43 passing tests, plus isolated checks against the installed hook runner and native loader. A live pilot still needs private secret provisioning and replacement of the previously exposed credentials; exact-action approvals remain unimplemented. See `docs/TRUSTED-EVALUATION.md`, `hooks/openclaw/ivan-observer/README.md` and `docs/RESPONSE-TO-CLAUDE-2026-09-29.md`. The latter contains concrete, unapplied shared-policy proposals and two options for each pending Ivan decision; source work need not stop while those are reviewed.
2. Model, tools policy, plugin registration and channel connection were inspected locally. No config dump is needed; avoid sharing channel credentials or raw sessions.
3. Provide the local path to the `Obsidian Notes` vault when we connect it. The name is enough for current planning.
4. VPS purchase and billing stay with Ivan. Prepare a specific deployment proposal before purchase.

## Existing credential exposure

A Telegram bot credential appeared in the shared terminal transcript and a Gateway credential was visible in a screenshot. Replace both before connecting the AI OS to additional tools or exposing the Gateway. Do not copy either credential into this repository.

## Approval boundary

Research, source changes and drafts can proceed. Ivan approves purchases, payments, transactions and third-party contact.
