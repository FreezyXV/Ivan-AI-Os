import test from "node:test";
import assert from "node:assert/strict";
import { routeRequest } from "../src/routing.js";

test("mock mode does not launch an agent", async () => {
  const old = process.env.JEV_PROVIDER;
  process.env.JEV_PROVIDER = "mock";
  try { assert.equal((await routeRequest("Find freelance BA missions")).status, "REVIEW"); }
  finally { if (old === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = old; }
});

test("one TypeSafe call batches Choice, Noul and Score", async () => {
  const old = { provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY, fetch: globalThis.fetch };
  process.env.JEV_PROVIDER = "jev";
  process.env.TYPESAFE_API_KEY = "test-key";
  let request;
  globalThis.fetch = async (_, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ answers: {
      manager: { type: "choice", choice: "career", confidence: 0.91 },
      needs_details: { type: "noul", noul: 0.05 },
      urgency: { type: "score", score: 1.2 }
    } }) };
  };
  try {
    const result = await routeRequest("Find freelance BA missions this week");
    assert.deepEqual([result.status, result.manager], ["ROUTED", "career"]);
    assert.deepEqual(Object.keys(request.questions).sort(), ["manager", "needs_details", "urgency"]);
    assert.deepEqual(Object.values(request.questions).map((q) => q.type), ["choice", "noul", "score"]);
  } finally {
    globalThis.fetch = old.fetch;
    if (old.provider === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = old.provider;
    if (old.key === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = old.key;
  }
});

test("missing function details do not block a clear engineering assignment", async () => {
  const saved = { provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY, fetch: globalThis.fetch };
  process.env.JEV_PROVIDER = "jev";
  process.env.TYPESAFE_API_KEY = "test-key";
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ answers: {
    manager: { type: "choice", choice: "engineering", confidence: 0.91 },
    needs_details: { type: "noul", noul: 0.88 },
    urgency: { type: "score", score: 0 }
  } }) });
  try {
    const result = await routeRequest("Write a test for a Node.js function in my project");
    assert.equal(result.status, "ROUTED");
    assert.equal(result.manager, "engineering");
    assert.equal(result.needs_details_probability, 0.88);
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.provider === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = saved.provider;
    if (saved.key === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = saved.key;
  }
});
