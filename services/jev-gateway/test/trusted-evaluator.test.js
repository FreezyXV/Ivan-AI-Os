import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, chmodSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createTrustedEvaluator } from "../src/trusted-evaluator.js";
import { loadPolicyCatalog } from "../src/trusted-policy.js";
import { createAuditWriter } from "../src/audit.js";

const token = "synthetic-auth-token-for-unit-tests-only";
const sensitive = "synthetic-private-content-must-stay-local";

function fixture(t, overrides = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "ivan-evaluate-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const workspace = path.join(root, "workspace");
  mkdirSync(workspace);
  writeFileSync(path.join(workspace, "note.md"), "ordinary project file");
  writeFileSync(path.join(workspace, ".env"), sensitive);
  mkdirSync(path.join(workspace, "policies"));
  writeFileSync(path.join(workspace, "policies", "test.yaml"), "test fixture");
  const journal = path.join(root, "audit.jsonl");
  const requests = [];
  const evaluator = createTrustedEvaluator({
    token, workspaceRoot: workspace, auditPath: journal,
    decide: async input => { requests.push(input); return { decision: "ALLOW", confidence: 0.95, provider: "jev" }; },
    ...overrides
  });
  return { root, workspace, journal, requests, evaluator };
}

test("auth rejects absent, malformed, wrong and oversized bearer credentials", t => {
  const { evaluator } = fixture(t);
  for (const value of [undefined, "", token, "Bearer wrong", `Bearer ${token} `, "x".repeat(5000)]) {
    assert.equal(evaluator.authenticate(value), false);
  }
  assert.equal(evaluator.authenticate(`Bearer ${token}`), true);
  assert.throws(() => createTrustedEvaluator({ token: "short", audit() {} }), /INVALID_TRUSTED_CONFIG/);
});

test("caller flags, policies and approval claims cannot override concrete messaging calls", async t => {
  const { evaluator, requests } = fixture(t);
  const call = { tool: "message", arguments: { action: "send", message: sensitive, external_contact: false, approved: true } };
  assert.equal((await evaluator.evaluate(call)).body.decision, "REQUIRE_HUMAN");
  for (const extra of [{ policies: [] }, { risk: "low" }, { approved: true }, { external_contact: false }, { actor: "Ivan" }]) {
    const result = await evaluator.evaluate({ ...call, ...extra });
    assert.equal(result.status, 400);
    assert.equal(result.body.decision, "ESCALATE");
  }
  assert.equal(requests.length, 0);
});

test("unknown tools, arbitrary shell, patches and configuration changes stay closed", async t => {
  const { evaluator, requests } = fixture(t);
  for (const [tool, decision] of [["new_payment_tool", "REVIEW"], ["exec", "REQUIRE_HUMAN"], ["apply_patch", "REVIEW"], ["gateway", "REQUIRE_HUMAN"], ["plugins", "REQUIRE_HUMAN"]]) {
    assert.equal((await evaluator.evaluate({ tool, arguments: { command: sensitive } })).body.decision, decision);
  }
  assert.equal(requests.length, 0);
});

test("filesystem inspection catches secrets, protected writes, symlinks and escapes", async t => {
  const { evaluator, workspace, root, requests } = fixture(t);
  writeFileSync(path.join(root, "outside.md"), sensitive);
  symlinkSync(path.join(workspace, ".env"), path.join(workspace, "innocent.md"));
  symlinkSync(path.join(root, "outside.md"), path.join(workspace, "outside-link.md"));
  for (const [tool, file, decision] of [
    ["read", ".env", "DENY"], ["read", "innocent.md", "DENY"],
    ["read", "../outside.md", "REVIEW"], ["read", "outside-link.md", "REVIEW"],
    ["write", "policies/test.yaml", "REQUIRE_HUMAN"], ["write", "missing.md", "REVIEW"]
  ]) {
    const result = await evaluator.evaluate({ tool, arguments: { path: file, content: sensitive } });
    assert.equal(result.body.decision, decision, file);
    assert.equal(result.body.executable, false);
  }
  assert.equal(requests.length, 0);
});

test("agent instructions, CI workflows and hooks are protected against writes", async t => {
  const { evaluator, workspace, requests } = fixture(t);
  for (const dir of [".claude", ".github/workflows", "hooks/openclaw"]) mkdirSync(path.join(workspace, dir), { recursive: true });
  const files = ["CLAUDE.md", ".claude/settings.json", ".github/workflows/ci.yml", "hooks/openclaw/index.js"];
  for (const file of files) writeFileSync(path.join(workspace, file), "fixture");
  for (const file of files) {
    const write = await evaluator.evaluate({ tool: "write", arguments: { path: file, content: sensitive } });
    assert.equal(write.body.decision, "REQUIRE_HUMAN", file);
    assert.equal(write.body.reason_code, "PROTECTED_PROJECT_METADATA", file);
    const read = await evaluator.evaluate({ tool: "read", arguments: { path: file } });
    assert.equal(read.body.reason_code, "ENFORCEMENT_NOT_ENABLED", file);
  }
  assert.equal(requests.length, files.length);
});

test("missing sensitive paths are denied before resolution", async t => {
  const { evaluator, requests } = fixture(t);
  for (const file of [".env.production", "secrets/api.txt", "credentials/token.json", "certs/server.pem", ".ssh/id_ed25519"]) {
    for (const tool of ["read", "write"]) {
      const result = await evaluator.evaluate({ tool, arguments: { path: file, content: sensitive } });
      assert.equal(result.body.decision, "DENY", file);
      assert.equal(result.body.reason_code, "SENSITIVE_PATH", file);
    }
  }
  assert.equal(requests.length, 0);
});

test("sensitive filenames with extensions are denied even when absent or reached through a symlink", async t => {
  const { evaluator, workspace, requests } = fixture(t);
  const files = ["credentials.json", "secrets.yaml", "secret.production.yml", "credentials.backup.json"];
  for (const file of files) {
    for (const exists of [false, true]) {
      if (exists) writeFileSync(path.join(workspace, file), sensitive);
      for (const tool of ["read", "write", "edit"]) {
        const result = await evaluator.evaluate({ tool, arguments: { path: file } });
        assert.equal(result.body.decision, "DENY", file);
        assert.equal(result.body.reason_code, "SENSITIVE_PATH", file);
      }
    }
  }
  symlinkSync(path.join(workspace, "credentials.json"), path.join(workspace, "ordinary.json"));
  assert.equal((await evaluator.evaluate({ tool: "read", arguments: { path: "ordinary.json" } })).body.decision, "DENY");
  assert.equal(requests.length, 0);
});

test("new protected files require approval, including destinations through an existing directory symlink", async t => {
  const { evaluator, workspace, requests } = fixture(t);
  mkdirSync(path.join(workspace, "hooks"));
  symlinkSync(path.join(workspace, "hooks"), path.join(workspace, "ordinary-directory"));
  for (const file of ["hooks/new.js", "ordinary-directory/new.js", ".github/workflows/new.yml", ".claude/settings.json", "CLAUDE.md", "constitution/new.md"]) {
    const result = await evaluator.evaluate({ tool: "write", arguments: { path: file, content: sensitive } });
    assert.equal(result.body.decision, "REQUIRE_HUMAN", file);
    assert.equal(result.body.reason_code, "PROTECTED_PROJECT_METADATA", file);
  }
  const ordinary = await evaluator.evaluate({ tool: "write", arguments: { path: "ordinary/new.md" } });
  assert.equal(ordinary.body.decision, "REVIEW");
  assert.equal(ordinary.body.reason_code, "PATH_NOT_RESOLVED");
  assert.equal(requests.length, 0);
});

test("absolute workspace aliases preserve protected, ordinary and sensitive classifications", async t => {
  const { evaluator, workspace, root, requests } = fixture(t);
  const alias = path.join(root, "workspace-alias");
  symlinkSync(workspace, alias);
  mkdirSync(path.join(workspace, "hooks"));
  const protectedFile = await evaluator.evaluate({ tool: "write", arguments: { path: path.join(alias, "hooks/new.js") } });
  assert.equal(protectedFile.body.decision, "REQUIRE_HUMAN");
  assert.equal(protectedFile.body.reason_code, "PROTECTED_PROJECT_METADATA");
  assert.equal((await evaluator.evaluate({ tool: "read", arguments: { path: path.join(alias, "note.md") } })).body.reason_code, "ENFORCEMENT_NOT_ENABLED");
  assert.equal((await evaluator.evaluate({ tool: "read", arguments: { path: path.join(alias, ".env") } })).body.decision, "DENY");
  writeFileSync(path.join(root, "outside.md"), "outside");
  symlinkSync(path.join(root, "outside.md"), path.join(workspace, "escape.md"));
  assert.equal((await evaluator.evaluate({ tool: "read", arguments: { path: path.join(alias, "escape.md") } })).body.reason_code, "OUTSIDE_WORKSPACE");
  assert.equal(requests.length, 1);
});

test("provider only receives trusted metadata and local policies; ALLOW never authorizes", async t => {
  const { evaluator, requests, journal } = fixture(t);
  const result = await evaluator.evaluate({ tool: "read", arguments: { path: "note.md", content: sensitive, intent: sensitive } });
  assert.equal(result.status, 200);
  assert.equal(result.body.decision, "REVIEW");
  assert.equal(result.body.reason_code, "ENFORCEMENT_NOT_ENABLED");
  assert.equal(result.body.executable, false);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].policies.map(p => p.id), loadPolicyCatalog().policies.map(p => p.id));
  const sent = JSON.stringify(requests[0]);
  assert.equal(sent.includes(sensitive), false);
  assert.equal(sent.includes("note.md"), false);
  const logged = readFileSync(journal, "utf8");
  assert.equal(logged.includes(sensitive), false);
  assert.equal(logged.includes(token), false);
  assert.equal(logged.includes("note.md"), false);
  const event = JSON.parse(logged);
  assert.equal(event.request_id, result.body.request_id);
  assert.equal(event.confidence, 0.95);
  assert.match(event.policy_revision, /^[a-f0-9]{64}$/);
  assert.equal(statSync(journal).mode & 0o777, 0o600);
});

test("provider outage and invalid decisions fail closed without reflecting errors", async t => {
  for (const decide of [async () => { throw new Error(sensitive); }, async () => ({ decision: sensitive }), async () => ({ decision: "ALLOW", confidence: 2 })]) {
    const { evaluator, journal } = fixture(t, { decide });
    const result = await evaluator.evaluate({ tool: "read", arguments: { path: "note.md" } });
    assert.equal(result.status, 503);
    assert.equal(result.body.decision, "ESCALATE");
    assert.equal(JSON.stringify(result).includes(sensitive), false);
    assert.equal(readFileSync(journal, "utf8").includes(sensitive), false);
  }
});

test("missing policies or changed catalog invariants refuse initialization", t => {
  const { root } = fixture(t);
  assert.throws(() => loadPolicyCatalog(root));
  for (const policy of loadPolicyCatalog().policies) {
    writeFileSync(path.join(root, `${policy.id.slice(7)}.yaml`), policy.description);
  }
  assert.equal(loadPolicyCatalog(root).revision, loadPolicyCatalog().revision);
  const filename = path.join(root, "secrets.yaml");
  writeFileSync(filename, readFileSync(filename, "utf8").replace("effect: deny", "effect: allow"));
  assert.throws(() => loadPolicyCatalog(root), /INVALID_POLICY_CATALOG/);
});

test("audit exhaustion, weak permissions and symlinks cannot produce successful evaluations", async t => {
  const { evaluator, journal } = fixture(t);
  const call = { tool: "message", arguments: { action: "send", message: sensitive } };
  await evaluator.evaluate(call);
  await evaluator.evaluate(call);
  await evaluator.evaluate(call);
  const prior = readFileSync(journal);
  const limited = createTrustedEvaluator({ token, audit: createAuditWriter(journal, { maxBytes: prior.length }) });
  assert.equal((await limited.evaluate(call)).body.reason_code, "AUDIT_UNAVAILABLE");
  assert.deepEqual(readFileSync(journal), prior);
  chmodSync(journal, 0o644);
  assert.equal((await evaluator.evaluate(call)).status, 503);
  chmodSync(journal, 0o600);
  const linked = `${journal}.link`;
  symlinkSync(journal, linked);
  const writer = createAuditWriter(linked);
  assert.throws(() => writer({ test: true }));
  assert.deepEqual(readFileSync(journal), prior);
});


test("known source templates and the kernel secret policy are readable without granting broad exceptions", async t => {
  const { evaluator, workspace } = fixture(t);
  mkdirSync(path.join(workspace, "policies/kernel"), { recursive: true });
  mkdirSync(path.join(workspace, "src"));
  for (const file of [".env.example", "policies/kernel/secrets.yaml", "src/secret-scanner.js"]) {
    writeFileSync(path.join(workspace, file), "public synthetic source");
    const result = await evaluator.evaluate({ tool: "read", arguments: { path: file } });
    assert.equal(result.body.reason_code, "ENFORCEMENT_NOT_ENABLED", file);
  }
  assert.equal((await evaluator.evaluate({ tool: "write", arguments: { path: "policies/kernel/secrets.yaml" } })).body.decision, "REQUIRE_HUMAN");
  for (const file of ["policies/credentials.json", "secrets.example.yaml", ".env.sample", "decision-token"]) {
    assert.equal((await evaluator.evaluate({ tool: "read", arguments: { path: file } })).body.decision, "DENY", file);
  }
  // An exempt template name must not hide a symlink to an actual credential.
  rmSync(path.join(workspace, ".env.example"));
  symlinkSync(path.join(workspace, ".env"), path.join(workspace, ".env.example"));
  assert.equal((await evaluator.evaluate({ tool: "read", arguments: { path: ".env.example" } })).body.decision, "DENY");
});
