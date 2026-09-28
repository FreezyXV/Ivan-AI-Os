# Human inputs and confirmed decisions

Confirmed on 2026-09-28:
- Ivan has a TypeSafe/Jev API key. It has not been installed in any AI OS runtime or used in a live test.
- OpenClaw 2026.9.5 (commit ec9c1a13) runs as a Mac LaunchAgent, with a local Gateway and a Telegram channel. The terminal log indicates the default model changed several times; the final effective model should be verified from the current config.
- The Telegram channel is routed to the `main` agent; private DMs use an allowlist. Host `exec` was ultimately denied at the tool level. Do not assume a plugin can run shell commands on the Mac.
- Obsidian vault name: `Obsidian Notes` (filesystem path and sync arrangement unknown).
- A 24/7 VPS around €10–15/month is acceptable in principle. Provider, exact plan and any purchase remain to be selected/approved.

## Next inputs

1. Once a local or VPS Gateway runtime is selected, put the Jev key there through a local secret mechanism. Do not send it in chat or commit it.
2. Share the **redacted** output of `openclaw config get agents.defaults.model --json`, `openclaw config get channels.telegram --json` and `openclaw config get tools --json` if needed for wiring. Review it manually before sharing, especially nested channel credentials.
3. Provide the local path to the `Obsidian Notes` vault when we connect it. The name is enough for current planning.
4. VPS purchase and billing stay with Ivan. Prepare a specific deployment proposal before purchase.

## Existing credential exposure

A Telegram bot credential appeared in the shared terminal transcript and a Gateway credential was visible in a screenshot. Replace both before connecting the AI OS to additional tools or exposing the Gateway. Do not copy either credential into this repository.

## Approval boundary

Research, source changes and drafts can proceed. Ivan approves purchases, payments, transactions and third-party contact.
