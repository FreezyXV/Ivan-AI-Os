# Telegram routing evidence — 2026-09-28

Verified on Ivan's Mac (`Darwin`), checkout `/Users/yoanpetrov/Ivan-AI-Os`, branch `foundation/v1`, after fast-forward from `7ce24b0` to `963860a`. The pre-existing untracked plugin `package-lock.json` was preserved unchanged.

## Runtime observations

- OpenClaw 2026.9.5 (`ec9c1a1`), Telegram connected to `@secretaireivanbot`.
- `ivan-ai-os-route` loaded from this checkout; gateway catalog lists `ivan_route`.
- Jev loopback health reports `provider: jev`.
- Effective default model: `openai/gpt-5.6-terra`, fallback `openai/gpt-5.6-sol`.
- `tools.deny: ["exec"]`, exec policy `allowlist` / `ask: always`.
- Codex dynamic tool loading: `searchable`, explicit exclusions empty.
- No runtime settings, access rules or credentials were changed for this verification.

## Reproduction and successful retest

At 15:36 UTC the original fresh DM asked for `ivan_route` and prohibited other tools. The bot reported it unavailable. OpenClaw run `27acafe7-c698-4e51-ba7c-0ce9b09f3e80` contains a reply via `message` and no call to `ivan_route`.

The next test explicitly allowed tool discovery:

> Diagnostic ivan_route : commence par rechercher explicitement cet outil dans le catalogue dynamique OpenClaw (namespace openclaw). Si tu le trouves, appelle-le avec {"text":"Écris un test unitaire pour une fonction Node.js fictive"}, puis renvoie le JSON exact. La recherche d’outils nécessaire est autorisée. N’exécute aucune autre action métier et ne modifie aucune configuration.

The user approved sending this second diagnostic. On the same bot conversation, run `ca22e3a7-d2bb-4c05-8597-d4a48e650ce7` records:

| UTC | Evidence |
| --- | --- |
| 19:26:17 | Fresh turn started |
| 19:26:54.543 | `tool.call`, name `ivan_route` |
| 19:26:55.147 | `tool.result`, name `ivan_route`, success true |
| 19:26:58.923 | Telegram reply through `message`, success true |

The actual tool result and visible Telegram reply contain:

```json
{"status":"ROUTED","manager":"engineering","manager_confidence":1,"urgency":0,"needs_details_probability":0.84,"provider":"jev"}
```

This proves a real inbound Telegram conversation reached Jev through the plugin. It does not prove automatic routing of all messages or enforcement. Discovery guidance fixed this test; the exact cause of the first model's refusal is not proven. The runtime's `context.compiled.tools` list is truncated and must not be used as evidence that an individual tool is absent.

## Repeatable procedure

Keep the Jev smoke process running, send the discovery-aware synthetic prompt, and verify both the actual `ivan_route` event and its provider result. Do not accept a model-written JSON response alone. Inspect only relevant event fields; never export the whole session or credentials into this repository. If discovery fails again, examine the current tool catalog/session before changing configuration.

Local installed OpenClaw documentation explains the searchable `openclaw` namespace in `docs/plugins/codex-harness-reference/dynamic-tools.md` and `docs/plugins/codex-harness-runtime.md`. This session required no tool-policy relaxation or new plugin.
