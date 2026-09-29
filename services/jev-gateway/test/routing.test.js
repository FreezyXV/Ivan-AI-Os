import test from "node:test";
import assert from "node:assert/strict";
import { routeRequest } from "../src/routing.js";
import { testBudget } from "./helpers.js";
import { PRICED_MODEL } from "../src/budget.js";

const metadata = { requested_tasks: ["job_search"], urgency: "soon", details_available: true };

test("mock mode does not launch an agent", async () => {
  const old = process.env.JEV_PROVIDER;
  process.env.JEV_PROVIDER = "mock";
  try { assert.equal((await routeRequest(metadata)).status, "REVIEW"); }
  finally { if (old === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = old; }
});

test("one TypeSafe call batches Choice, Noul and Score using only allowed metadata", async t => {
  const { budget } = testBudget(t);
  const old = { provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY, fetch: globalThis.fetch };
  process.env.JEV_PROVIDER = "jev";
  process.env.TYPESAFE_API_KEY = "test-key";
  let request;
  globalThis.fetch = async (_, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ model: PRICED_MODEL, usage: { input_tokens: 300 }, answers: {
      manager: { type: "choice", choice: "career", confidence: 0.91 },
      needs_details: { type: "noul", noul: 0.05 },
      urgency: { type: "score", score: 1.2 }
    } }) };
  };
  try {
    const result = await routeRequest(metadata, { budget });
    assert.deepEqual([result.status, result.manager], ["ROUTED", "career"]);
    assert.deepEqual(Object.keys(request.questions).sort(), ["manager", "needs_details", "urgency"]);
    assert.deepEqual(Object.values(request.questions).map((q) => q.type), ["choice", "noul", "score"]);
    assert.deepEqual(request.state, metadata);
    assert.equal(budget.status().calls, 1);
    assert.equal(budget.status().charged_micro_eur, 13);
  } finally {
    globalThis.fetch = old.fetch;
    if (old.provider === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = old.provider;
    if (old.key === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = old.key;
  }
});

test("missing function details do not block a clear engineering assignment", async t => {
  const { budget } = testBudget(t);
  const saved = { provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY, fetch: globalThis.fetch };
  process.env.JEV_PROVIDER = "jev";
  process.env.TYPESAFE_API_KEY = "test-key";
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ model: PRICED_MODEL, usage: { input_tokens: 300 }, answers: {
    manager: { type: "choice", choice: "engineering", confidence: 0.91 },
    needs_details: { type: "noul", noul: 0.88 },
    urgency: { type: "score", score: 0 }
  } }) });
  try {
    const result = await routeRequest({ requested_tasks: ["unit_test"], urgency: "none", details_available: false }, { budget });
    assert.equal(result.status, "ROUTED");
    assert.equal(result.manager, "engineering");
    assert.equal(result.needs_details_probability, 0.88);
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.provider === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = saved.provider;
    if (saved.key === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = saved.key;
  }
});

test("private prose, extra fields, unknown labels and accessor payloads are rejected before provider calls", async () => {
  let getterCalled = false;
  const accessor = Object.defineProperty({}, "requested_tasks", { enumerable: true, get() { getterCalled = true; return ["unit_test"]; } });
  for (const input of ["private-text-fixture", { ...metadata, text: "private-text-fixture" }, { ...metadata, requested_tasks: ["private-text-fixture"] }, { ...metadata, requested_tasks: ["job_search", "job_search"] }, { ...metadata, urgency: "private-text-fixture" }, accessor]) {
    await assert.rejects(routeRequest(input), /ROUTING_METADATA_REQUIRED/);
  }
  assert.equal(getterCalled, false);
});
