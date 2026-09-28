# Human inputs and confirmed decisions

Confirmed on 2026-09-28:
- Ivan has a TypeSafe/Jev API key. The Mac smoke test succeeded on 2026-09-28 (HTTP 200; Jev returned `ROUTED` for a synthetic engineering request). The script takes the key through a hidden prompt and does not persist it; no always-on runtime is configured yet.
- OpenClaw 2026.9.5 (commit ec9c1a13) runs as a Mac LaunchAgent, with a local Gateway and a Telegram channel. The terminal log indicates the default model changed several times; the final effective model should be verified from the current config.
- The Telegram channel is routed to the `main` agent; private DMs use an allowlist. Host `exec` was ultimately denied at the tool level. Do not assume a plugin can run shell commands on the Mac.
- The linked `ivan-ai-os-route` plugin was installed on the Mac and inspected with `Status: loaded` and `Tools: ivan_route`; OpenClaw reported its deferred state migration completed. A direct OpenClaw Gateway `tools.invoke` call with `--timeout 45000` returned `ok: true`, `source: plugin`, and a live Jev engineering route. A Telegram-to-Jev call has not yet been confirmed.
- Obsidian vault name: `Obsidian Notes` (filesystem path and sync arrangement unknown).
- A 24/7 VPS around €10–15/month is acceptable in principle. Provider, exact plan and any purchase remain to be selected/approved.

## Next inputs

1. With `bash scripts/mac-jev-smoke.sh --stay` still running, ask the existing Telegram bot to call `ivan_route` on a synthetic engineering request and return its raw JSON. Confirm `provider: "jev"`, or share an expurgated error. A later persistent runtime will need its own local secret mechanism.
2. Share the **redacted** output of `openclaw config get agents.defaults.model --json`, `openclaw config get channels.telegram --json` and `openclaw config get tools --json` if needed for wiring. Review it manually before sharing, especially nested channel credentials.
3. Provide the local path to the `Obsidian Notes` vault when we connect it. The name is enough for current planning.
4. VPS purchase and billing stay with Ivan. Prepare a specific deployment proposal before purchase.

## Existing credential exposure

A Telegram bot credential appeared in the shared terminal transcript and a Gateway credential was visible in a screenshot. Replace both before connecting the AI OS to additional tools or exposing the Gateway. Do not copy either credential into this repository.

## Approval boundary

Research, source changes and drafts can proceed. Ivan approves purchases, payments, transactions and third-party contact.
