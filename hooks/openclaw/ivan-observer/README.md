# OpenClaw tool observer — inactive prototype

Target: OpenClaw **2026.9.5**. This separate, source-linked plugin captures scoped `before_tool_call` and `after_tool_call` events and compares their parameters. It does not alter the working `ivan_route` plugin. It is not installed or activated in Ivan's live gateway.

## What is verified

- `api.on` registers the native typed hooks. Callbacks return no permission, block, approval or argument rewrite.
- A capture requires the configured agent, an explicit list of tool names, consistent host tool identity, and host-provided run/call IDs. Missing identity is reported as a gap rather than guessed.
- Before awaiting any network operation, the observer snapshots a bounded JSON call. The authenticated gateway evaluates the snapshot and computes its own HMAC-SHA256 `action_binding`. The observer checks that binding before associating the evaluation with the captured call.
- A second, domain-separated HMAC correlates agent/run/tool-call identity without logging raw runtime identifiers. An independent observation UUID joins before/after events; the gateway request UUID joins the two audit journals.
- Completion parameters are fingerprinted again. A mismatch records `params_unchanged: false`; it is not retroactive enforcement. Tool results, raw error strings, requester information, session data and arguments are not written to the observer journal.

The local test uses **the actual installed OpenClaw hook runner** in an isolated registry, a temporary authenticated loopback server, generated disposable credentials, and temporary files. It proves matching capture, detection of a real hook rewrite, request/audit correlation, and the fact that an earlier blocking hook prevents this observer from running. No model, Telegram message or TypeSafe request is involved.

```bash
node scripts/verify-openclaw-observer.mjs /absolute/path/to/installed/openclaw
```

Run that command from the repository root with Node 22+ (verified on Node 24.19.0). The script accepts only the inspected 2026.9.5 package and discovers its internal hook-runner export. This is a version-pinned compatibility check, not a public API dependency used by the plugin. It removes only its own temporary fixture directory on exit.

Observed on Ivan's Mac, 2026-09-28:

```json
{
  "openclaw_version": "2026.9.5",
  "hook_runner_sha256": "94e01df2379fd8657bff777eabe6f75c0bf25dfa70ab3127257b570931bc7bb8",
  "correlated_calls": 2,
  "changed_parameter_calls": 1,
  "earlier_block_verified": true,
  "evaluation_provider": "mock",
  "installed_in_live_gateway": false
}
```

## Proposed private pilot configuration

Registration is a no-op unless plugin config contains `enabled: true`. Active registration requires `agentId`, a nonempty `tools` list (maximum 32), `gatewayUrl`, and an absolute `auditPath`. Invalid active configuration emits `OBSERVER_DISABLED_INVALID_CONFIG` and registers no observer hooks, without throwing from `register()`. This preserves host availability for optional telemetry; it is not suitable behavior for a mandatory enforcement gate. `IVAN_DECISION_TOKEN` comes from the gateway process's runtime environment; there is deliberately no token field in plugin config. The evaluator must use the same token. Keep the whole repository checkout available: the observer imports the canonical binding and audit helpers from the gateway source.

The installed native loader was also verified with an enabled observer, no token, a disposable state/config directory, and `activate: false`: it returns `plugin_status: loaded`, zero observer hooks and the bounded warning. This is a native registration test, not a live gateway restart. Reproduce from the repository root:

```bash
node scripts/verify-openclaw-observer-registration.mjs /absolute/path/to/installed/openclaw
```

Use numeric loopback (`http://127.0.0.1:PORT` or IPv6 loopback). Remote hosts, DNS names, credentials in URLs, URL paths, queries and redirects are rejected. The client uses a 3-second default deadline (configurable 250–10000 ms), propagates host cancellation and limits response bodies to 16 KB. It rejects ALLOW, executable responses and malformed binding metadata. A timeout may leave an evaluator request finishing independently; it is not recorded as a successful correlated evaluation by the observer.

The proposal is to begin with a dedicated synthetic agent and `tools: ["read"]`, an ephemeral mock evaluator, and private audit files. After local secret provisioning and replacement of the previously exposed credentials, inspect registration and verify actual native events in that dedicated session before expanding the tool list. Preserve `tools.deny: ["exec"]`, the Telegram allowlist and the live advisory route. This session did not perform those activation steps or change configuration.

## Coverage and failure limits

- Scoped before hooks await evaluation before returning. Observation means no execution authority, not zero latency: the default client deadline is 3 seconds, the hook budget 5 seconds, plus synchronous audit work. Measure latency during the narrow pilot before broadening scope.
- Rotating the bearer token changes newly computed HMACs. Completed stored pairs remain joinable by their recorded IDs/hashes; recomputing an old binding requires its old key. There is no cross-rotation pending-call guarantee or historical cryptographic attestation. A separate versioned binding key is future operational work.
- Every hook handler sees an isolated copy of the **original** event. Changing priority cannot turn `before_tool_call` into a view of all final parameters. Earlier blocks can skip the observer altogether.
- Native Codex completions may be asynchronous observations; other runtime paths may omit IDs or hooks. This is not universal call coverage or proof that a call executed successfully.
- Pending state contains only hashes, UUIDs and timestamps. It is capped at 256 entries; 15-minute expiry is applied on subsequent scoped callbacks. Duplicate before events, capacity overflow, unmatched completions and capture failures produce bounded diagnostic codes. Shutdown records remaining entries as incomplete. Restart does not reconstruct pending state.
- Audit storage uses the existing private 1 MB append-only writer. Evaluation/audit failures produce bounded warnings and missing evidence; an observer does **not** block existing execution. Existing host policies remain responsible for permissions.
- HMAC bindings are private correlation evidence, **not approval tokens**. They cover JSON tool name/arguments, not filesystem contents, transaction state, runtime tool implementation, requester authorization or policy revision. The latter is recorded separately. Someone holding the shared bearer key can submit or forge observations; there is no remote attestation or replay-resistant approval mechanism.
- Canonical capture rejects getters, unsupported JSON values, sparse arrays, cycles, negative zero, over-deep structures and calls over 64 KB instead of dropping data. Object key ordering is normalized; array order and values remain significant.

Next: labeled policy calibration and exact-action human approvals against the runtime's frozen approval snapshot; then a scoped live pilot. The host approval bridge's `requireApproval` semantics must be verified separately before enforcement.

## Primary runtime references

The implementation was checked against the installed package's `docs/plugins/hooks/tool-policy.md`, `docs/plugins/hooks/reference.md`, `docs/plugins/codex-harness-runtime/hooks.md`, runtime type declarations and hook-runner source. The public equivalents are [tool policy hooks](https://docs.openclaw.ai/plugins/hooks/tool-policy), [hook execution reference](https://docs.openclaw.ai/plugins/hooks/reference), and [Codex hook boundaries](https://docs.openclaw.ai/plugins/codex-harness-runtime/hooks).
