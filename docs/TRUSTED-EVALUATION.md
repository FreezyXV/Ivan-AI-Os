# Concrete tool evaluation — shadow prototype

Implemented locally on 2026-09-28 after the first verified Telegram → `ivan_route` → Jev call. This is the next incremental decision-plane milestone, not an execution permission system.

## Contract

`POST /v1/evaluate-tool` accepts only a concrete tool name and arguments:

```json
{"tool":"read","arguments":{"path":"README.md"}}
```

The request requires `Authorization: Bearer …`. `IVAN_DECISION_TOKEN` must be a cryptographically random token of at least 32 non-whitespace characters and come from the runtime secret mechanism, never Git, chat or command-line arguments. No persistent token was provisioned during these sessions. The new source also supports a private `IVAN_DECISION_TOKEN_FILE` (default runtime decision-token); endpoints are disabled when no valid token is configured. A configured token without an absolute audit path refuses service startup.

`IVAN_AUDIT_PATH` selects an absolute path in an existing private directory. Missing/invalid audit configuration refuses startup; filesystem write/permission/capacity failures at evaluation time return HTTP 503. `IVAN_WORKSPACE_ROOT` selects the trusted project root for filesystem inspection. The optional endpoint is not activated in the already-running Mac smoke service. Its HTTP behavior was tested using ephemeral loopback servers and synthetic credentials.

Every structurally valid bounded call now receives an `action_binding`: HMAC-SHA256 of canonical JSON tool name/arguments, keyed by the runtime token and a versioned domain separator. The service snapshots input before awaiting the provider and records the same binding in its audit. It is correlation evidence, not authorization. Limits and native-hook verification are documented in `hooks/openclaw/ivan-observer/README.md`.

## Deterministic path

1. Authenticate before parsing or evaluating the request. Reject top-level caller flags, policy lists, intent, actor and approval claims.
2. Inspect the concrete `tool` and `arguments` in local code. Messaging requires approval; arbitrary shell requires human review; runtime configuration requires policy review. Unknown tools and patches return REVIEW. Existing ordinary project paths may reach Jev; sensitive paths are denied, protected metadata writes require review, and unresolved/outside paths stay closed. Symlink targets are inspected. No file contents are read by the classifier.
3. Load all four global kernel policies from the repository. The fixed catalog checks their IDs, version, effects and invariants and passes their bounded source text as descriptions. It is not a general YAML interpreter; the deterministic checks remain code. The catalog's SHA-256 revision binds the response and audit to the exact loaded sources. Changed descriptions change this revision; there is no signature or tamper-proof policy store.
4. Send only static intent/tool/risk metadata and local policy text to Jev. Paths, arguments, message text, commands, headers and caller prose stay local. No new live provider call was made for these tests.
5. Append a bounded, field-allowlisted audit event before returning a successful evaluation. Every response has `advisory: true` and `executable: false`. Even a provider ALLOW becomes REVIEW with `ENFORCEMENT_NOT_ENABLED`.

Examples: `message` with `action: send` and a false `external_contact` argument still requires human approval; a top-level `policies: []` is rejected. An unknown payment tool stays REVIEW. Sensitive names with extensions are denied even when absent; new protected destinations, including aliases through an existing directory symlink, require human review. Ordinary missing paths stay REVIEW. This prototype does not yet semantically classify every financial operation or parse shell commands, patches, file contents, or approval tokens.

## Audit and failure behavior

The journal records a generated request ID, timestamp, fixed adapter identity, known tool category, risk, decision, classification confidence, bounded reason code, provider, policy IDs/revision and latency. Confidence refers to the underlying classification, not permission to execute. It excludes original arguments, addresses, file paths, provider prose, tokens and raw errors. Invalid authenticated requests are audited; unauthenticated requests are rejected before evaluation and are not journaled.

The POSIX journal is created mode `0600`, rejects a symlink or multiply linked destination, rejects group/world access, and appends with a durability flush. It supports one service process and stops accepting successful evaluations at 1 MB; no automatic rotation, deletion or truncation is performed. An unwritable/full/unsafe journal yields HTTP 503 and ESCALATE. Retention, rotation, concurrent writers and monitoring are future work; this journal is not tamper-evident.

## Remaining trust boundary

The authenticated caller can still submit a tool name different from the action it later executes. A separate, inactive OpenClaw observer now captures original and completion parameters, verifies the evaluator's binding, and detects rewrites. It was verified with the installed hook runner in isolation, not with the live gateway. Neither endpoint nor observer executes or blocks actions. Hook coverage, native approval snapshots and execution-time path races remain trust boundaries. The bearer identity is one local adapter, not a multi-user authorization model.

Historical live service: the legacy `/v1/decide` and `/v1/route` endpoints remain unauthenticated and advisory. Proposed source has now replaced this contract; see [SECURE-GATEWAY.md](SECURE-GATEWAY.md). Route still sends caller text to TypeSafe; use public/synthetic test requests only pending migration. There is no provider quota yet. Protecting this new endpoint does not secure the whole server. Keep loopback/private access; do not expose the service or interpret legacy ALLOW as permission. The Docker skeleton now limits the gateway's injected environment to its six own variables. Enabling this path there still requires the policy catalog and private audit directory to be mounted, plus runtime-only credentials. See `docs/RESPONSE-TO-CLAUDE-2026-09-29.md` for the proposed migration.

Next: calibrate with labeled scenarios, implement exact-action approvals and durable private secret provisioning, then verify the observer in a scoped live pilot before enabling enforcement. Existing exposed credentials must be replaced before broadening live integration.

## Verification

43 local tests pass on Node 24.19.0 on the follow-up review branch: binding, correlation, rewritten parameters, missing identity, bounded pending state, cancellation, client validation, invalid observer configuration, protected metadata and sensitive/missing destinations. Additional isolated tests against the actual OpenClaw 2026.9.5 hook runner and loader verify two correlated calls, a rewrite and successful plugin loading without a token (zero observer hooks). Provider responses in these tests are synthetic; these tests spend no provider credits.
