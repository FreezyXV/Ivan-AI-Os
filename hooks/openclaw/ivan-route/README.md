# OpenClaw adapter (source only)

Target: OpenClaw 2026.9.5. This plugin exposes the **advisory** `ivan_route` tool to the agent. It does not intercept tool calls, change model routing, start worker agents, or grant execution rights. The current Gateway requires local-only access; if run on a VPS later, its endpoint needs private connectivity and authentication before this plugin is pointed at it.

The source follows OpenClaw's native plugin manifest and `api.registerTool` contract. It is **not installed** on Ivan's Mac. Verify dependencies and the installed SDK against the exact Mac build before activation. The first smoke test should be a request with no personal data and no tool execution. As a normal model-visible tool, it does not eliminate the initial model call; a later native routing stage is needed for that optimization.

On Ivan's Mac, after `git pull --ff-only`, start the real Jev Gateway from the repository root in terminal A. Enter the API key at the hidden prompt and leave that terminal open:

```bash
bash scripts/mac-jev-smoke.sh --stay
```

The synthetic smoke must return HTTP 200 before you continue. In terminal B, from the same repository root, review the plugin source, install its dependencies, and link the plugin into OpenClaw:

```bash
npm install --prefix hooks/openclaw/ivan-route --legacy-peer-deps
openclaw plugins install --link ./hooks/openclaw/ivan-route --force
```

OpenClaw 2026.9.5 does not support the newer `plugins install --no-enable` flag. If that older command was already tried, the `plugin not found` warning means the install did not run; the configuration entry is preserved. The install above should resolve it. Stop and inspect its output before continuing. Then set the local endpoint (if it was not already set), enable the plugin, and inspect its registration:

```bash
openclaw config set plugins.entries.ivan-ai-os-route.config.gatewayUrl http://127.0.0.1:4310
openclaw plugins enable ivan-ai-os-route
openclaw gateway restart
openclaw plugins inspect ivan-ai-os-route --runtime --json
```

The inspection should include the `ivan_route` tool. In a Telegram DM to the existing bot, ask it explicitly to use `ivan_route` on a synthetic engineering request and show the returned JSON; a `provider: "jev"` result demonstrates the full path. If the agent does not call the tool, inspection alone only proves registration, not the live route. Stop the Gateway in terminal A with Ctrl+C when finished. The default Gateway mock returns REVIEW. Do not activate on a remote Gateway without an authenticated private route.

OpenClaw's official external TypeSafe plugin and `decisionModel` role require a host at 2026.9.6 or later; the packaged plugin was not yet published when checked on 2026-09-28. It cannot be installed on OpenClaw 2026.9.5. Even on compatible hosts, decision evaluation requires an explicit consumer or `decision_evaluate` call; selecting the decision model does not automatically route every conversation. Revisit the official integration after a supporting release, and validate behavior before replacing this adapter. See https://docs.openclaw.ai/plugins/typesafe and https://docs.openclaw.ai/concepts/decision-models.

Reference: https://docs.openclaw.ai/plugins/building-plugins and https://docs.openclaw.ai/plugins/hooks.
