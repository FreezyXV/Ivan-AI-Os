import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as service from "../src/service.js";

test("temporary Keychain outage retries in one runner and recovers without logging the key", async () => {
  const waits = [], reports = [];
  let reads = 0;
  const key = await service.waitForKey({}, {
    reader: () => { if (++reads < 3) throw new Error("KEYCHAIN_UNAVAILABLE"); return "synthetic-key"; },
    pause: async ms => { waits.push(ms); },
    report: report => { reports.push(report); }
  });
  assert.equal(key, "synthetic-key");
  assert.equal(reads, 3);
  assert.deepEqual(waits, [5000, 15000]);
  assert.ok(reports.every(r => r.state === "WAITING_KEYCHAIN"));
  assert.ok(!JSON.stringify(reports).includes("synthetic-key"));
});

test("shutdown interrupts Keychain retry and long outages are rate limited", async () => {
  const controller = new AbortController(), waits = [];
  await assert.rejects(service.waitForKey({}, {
    signal: controller.signal,
    reader: () => { throw new Error("KEYCHAIN_UNAVAILABLE"); },
    report: () => {},
    pause: async ms => { waits.push(ms); if (waits.length === 4) controller.abort(); }
  }), error => error.name === "AbortError");
  assert.deepEqual(waits, [5000, 15000, 60000, 60000]);
});

test("latest status is bounded, private and accepts no secret or raw error fields", () => {
  const runtimeDirectory = mkdtempSync(path.join(tmpdir(), "ivan-runtime-status-"));
  const settings = { runtimeDirectory };
  try {
    service.writeRuntimeStatus(settings, { state: "WAITING_KEYCHAIN", attempts: 1, retryAfterSeconds: 5 });
    service.writeRuntimeStatus(settings, { state: "BACKGROUND_GATEWAY_READY", attempts: 0, retryAfterSeconds: 0 });
    const report = service.readRuntimeStatus(settings);
    assert.equal(report.state, "BACKGROUND_GATEWAY_READY");
    const file = path.join(runtimeDirectory, "background-status.json"), before = readFileSync(file);
    assert.equal(statSync(file).mode & 0o077, 0);
    assert.ok(before.length < 1024);
    assert.throws(() => service.writeRuntimeStatus(settings, {
      state: "BACKGROUND_GATEWAY_UNAVAILABLE", attempts: 0, retryAfterSeconds: 0, key: "synthetic-private"
    }), /STATUS_REFUSED/);
    assert.deepEqual(readFileSync(file), before);
  } finally { rmSync(runtimeDirectory, { recursive: true, force: true }); }
});
