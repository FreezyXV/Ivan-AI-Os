import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ROUTING_CALIBRATION, validateCalibration, summarizeCalibration } from "../src/calibration.js";
import { ROUTING_HOLDOUT } from "../src/routing-holdout.js";
import { createGatewayServer } from "../src/server.js";
import { createTrustedEvaluator } from "../src/trusted-evaluator.js";
import { validateRoutingMetadata } from "../src/routing-metadata.js";

test("holdout is disjoint, covers all domains and exposes priority reversal", () => {
  assert.equal(validateCalibration(ROUTING_HOLDOUT, { holdout: true }).length, 19);
  assert.equal(new Set(ROUTING_HOLDOUT.map(c => c.expected.manager)).size, 6);
  const first = ROUTING_HOLDOUT[0], reverse = ROUTING_HOLDOUT[1];
  assert.deepEqual(first.metadata.requested_tasks, [...reverse.metadata.requested_tasks].reverse());
  assert.notEqual(first.expected.manager, reverse.expected.manager);
  assert.throws(() => validateCalibration([ROUTING_CALIBRATION[0], ...ROUTING_HOLDOUT.slice(1)], { holdout: true }), /HOLDOUT_OVERLAP_REFUSED/);
  assert.throws(() => validateCalibration([...ROUTING_HOLDOUT, { ...first, id: "different-id" }], { holdout: true }), /HOLDOUT_OVERLAP_REFUSED/);
  assert.throws(() => validateCalibration(ROUTING_HOLDOUT.map(c => ({ ...c, metadata: { ...c.metadata, text: "SYNTHETIC_PRIVATE" } })), { holdout: true }), /ROUTING_METADATA_REQUIRED/);
});
test("holdout failures and wrong priorities remain separate from training scores", () => {
  const result = { status: "ROUTED", provider: "jev", manager: "engineering", manager_confidence: 0.95, needs_details_probability: 1, urgency: 2 };
  const summary = summarizeCalibration(ROUTING_HOLDOUT.slice(0, 2).map(c => ({ id: c.id, result })), ROUTING_HOLDOUT, { holdout: true });
  assert.equal(summary.corpus, "holdout-v1");
  assert.equal(summary.manager_accuracy, 0.5);
  assert.equal(summary.unavailable, 17);
  assert.deepEqual(summary.mismatches, ["system-before-engineering"]);
  assert.equal(summary.permission_granted, false);
  assert.equal(summarizeCalibration([], ROUTING_HOLDOUT, { holdout: true }).manager_accuracy, null);
});
test("offline holdout and incompatible CLI options cannot start paid requests", () => {
  const cli = fileURLToPath(new URL("../../../scripts/calibrate-jev-routing.mjs", import.meta.url));
  const env = { PATH: process.env.PATH, HOME: process.env.HOME };
  const offline = spawnSync(process.execPath, [cli, "--holdout"], { env, encoding: "utf8" });
  assert.equal(offline.status, 0);
  assert.deepEqual(JSON.parse(offline.stdout), { corpus_valid: true, corpus: "holdout-v1", cases: 19, provider_calls: 0, measured_accuracy: null });
  for (const args of [["--live", "--dry-run"], ["--holdout", "--holdout"]]) {
    const rejected = spawnSync(process.execPath, [cli, ...args], { env, encoding: "utf8" });
    assert.equal(rejected.status, 1); assert.equal(rejected.stdout, ""); assert.equal(rejected.stderr.trim(), "CALIBRATION_REFUSED");
  }
});
test("holdout CLI sends only its independent cases through the authenticated gateway", async t => {
  const token = "synthetic-holdout-token-for-tests-only";
  const inputs = new Map(ROUTING_HOLDOUT.map(c => [JSON.stringify(validateRoutingMetadata(c.metadata)), c]));
  let calls = 0;
  const server = createGatewayServer({ trustedEvaluator: createTrustedEvaluator({ token, audit() {} }),
    budget: { status: () => ({ month: "2026-09", estimate: true, charged_micro_eur: calls * 13 }) },
    route: metadata => {
      const item = inputs.get(JSON.stringify(metadata)); assert.ok(item); calls++;
      return { status: "ROUTED", provider: "jev", manager: item.expected.manager, manager_confidence: 0.99,
        needs_details_probability: metadata.details_available ? 0 : 1, urgency: ["none", "soon", "immediate"].indexOf(metadata.urgency) };
    } });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const child = spawn(process.execPath, [fileURLToPath(new URL("../../../scripts/calibrate-jev-routing.mjs", import.meta.url)), "--holdout", "--live"], {
    env: { PATH: process.env.PATH, HOME: process.env.HOME, IVAN_DECISION_TOKEN: token, IVAN_GATEWAY_URL: `http://127.0.0.1:${server.address().port}` }
  });
  let stdout = ""; child.stdout.on("data", chunk => { stdout += chunk; });
  const [status] = await once(child, "close");
  assert.equal(status, 0); assert.equal(calls, 19); assert.equal(stdout.includes(token), false);
  const summary = JSON.parse(stdout);
  assert.equal(summary.corpus, "holdout-v1"); assert.equal(summary.coverage, 1);
  assert.equal(summary.estimated_gateway_charge_delta_eur, 247 / 1_000_000);
  // Responses are synthetic fixtures; this test measures transport, not Jev accuracy.
});
