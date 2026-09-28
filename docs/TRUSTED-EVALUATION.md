# Concrete tool evaluation — shadow prototype

Implemented locally on 2026-09-28 after the first verified Telegram → `ivan_route` → Jev call. This is the next incremental decision-plane milestone, not an execution permission system.

## Contract

`POST /v1/evaluate-tool` accepts only a concrete tool name and arguments:

```json
{"tool":"read","arguments":{"path":"README.md"}}
```

The request requires `Authorization: Bearer …`. `IVAN_DECISION_TOKEN` must be a cryptographically random token of at least 32 non-whitespace characters and come from the runtime secret mechanism, never Git, chat or command-line arguments. No token was provisioned or persisted during this session. The endpoint is disabled when the environment variable is absent. A configured token without a valid audit path refuses service startup.

`IVAN_AUDIT_PATH` selects an absolute path in an existing private directory. `IVAN_WORKSPACE_ROOT` selects the trusted project root for filesystem inspection. The optional endpoint is not activated in the already-running Mac smoke service. Its HTTP behavior was tested using ephemeral loopback servers and synthetic credentials.

## Deterministic path

1. Authenticate before parsing or evaluating the request. Reject top-level caller flags, policy lists, intent, actor and approval claims.
2. Inspect the concrete `tool` and `arguments` in local code. Messaging requires approval; arbitrary shell requires human review; runtime configuration requires policy review. Unknown tools and patches return REVIEW. Existing ordinary project paths may reach Jev; sensitive paths are denied, protected metadata writes require review, and unresolved/outside paths stay closed. Symlink targets are inspected. No file contents are read by the classifier.
3. Load all four global kernel policies from the repository. The fixed catalog checks their IDs, version, effects and invariants and passes their bounded source text as descriptions. It is not a general YAML interpreter; the deterministic checks remain code. The catalog's SHA-256 revision binds the response and audit to the exact loaded sources. Changed descriptions change this revision; there is no signature or tamper-proof policy store.
4. Send only static intent/tool/risk metadata and local policy text to Jev. Paths, arguments, message text, commands, headers and caller prose stay local. No new live provider call was made for these tests.
5. Append a bounded, field-allowlisted audit event before returning a successful evaluation. Every response has `advisory: true` and `executable: false`. Even a provider ALLOW becomes REVIEW with `ENFORCEMENT_NOT_ENABLED`.

Examples: `message` with `action: send` and a false `external_contact` argument still requires human approval; a top-level `policies: []` is rejected. An unknown payment tool stays REVIEW. This prototype does not yet semantically classify every financial operation or parse shell commands, patches, new-file writes, or approval tokens.

## Audit and failure behavior

The journal records a generated request ID, timestamp, fixed adapter identity, known tool category, risk, decision, classification confidence, bounded reason code, provider, policy IDs/revision and latency. Confidence refers to the underlying classification, not permission to execute. It excludes original arguments, addresses, file paths, provider prose, tokens and raw errors. Invalid authenticated requests are audited; unauthenticated requests are rejected before evaluation and are not journaled.

The POSIX journal is created mode `0600`, rejects a symlink or multiply linked destination, rejects group/world access, and appends with a durability flush. It supports one service process and stops accepting successful evaluations at 1 MB; no automatic rotation, deletion or truncation is performed. An unwritable/full/unsafe journal yields HTTP 503 and ESCALATE. Retention, rotation, concurrent writers and monitoring are future work; this journal is not tamper-evident.

## Remaining trust boundary

The authenticated caller can still submit a tool name different from the action it later executes. An actual trusted runtime hook must capture and bind the exact pending call. This endpoint neither observes all OpenClaw calls nor executes or blocks any action. Filesystem inspection is advisory and does not solve execution-time path races. The bearer identity is one local adapter, not a multi-user authorization model.

The legacy `/v1/decide` and `/v1/route` endpoints remain unauthenticated and advisory. Protecting this new endpoint does not secure the whole server. Keep loopback/private access; do not expose the service or interpret legacy ALLOW as permission. The Docker skeleton is unchanged; enabling this path there would additionally require the policy catalog and private audit directory to be mounted, plus runtime-only credentials.

Next: review this prototype, calibrate with labeled scenarios, integrate a native `before_tool_call` observer against the installed runtime contract, then implement exact-action approvals and durable private secret provisioning before enabling enforcement. Existing exposed credentials must be replaced before broadening live integration.

## Verification

24 local tests passed on Node 24.19.0: the existing provider/router/plugin suite plus real loopback HTTP authentication tests, forged metadata/approval rejection, sensitive/protected paths and symlinks, unknown tools, provider failures, policy drift, redaction, journal capacity, permissions and write failure behavior. All provider responses in the new evaluator tests are synthetic; these tests spend no provider credits.
