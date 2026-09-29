import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGatewayServer } from "../../../services/jev-gateway/src/server.js";
import { createTrustedEvaluator } from "../../../services/jev-gateway/src/trusted-evaluator.js";
import { canonicalPath, gatewayEndpoint, hookOutput, run, toToolCall } from "../pre-tool-use.mjs";

const token = "synthetic-claude-hook-test-token-not-a-credential";
const secret = "synthetic-file-content-must-not-leave-claude";

async function gateway(t) {
  const workspace = mkdtempSync(path.join(tmpdir(), "ivan-claude-hook-"));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  mkdirSync(path.join(workspace, "hooks"));
  writeFileSync(path.join(workspace, "note.md"), "ordinary");
  const audit = [], bodies = [];
  let providerCalls = 0;
  const trustedEvaluator = createTrustedEvaluator({
    token, workspaceRoot: workspace, audit: e => audit.push(e),
    decide: async () => { providerCalls++; return { decision: "ALLOW", confidence: 0.99, provider: "mock" }; }
  });
  const server = createGatewayServer({ trustedEvaluator });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const env = mode => ({ IVAN_DECISION_TOKEN: token, IVAN_GATEWAY_URL: `http://127.0.0.1:${server.address().port}`, ...(mode ? { IVAN_CLAUDE_HOOK_MODE: mode } : {}) });
  const fetchImpl = async (url, options) => { bodies.push(options.body); return fetch(url, options); };
  return { workspace, audit, bodies, env, fetchImpl, providerCalls: () => providerCalls };
}

const input = (tool_name, tool_input) => ({ hook_event_name: "PreToolUse", tool_name, tool_input });

test("maps only mutating tools and never forwards file contents", () => {
  assert.deepEqual(toToolCall(input("Write", { file_path: "/w/a.md", content: secret })), { tool: "write", arguments: { path: "/w/a.md" } });
  assert.deepEqual(toToolCall(input("Edit", { file_path: "a.md", old_string: secret, new_string: secret })), { tool: "edit", arguments: { path: "a.md" } });
  assert.deepEqual(toToolCall(input("NotebookEdit", { notebook_path: "n.ipynb", new_source: secret })), { tool: "edit", arguments: { path: "n.ipynb" } });
  assert.deepEqual(toToolCall(input("Bash", { command: "npm test" })), { tool: "exec", arguments: { command: "npm test" } });
  for (const other of [input("Read", { file_path: "a.md" }), input("Grep", { pattern: "x" }), input("Write", {}), {}]) assert.equal(toToolCall(other), null);
});

test("absolute paths through a symlinked prefix are canonicalized before evaluation", t => {
  const dir = mkdtempSync(path.join(tmpdir(), "ivan-alias-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const real = realpathSync(dir);
  assert.equal(canonicalPath(path.join(dir, "missing", "file.js")), path.join(real, "missing", "file.js"));
  assert.equal(canonicalPath("relative/file.js"), "relative/file.js");
});

test("shadow mode evaluates through the real gateway but never influences Claude Code", async t => {
  const g = await gateway(t);
  assert.equal(await run(input("Write", { file_path: path.join(g.workspace, "hooks", "new.js"), content: secret }), { env: g.env(), fetchImpl: g.fetchImpl }), null);
  assert.equal(await run(input("Bash", { command: "rm -rf build" }), { env: g.env(), fetchImpl: g.fetchImpl }), null);
  assert.deepEqual(g.audit.map(e => e.decision), ["REQUIRE_HUMAN", "REQUIRE_HUMAN"]);
  assert.equal(g.bodies.join("").includes(secret), false);
  assert.equal(JSON.stringify(g.audit).includes("rm -rf"), false);
});

test("ask mode asks Ivan on protected or risky calls and stays silent otherwise; never allows", async t => {
  const g = await gateway(t);
  const ask = await run(input("Write", { file_path: path.join(g.workspace, "hooks", "new.js"), content: secret }), { env: g.env("ask"), fetchImpl: g.fetchImpl });
  assert.equal(ask.hookSpecificOutput.permissionDecision, "ask");
  assert.match(ask.hookSpecificOutput.permissionDecisionReason, /REQUIRE_HUMAN — PROTECTED_PROJECT_METADATA/);
  assert.equal((await run(input("Bash", { command: "npm test" }), { env: g.env("ask"), fetchImpl: g.fetchImpl })).hookSpecificOutput.permissionDecision, "ask");
  // Provider ALLOW is downgraded to REVIEW by the gateway: no prompt, and still no "allow".
  assert.equal(await run(input("Edit", { file_path: path.join(g.workspace, "note.md") }), { env: g.env("ask"), fetchImpl: g.fetchImpl }), null);
  assert.equal(g.providerCalls(), 1);
  assert.equal(hookOutput({ decision: "ALLOW" }, "ask"), null);
});

test("missing token, wrong token, unreachable or non-loopback gateway leave Claude Code unaffected", async t => {
  const g = await gateway(t);
  const call = input("Bash", { command: "ls" });
  let requests = 0;
  const counting = async (...args) => { requests++; return fetch(...args); };
  assert.equal(await run(call, { env: { ...g.env("ask"), IVAN_DECISION_TOKEN: undefined, IVAN_DECISION_TOKEN_FILE: "/nonexistent/decision-token" }, fetchImpl: counting }), null);
  assert.equal(requests, 0);
  assert.equal(await run(call, { env: { ...g.env("ask"), IVAN_DECISION_TOKEN: `${token}-wrong` } }), null);
  assert.equal(await run(call, { env: { ...g.env("ask"), IVAN_GATEWAY_URL: "http://127.0.0.1:1" } }), null);
  for (const url of ["http://example.com", "http://localhost:4310", "https://127.0.0.1", "http://127.0.0.1/v1"]) {
    assert.throws(() => gatewayEndpoint(url), /GATEWAY_MUST_BE_LOOPBACK/);
    assert.equal(await run(call, { env: { ...g.env("ask"), IVAN_GATEWAY_URL: url }, fetchImpl: counting }), null);
  }
  assert.equal(requests, 0);
});

test("command-line hook reads stdin, prints only a hook decision and always exits 0", async t => {
  const g = await gateway(t);
  const script = fileURLToPath(new URL("../pre-tool-use.mjs", import.meta.url));
  const exec = (payload, env) => new Promise(resolve => {
    // Async spawn: the in-process gateway must keep serving while the hook waits.
    import("node:child_process").then(({ spawn }) => {
      const child = spawn(process.execPath, [script], { env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env } });
      let stdout = "";
      child.stdout.on("data", d => { stdout += d; });
      child.on("close", status => resolve({ status, stdout }));
      child.stdin.end(payload);
    });
  });
  const asked = await exec(JSON.stringify(input("Bash", { command: "npm test" })), g.env("ask"));
  assert.equal(asked.status, 0);
  assert.equal(JSON.parse(asked.stdout).hookSpecificOutput.permissionDecision, "ask");
  const shadow = await exec(JSON.stringify(input("Bash", { command: "npm test" })), g.env());
  assert.deepEqual([shadow.status, shadow.stdout], [0, ""]);
  const garbage = await exec("not json", g.env("ask"));
  assert.deepEqual([garbage.status, garbage.stdout], [0, ""]);
  assert.equal(spawnSync(process.execPath, ["--check", script]).status, 0);
});
