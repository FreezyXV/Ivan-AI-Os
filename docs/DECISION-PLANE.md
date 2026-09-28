# Decision Plane: current scope

The gateway speaks the official TypeSafe System One API: `POST https://api.typesafe.ai/v1/systemone`, with `state`, `model`, and a typed `choice` question. Its answer comes from `answers.permission.choice` and the associated probabilities/confidence. The human-readable question and allow thresholds live in `services/jev-gateway/src/questions.js`.

## What is implemented

- Deterministic kernel checks declared financial actions, external contact, policy changes and high-impact destructive actions before Jev.
- `JEV_PROVIDER=mock` returns `REVIEW`; it never grants permission.
- `JEV_PROVIDER=jev` calls the official API with `TYPESAFE_API_KEY`; outages, malformed responses and insufficient confidence never grant permission.
- Only action intent/tool/risk and policy IDs/descriptions go to TypeSafe. Do not put secrets or personal data into `intent` or policy descriptions. Tool arguments are not transmitted.
- Input requires explicit risk flags. Empty policy lists return `REVIEW`.
- `POST /v1/route` batches a Choice (six managers), a Noul (whether execution needs details) and a Score (urgency) in one TypeSafe call. A known domain can be routed even when execution needs more detail. Mock mode or uncertain domain selection returns REVIEW. This is advisory and does not launch workers.

## Security boundary and next work

This endpoint is an **advisory classifier**, not yet a security boundary. Today the caller supplies its own flags and policies; a dishonest or compromised caller can mislabel an action. The API is not authenticated, and no Claude Code, Codex or OpenClaw tool hook is wired. Do not expose it to the public Internet or use `ALLOW` as permission for a tool call. The Docker Compose port is bound to loopback; other services still need trusted, authenticated access.

Before enforcing decisions: classify concrete tool calls in trusted code, select policies from a versioned local catalog, authenticate callers, store bounded/redacted audit events, implement and test actual runtime hooks, and use real authorization tokens bound to exact proposed actions for any human approval. TypeSafe output is probabilistic; deterministic permission checks remain authoritative. Never use a weaker model fallback to approve protected actions.

## Activation checklist

1. Ivan confirmed he has a TypeSafe API key. Set `TYPESAFE_API_KEY` in the runtime secret store on the machine that runs this Gateway. Do not commit it or paste it in chat.
2. Set `JEV_PROVIDER=jev` only in the private runtime after checking API access and cost. There is no live Jev test in CI.
3. Run `cd services/jev-gateway && npm test` (Node 22+). Review `questions.js` and tune thresholds on labeled examples before treating classifications as useful.
4. OpenClaw 2026.9.5 is running locally on the Mac. Its exact redacted config and the path to `Obsidian Notes` are still needed before deployment or vault sync.

On Ivan's Mac, run `bash scripts/mac-jev-smoke.sh` from the repository root for one **real** TypeSafe routing call. It prompts for the key without echo and discards it when the script exits. The prompt text sent to TypeSafe is synthetic. This test does not install a plugin or change OpenClaw settings. Share only the response after checking it contains no secrets.

On a non-200 result, the smoke test prints the HTTP status and a bounded `error_code` such as `TYPESAFE_HTTP_422`, `TYPESAFE_TIMEOUT`, `TYPESAFE_NETWORK_ERROR` or `TYPESAFE_ROUTING_RESPONSE_INVALID`. Provider response bodies and keys are never returned by this diagnostic. The default TypeSafe timeout is 8 seconds.

Official reference: https://docs.typesafe.ai/llms.txt and https://docs.typesafe.ai/api.
