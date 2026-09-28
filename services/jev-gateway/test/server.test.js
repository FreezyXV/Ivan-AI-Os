import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createGatewayServer } from "../src/server.js";
import { createTrustedEvaluator } from "../src/trusted-evaluator.js";

const token = "synthetic-http-auth-token-for-tests-only";

async function listen(t, options) {
  const server = createGatewayServer(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("new HTTP path is disabled by default while health remains available", async t => {
  const url = await listen(t);
  assert.equal((await fetch(`${url}/health`)).status, 200);
  const response = await fetch(`${url}/v1/evaluate-tool`, { method: "POST" });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).reason_code, "TRUSTED_EVALUATION_DISABLED");
});

test("HTTP authentication precedes evaluation; invalid requests are audited and closed", async t => {
  const audit = [];
  let providerCalls = 0;
  const trustedEvaluator = createTrustedEvaluator({ token, audit: event => audit.push(event), decide: async () => { providerCalls++; } });
  const url = await listen(t, { trustedEvaluator });
  const call = { tool: "message", arguments: { action: "send", message: "private-fixture" } };
  async function post(body, authorization) {
    const response = await fetch(`${url}/v1/evaluate-tool`, {
      method: "POST", headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) }, body
    });
    return { status: response.status, body: await response.json() };
  }
  for (const header of [undefined, "Bearer incorrect"]) assert.equal((await post(JSON.stringify(call), header)).status, 401);
  assert.equal(audit.length, 0);
  const result = await post(JSON.stringify(call), `Bearer ${token}`);
  assert.equal(result.status, 200);
  assert.equal(result.body.decision, "REQUIRE_HUMAN");
  assert.equal(audit.length, 1);
  for (const body of ["{bad", "null", JSON.stringify({ ...call, policies: [] })]) {
    const invalid = await post(body, `Bearer ${token}`);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.executable, false);
  }
  assert.equal(audit.length, 4);
  assert.equal(JSON.stringify(audit).includes("private-fixture"), false);
  assert.equal(providerCalls, 0);
});
