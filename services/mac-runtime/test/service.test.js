import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync, symlinkSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { once } from "node:events";
import { readPrivateSettings, validateSettings, serviceEnvironment, readKey, launchAgentPlist, startGateway } from "../src/service.js";
import { createJevBudget } from "../../jev-gateway/src/budget.js";

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "ivan-background-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const runtimeDirectory = path.join(root, "runtime"), releaseRoot = path.join(root, "release");
  for (const dir of [runtimeDirectory, releaseRoot]) mkdirSync(dir, { mode: 0o700 });
  writeFileSync(path.join(releaseRoot, "runtime-release.json"), JSON.stringify({ commit: "a".repeat(40) }));
  const keychainHelper = path.join(root, "helper"); writeFileSync(keychainHelper, "#!/bin/sh\nexit 1\n", { mode: 0o700 });
  const settings = { version: 1, releaseRoot, runtimeDirectory, workspaceRoot: root, keychainHelper,
    keychainAccount: "jev-gateway", port: 4311, usdToEurRate: 1, routingMode: "jev" };
  const filename = path.join(root, "settings.json");
  const save = value => writeFileSync(filename, JSON.stringify(value), { mode: 0o600 }); save(settings);
  return { root, settings, filename, save };
}
test("private settings refuse credential fields, broad modes, links and invalid routing", t => {
  const f = fixture(t); assert.equal(readPrivateSettings(f.filename).port, 4311);
  for (const change of [{ secret: "synthetic" }, { port: 80 }, { routingMode: "anything" }, { keychainAccount: "other-app" }, { runtimeDirectory: "relative" }]) {
    f.save({ ...f.settings, ...change }); assert.throws(() => readPrivateSettings(f.filename), /BACKGROUND_CONFIG_REFUSED/);
  }
  f.save(f.settings); chmodSync(f.filename, 0o644); assert.throws(() => readPrivateSettings(f.filename), /BACKGROUND_CONFIG_REFUSED/);
  chmodSync(f.filename, 0o600); symlinkSync(f.filename, path.join(f.root, "link"));
  assert.throws(() => readPrivateSettings(path.join(f.root, "link")));
  chmodSync(f.settings.runtimeDirectory, 0o755); assert.throws(() => validateSettings(f.settings), /BACKGROUND_CONFIG_REFUSED/);
});
test("service environment is closed; only the private pipe provides the provider key", t => {
  const f = fixture(t), env = serviceEnvironment(f.settings, "synthetic-key");
  assert.equal(env.HOST, "127.0.0.1"); assert.equal(env.JEV_MODEL, "jev-1.13.0");
  assert.equal(env.IVAN_DECISION_TOKEN, undefined); assert.equal(env.JEV_ROUTING_MODE, undefined);
  assert.equal(env.HTTPS_PROXY, undefined); assert.equal(env.PATH, undefined);
  assert.equal(serviceEnvironment({ ...f.settings, routingMode: "table" }, "synthetic-key").JEV_ROUTING_MODE, "table");
  assert.throws(() => serviceEnvironment(f.settings, "value\n"), /KEYCHAIN_UNAVAILABLE/);
});
test("helper failures never reflect stderr or credential values", t => {
  const f = fixture(t);
  writeFileSync(f.settings.keychainHelper, "#!/bin/sh\necho SYNTHETIC_PRIVATE_DETAIL >&2\nexit 1\n");
  assert.throws(() => readKey(f.settings), error => error.message === "KEYCHAIN_UNAVAILABLE" && !String(error).includes("PRIVATE_DETAIL"));
  writeFileSync(f.settings.keychainHelper, "#!/bin/sh\nprintf '%s' synthetic-key\n");
  assert.equal(readKey(f.settings), "synthetic-key");
});
test("launch agent arguments contain paths only and XML escapes literal metacharacters", () => {
  const plist = launchAgentPlist({ nodePath: "/bin/node", runnerPath: "/private/path & notes/run.mjs", settingsPath: "/private/<config>/settings.json" });
  assert.match(plist, /path &amp; notes/); assert.match(plist, /&lt;config&gt;/);
  assert.match(plist, /ThrottleInterval<\/key><integer>60/);
  for (const forbidden of ["TYPESAFE", "EnvironmentVariables", "Bearer", "decision-token"]) assert.ok(!plist.includes(forbidden));
  assert.throws(() => launchAgentPlist({ nodePath: "node", runnerPath: "/run", settingsPath: "/config" }));
});
test("background gateway is authenticated and restarts without resetting the shared ledger", async t => {
  const f = fixture(t), oldEnv = { ...process.env };
  t.after(() => { process.env = oldEnv; });
  const token = "t".repeat(40); writeFileSync(path.join(f.settings.runtimeDirectory, "decision-token"), token, { mode: 0o600 });
  const budget = createJevBudget({ filename: path.join(f.settings.runtimeDirectory, "jev-budget.json") });
  budget.reserve().complete(100); const initial = budget.status();
  const probe = net.createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const settings = { ...f.settings, port }, url = `http://127.0.0.1:${port}`;
  process.env.TYPESAFE_BASE_URL = "https://invalid.example"; process.env.IVAN_DECISION_TOKEN = "poison";
  let server;
  try {
    server = await startGateway(settings, "synthetic-key");
    // Do not reuse undici's old keep-alive socket across the deliberately stopped server.
    assert.equal((await fetch(url + "/health", { headers: { connection: "close" } })).status, 200);
    assert.equal((await fetch(url + "/v1/usage", { headers: { connection: "close" } })).status, 401);
    const options = { headers: { authorization: `Bearer ${token}`, connection: "close" } };
    const usage = await (await fetch(url + "/v1/usage", options)).json(); assert.equal(usage.calls, initial.calls);
    const opinion = await (await fetch(url + "/v1/evaluate-tool", { ...options, method: "POST", headers: { ...options.headers, "content-type": "application/json" }, body: JSON.stringify({ tool: "exec", arguments: { command: "SYNTHETIC_COMMAND" } }) })).json();
    assert.equal(opinion.decision, "REQUIRE_HUMAN"); assert.equal(opinion.executable, false);
    const audit = readFileSync(path.join(settings.runtimeDirectory, "evaluation.jsonl"), "utf8"); assert.ok(!audit.includes("SYNTHETIC_COMMAND"));
    assert.equal(process.env.TYPESAFE_BASE_URL, undefined); assert.equal(process.env.IVAN_DECISION_TOKEN, undefined);
    await new Promise(resolve => server.close(resolve)); server = await startGateway(settings, "synthetic-key");
    const resumed = await (await fetch(url + "/v1/usage", options)).json(); assert.equal(resumed.calls, initial.calls);
    assert.equal(resumed.charged_micro_eur, initial.charged_micro_eur);
  } finally { if (server) await new Promise(resolve => server.close(resolve)); }
});
test("missing token prevents a partially authenticated background gateway", async t => {
  const f = fixture(t), oldEnv = { ...process.env }; t.after(() => { process.env = oldEnv; });
  await assert.rejects(startGateway(f.settings, "synthetic-key"), /DECISION_TOKEN_REQUIRED/);
});
