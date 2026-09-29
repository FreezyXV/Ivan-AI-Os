import test from "node:test";
import assert from "node:assert/strict";
import { ROUTING_CALIBRATION, summarizeCalibration, validateCalibration } from "../src/calibration.js";
import { createGatewayServer } from "../src/server.js";
import { createTrustedEvaluator } from "../src/trusted-evaluator.js";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

test("partial, mock and unavailable predictions never masquerade as measured Jev accuracy", () => {
  const summary = summarizeCalibration([{ id: "unit_test", result: { provider: "mock", manager: "engineering" } }]);
  assert.equal(summary.measured, 0); assert.equal(summary.manager_accuracy, null); assert.equal(summary.coverage, 0);
  assert.equal(summary.unavailable, 19);
  assert.throws(() => summarizeCalibration([{ id: "unknown", result: {} }]), /INVALID_CALIBRATION_OBSERVATIONS/);
  assert.throws(() => summarizeCalibration([{ id: "unit_test" }, { id: "unit_test" }]), /INVALID_CALIBRATION_OBSERVATIONS/);
});
test("measured wrong and uncertain predictions remain visible rather than excluded", () => {
  const good = { provider: "jev", status: "ROUTED", manager: "engineering", manager_confidence: 0.95, needs_details_probability: 0.1, urgency: 0 };
  const summary = summarizeCalibration([
    { id: "unit_test", result: good },
    { id: "job_search", result: { ...good, manager: "business", status: "REVIEW", needs_details_probability: 0.9, urgency: 2 } }
  ]);
  assert.equal(summary.measured, 2); assert.equal(summary.manager_accuracy, 0.5);
  assert.equal(summary.review_rate, 0.5); assert.equal(summary.detail_matches, 2); assert.equal(summary.urgency_matches, 2);
  assert.deepEqual(summary.mismatches, ["job_search"]); assert.equal(summary.permission_granted, false);
  assert.equal(summarizeCalibration([{ id: "unit_test", result: { ...good, manager_confidence: Infinity } }]).measured, 0);
});
test("a calibration corpus with duplicated, missing or private inputs is refused", () => {
  assert.equal(validateCalibration().length, 19);
  assert.throws(() => validateCalibration(ROUTING_CALIBRATION.slice(1)), /INVALID_CALIBRATION_CORPUS/);
  assert.throws(() => validateCalibration([ROUTING_CALIBRATION[1], ...ROUTING_CALIBRATION.slice(1)]), /INVALID_CALIBRATION_CORPUS/);
  assert.throws(() => validateCalibration(ROUTING_CALIBRATION.map(c => ({ ...c, metadata: { ...c.metadata, private_note: "SYNTHETIC" } }))), /ROUTING_METADATA_REQUIRED/);
});

test("calibration CLI authenticates all synthetic cases through HTTP without a provider key", async t => {
  const token = "synthetic-calibration-token-for-tests-only";
  let calls = 0;
  const server = createGatewayServer({
    trustedEvaluator: createTrustedEvaluator({ token, audit() {} }),
    budget: { status: () => ({ month: "2026-09", estimate: true, charged_micro_eur: calls * 13 }) },
    route: metadata => {
      const item = ROUTING_CALIBRATION.find(c => c.id === metadata.requested_tasks[0]);
      assert.deepEqual(metadata, item.metadata); calls++;
      return { status: "ROUTED", provider: "jev", manager: item.expected.manager, manager_confidence: 0.99,
        needs_details_probability: metadata.details_available ? 0 : 1, urgency: ["none", "soon", "immediate"].indexOf(metadata.urgency) };
    }
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const child = spawn(process.execPath, [fileURLToPath(new URL("../../../scripts/calibrate-jev-routing.mjs", import.meta.url)), "--live"], {
    env: { PATH: process.env.PATH, HOME: process.env.HOME, IVAN_DECISION_TOKEN: token, IVAN_GATEWAY_URL: `http://127.0.0.1:${server.address().port}` }
  });
  let stdout = ""; child.stdout.on("data", chunk => { stdout += chunk; });
  const [status] = await once(child, "close");
  assert.equal(status, 0); assert.equal(calls, 19); assert.equal(stdout.includes(token), false);
  const result = JSON.parse(stdout);
  assert.equal(result.measured, 19); assert.equal(result.manager_accuracy, 1);
  assert.equal(result.estimated_gateway_charge_delta_eur, 247 / 1_000_000);
  // These are explicitly synthetic predictions, not a live Jev quality claim.
});
