import test from "node:test";
import assert from "node:assert/strict";
import { decideWithProvider } from "../src/provider.js";
import { testBudget } from "./helpers.js";
import { PRICED_MODEL } from "../src/budget.js";

const action = { intent: "Read a project status file", tool: "read_file", risk: "low", arguments: { secret: "must-not-leak" } };
const policies = [{ id: "read-only", description: "Read local project files." }];

async function withProvider(t, answer, callback) {
  const { budget } = testBudget(t);
  const saved = { fetch: globalThis.fetch, provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY, model: process.env.JEV_MODEL };
  let request;
  process.env.JEV_PROVIDER = "jev";
  process.env.TYPESAFE_API_KEY = "test-key";
  process.env.JEV_MODEL = PRICED_MODEL;
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ model: PRICED_MODEL, usage: { input_tokens: 300 }, answers: { permission: answer } }) };
  };
  try { await callback(() => request, input => decideWithProvider(input, { budget })); }
  finally {
    globalThis.fetch = saved.fetch;
    if (saved.provider === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = saved.provider;
    if (saved.key === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = saved.key;
    if (saved.model === undefined) delete process.env.JEV_MODEL; else process.env.JEV_MODEL = saved.model;
  }
}

const choice = (selected, confidence, probabilities) => ({ type: "choice", choice: selected, confidence, probabilities });

test("uses official System One question/answer shape and omits tool arguments", async t => {
  await withProvider(t, choice("ALLOW", 0.93, { ALLOW: 0.94, REVIEW: 0.04, DENY: 0.02 }), async (getRequest, decide) => {
    const result = await decide({ action, policies });
    assert.equal(result.decision, "ALLOW");
    const { url, options, body } = getRequest();
    assert.equal(url, "https://api.typesafe.ai/v1/systemone");
    assert.equal(options.headers.authorization, "Bearer test-key");
    assert.equal(body.model, PRICED_MODEL);
    assert.equal(body.questions.permission.type, "choice");
    assert.equal(JSON.stringify(body).includes("must-not-leak"), false);
    assert.deepEqual(body.state.policies, policies);
  });
});

test("low-confidence allow and invalid response fail closed", async t => {
  await withProvider(t, choice("ALLOW", 0.5, { ALLOW: 0.91, REVIEW: 0.07, DENY: 0.02 }), async (_, decide) => {
    assert.equal((await decide({ action, policies })).decision, "REVIEW");
  });
  await withProvider(t, { type: "choice", choice: "ALLOW" }, async (_, decide) => {
    await assert.rejects(decide({ action, policies }), /Invalid TypeSafe probability/);
  });
});

test("an empty policy set and mock mode never authorize", async () => {
  assert.equal((await decideWithProvider({ action, policies: [] })).decision, "REVIEW");
  const saved = process.env.JEV_PROVIDER;
  process.env.JEV_PROVIDER = "mock";
  try { assert.equal((await decideWithProvider({ action, policies })).decision, "REVIEW"); }
  finally { if (saved === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = saved; }
});

test("provider HTTP failures expose only a bounded diagnostic code", async t => {
  await withProvider(t, {}, async (_, decide) => {
    globalThis.fetch = async () => ({ ok: false, status: 422 });
    await assert.rejects(decide({ action, policies }), (error) => error.code === "TYPESAFE_HTTP_422");
  });
});
