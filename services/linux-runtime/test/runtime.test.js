import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import net from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { gatewayEnvironment, readCredential } from "../runtime.mjs";
import { checkGateway } from "../health.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ivan-linux-runtime-"));
  const credentials = join(root, "credentials"), state = join(root, "state");
  mkdirSync(credentials, { mode: 0o700 });
  mkdirSync(state, { mode: 0o700 });
  writeFileSync(join(credentials, "decision-token"), "t".repeat(64), { mode: 0o600 });
  return { root, credentials, state };
}

test("loads systemd credentials, forces loopback and persistent private paths", () => {
  const f = fixture();
  try {
    writeFileSync(join(f.credentials, "typesafe.key"), "synthetic-test-key\n", { mode: 0o600 });
    const env = gatewayEnvironment({ CREDENTIALS_DIRECTORY: f.credentials,
      STATE_DIRECTORY: f.state, PORT: "4311", JEV_PROVIDER: "jev", HOST: "0.0.0.0" });
    assert.equal(env.HOST, "127.0.0.1");
    assert.equal(env.IVAN_DECISION_TOKEN, "t".repeat(64));
    assert.equal(env.TYPESAFE_API_KEY, "synthetic-test-key");
    assert.equal(env.IVAN_JEV_BUDGET_PATH, join(f.state, "jev-budget.json"));
    assert.equal(env.IVAN_AUDIT_PATH, join(f.state, "evaluation.jsonl"));
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("refuses missing real-provider credentials and linked credential files", () => {
  const f = fixture();
  try {
    assert.throws(() => gatewayEnvironment({ CREDENTIALS_DIRECTORY: f.credentials,
      STATE_DIRECTORY: f.state, JEV_PROVIDER: "jev" }), /CREDENTIALS_UNAVAILABLE/);
    symlinkSync(join(f.credentials, "decision-token"), join(f.credentials, "linked-token"));
    assert.throws(() => readCredential(f.credentials, "linked-token"), /CREDENTIALS_UNAVAILABLE/);
    assert.throws(() => gatewayEnvironment({ CREDENTIALS_DIRECTORY: f.credentials,
      STATE_DIRECTORY: f.state, JEV_PROVIDER: "unknown" }), /INVALID_PROVIDER/);
    const mock = gatewayEnvironment({ CREDENTIALS_DIRECTORY: f.credentials,
      STATE_DIRECTORY: f.state, JEV_PROVIDER: "mock", TYPESAFE_API_KEY: "inherited-key" });
    assert.equal(Object.hasOwn(mock, "TYPESAFE_API_KEY"), false);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("systemd unit uses credentials, private persistent state and authenticated readiness", () => {
  const unit = readFileSync(fileURLToPath(new URL("../ivan-jev-gateway.service", import.meta.url)), "utf8");
  for (const directive of ["LoadCredential=typesafe.key:", "LoadCredential=decision-token:",
    "StateDirectoryMode=0700", "ExecStartPost=/usr/bin/node", "Restart=on-failure",
    "ProtectSystem=strict"]) assert.ok(unit.includes(directive), directive);
  assert.ok(!unit.includes("TYPESAFE_API_KEY="));
  assert.ok(!unit.includes("IVAN_DECISION_TOKEN="));
});

test("mock daemon starts, passes authenticated budget health and stops cleanly", async () => {
  const f = fixture();
  const listener = net.createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL("../runtime.mjs", import.meta.url))], {
    env: { PATH: process.env.PATH, CREDENTIALS_DIRECTORY: f.credentials,
      STATE_DIRECTORY: f.state, PORT: String(port), JEV_PROVIDER: "mock" },
    stdio: "ignore"
  });
  try {
    assert.equal(await checkGateway({ credentials: f.credentials, port, provider: "mock",
      attempts: 30, pause: ms => new Promise(resolve => setTimeout(resolve, ms)) }), true);
    const denied = await fetch(`http://127.0.0.1:${port}/v1/usage`, { signal: AbortSignal.timeout(1000) });
    assert.equal(denied.status, 401);
  } finally {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      let timer;
      try {
        await Promise.race([once(child, "exit"), new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("CHILD_STOP_TIMEOUT")), 3000);
        })]);
      } finally { clearTimeout(timer); }
    }
    rmSync(f.root, { recursive: true, force: true });
  }
});
