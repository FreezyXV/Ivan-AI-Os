# OpenClaw adapter (source only)

Target: OpenClaw 2026.9.5. This plugin exposes the **advisory** `ivan_route` tool to the agent. It does not intercept tool calls, change model routing, start worker agents, or grant execution rights. The current Gateway requires local-only access; if run on a VPS later, its endpoint needs private connectivity and authentication before this plugin is pointed at it.

The source follows OpenClaw's native plugin manifest and `api.registerTool` contract. It is **not installed** on Ivan's Mac. Verify dependencies and the installed SDK against the exact Mac build before activation. The first smoke test should be a request with no personal data and no tool execution. As a normal model-visible tool, it does not eliminate the initial model call; a later native routing stage is needed for that optimization.

To prepare locally after deploying the Gateway on the same Mac: review the source; run `npm install` inside this directory; link with `openclaw plugins install --link ./hooks/openclaw/ivan-route --force`; enable with `openclaw plugins enable ivan-ai-os-route`; set `plugins.entries.ivan-ai-os-route.config.gatewayUrl` to `http://127.0.0.1:4310` using the OpenClaw config UI; then inspect with `openclaw plugins inspect ivan-ai-os-route --runtime --json`. Paths are relative to the cloned repository root. The default Gateway mock returns REVIEW. Do not activate on a remote Gateway without an authenticated private route.

Reference: https://docs.openclaw.ai/plugins/building-plugins and https://docs.openclaw.ai/plugins/hooks.
