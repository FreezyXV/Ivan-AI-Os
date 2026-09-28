import test from "node:test";
import assert from "node:assert/strict";
import { decideWithProvider } from "../src/provider.js";

const action = { intent: "Read a project status file", tool: "read_file", risk: "low", arguments: { secret: "must-not-leak" } };
const policies = [{ id: "read-only", description: "Read local project files." }];

async function withProvider(answer, callback) {
  const saved = { fetch: globalThis.fetch, provider: process.env.JEV_PROVIDER, key: process.env.TYPESAFE_API_KEY };
  let request;
  process.env.JEV_PROVIDER = "jev";
  process.env.TYPESAFE_API_KEY = "test-key";
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ answers: { permission: answer } }) };
  };
  try { await callback(() => request); }
  finally {
    globalThis.fetch = saved.fetch;
    if (saved.provider === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = saved.provider;
    if (saved.key === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = saved.key;
  }
}

const choice = (selected, confidence, probabilities) => ({ type: "choice", choice: selected, confidence, probabilities });

test("uses official System One question/answer shape and omits tool arguments", async () => {
  await withProvider(choice("ALLOW", 0.93, { ALLOW: 0.94, REVIEW: 0.04, DENY: 0.02 }), async (getRequest) => {
    const result = await decideWithProvider({ action, policies });
    assert.equal(result.decision, "ALLOW");
    const { url, options, body } = getRequest();
    assert.equal(url, "https://api.typesafe.ai/v1/systemone");
    assert.equal(options.headers.authorization, "Bearer test-key");
    assert.equal(body.model, "jev-latest");
    assert.equal(body.questions.permission.type, "choice");
    assert.equal(JSON.stringify(body).includes("must-not-leak"), false);
    assert.deepEqual(body.state.policies, policies);
  });
});

test("low-confidence allow and invalid response fail closed", async () => {
  await withProvider(choice("ALLOW", 0.5, { ALLOW: 0.91, REVIEW: 0.07, DENY: 0.02 }), async () => {
    assert.equal((await decideWithProvider({ action, policies })).decision, "REVIEW");
  });
  await withProvider({ type: "choice", choice: "ALLOW" }, async () => {
    await assert.rejects(decideWithProvider({ action, policies }), /Invalid TypeSafe probability/);
  });
});

test("an empty policy set and mock mode never authorize", async () => {
  assert.equal((await decideWithProvider({ action, policies: [] })).decision, "REVIEW");
  const saved = process.env.JEV_PROVIDER;
  process.env.JEV_PROVIDER = "mock";
  try { assert.equal((await decideWithProvider({ action, policies })).decision, "REVIEW"); }
  finally { if (saved === undefined) delete process.env.JEV_PROVIDER; else process.env.JEV_PROVIDER = saved; }
});
