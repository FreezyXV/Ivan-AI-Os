import test from "node:test";
import assert from "node:assert/strict";
import { routeRequest, routeByTable, TASK_MANAGER } from "../src/routing.js";
import { ROUTING_TASKS } from "../src/routing-metadata.js";
import { ROUTING_CALIBRATION } from "../src/calibration.js";
import { ROUTING_HOLDOUT } from "../src/routing-holdout.js";

function withEnv(values, run) {
  const old = Object.fromEntries(Object.keys(values).map(k => [k, process.env[k]]));
  const fetch = globalThis.fetch;
  Object.assign(process.env, values);
  globalThis.fetch = async () => { throw new Error("NETWORK_FORBIDDEN_IN_TABLE_MODE"); };
  return Promise.resolve(run()).finally(() => {
    globalThis.fetch = fetch;
    for (const [k, v] of Object.entries(old)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  });
}

test("the table covers every enumerated task label exactly once", () => {
  assert.deepEqual(Object.keys(TASK_MANAGER).sort(), [...ROUTING_TASKS].sort());
});

test("table routing matches both reviewed calibration corpora without any provider call", async () => {
  await withEnv({ JEV_ROUTING_MODE: "table", JEV_PROVIDER: "jev" }, async () => {
    for (const corpus of [ROUTING_CALIBRATION, ROUTING_HOLDOUT]) {
      for (const item of corpus) {
        const result = await routeRequest(item.metadata);
        assert.equal(result.manager, item.expected.manager, item.id);
        assert.equal(result.provider, "table");
      }
    }
  });
});

test("urgency and details come from the declared metadata; vague system requests still go to Ivan", () => {
  assert.deepEqual(routeByTable({ requested_tasks: ["bug_fix"], urgency: "immediate", details_available: false }),
    { status: "ROUTED", manager: "engineering", manager_confidence: 1, urgency: 2, needs_details_probability: 1, provider: "table" });
  assert.equal(routeByTable({ requested_tasks: ["other"], urgency: "none", details_available: false }).status, "REVIEW");
  assert.equal(routeByTable({ requested_tasks: ["other"], urgency: "none", details_available: true }).status, "ROUTED");
  assert.equal(routeByTable({ requested_tasks: ["portfolio_review", "unit_test"], urgency: "none", details_available: false }).manager, "finance");
});

test("default mode is unchanged: without JEV_ROUTING_MODE=table, mock stays REVIEW", async () => {
  await withEnv({ JEV_ROUTING_MODE: "", JEV_PROVIDER: "mock" }, async () => {
    assert.equal((await routeRequest({ requested_tasks: ["unit_test"], urgency: "none", details_available: true })).provider, "mock");
  });
});
