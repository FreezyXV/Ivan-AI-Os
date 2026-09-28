# Human Inputs / Dependencies

The foundation can be built without secrets. The following items are needed only when their phase begins.

## Needed for Phase 1 — Jev integration
- Confirm whether Ivan already has access to the official TypeSafe AI / Jev API.
- If yes: provide credentials only through the chosen runtime secret store, never in chat or Git.
- If no: keep the mock/fallback provider while implementing the rest of the decision plane.

## Needed for VPS deployment
- Select/provision a VPS.
- Ivan retains billing approval.
- Once provisioned, provide non-secret connection details and configure SSH/Tailscale locally; private keys remain local.

## Needed for OpenClaw integration
- Current OpenClaw config/runtime layout on the Mac.
- Telegram bot remains under Ivan's existing control.
- Secrets must be migrated to environment/secret storage rather than committed.

## Needed for Obsidian integration
- Path/name of the vault to use.
- We will create AI-OS folders without overwriting existing notes.

## Approval boundary
The project may autonomously prepare configuration, code, research and drafts.
Ivan explicitly approves payments, subscriptions, financial execution and any third-party contact.
