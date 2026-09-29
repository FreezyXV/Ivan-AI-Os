import test from "node:test";
import assert from "node:assert/strict";
import { createEvaluationClient } from "../client.js";

const token = "synthetic-client-test-key-no-real-credential";
const valid = { decision: "REVIEW", advisory: true, executable: false, request_id: "00000000-0000-4000-8000-000000000001", action_binding: "a".repeat(64), policy_revision: "b".repeat(64) };

test("client keeps credentials on numeric loopback, disables redirects and strips response prose", async () => {
  let request;
  const evaluate = createEvaluationClient({ token, gatewayUrl: "http://127.0.0.1:4311", fetchImpl: async (url, options) => {
    request = { url: String(url), options };
    return Response.json({ ...valid, untrusted: "private-provider-prose" });
  } });
  const result = await evaluate('{"tool":"read","arguments":{}}');
  assert.equal(request.url, "http://127.0.0.1:4311/v1/evaluate-tool");
  assert.equal(request.options.redirect, "error");
  assert.equal(request.options.headers.authorization, `Bearer ${token}`);
  assert.equal(JSON.stringify(result).includes("private-provider-prose"), false);
  for (const gatewayUrl of ["http://example.com", "http://localhost:4310", "https://127.0.0.1", "http://127.0.0.1/path", "http://user:pass@127.0.0.1", "http://127.0.0.1?key=private", "invalid"]) {
    assert.throws(() => createEvaluationClient({ token, gatewayUrl }), /INVALID_OBSERVER_CONFIG/);
  }
});

test("transport refuses ALLOW, malformed or oversized responses and non-200 errors", async () => {
  for (const makeResponse of [
    () => Response.json({ ...valid, decision: "ALLOW" }),
    () => Response.json({ ...valid, executable: true }),
    () => Response.json({ ...valid, action_binding: "wrong" }),
    () => new Response("private-error", { status: 503 }),
    () => new Response("bad json"), () => new Response("x".repeat(16_001))
  ]) {
    const evaluate = createEvaluationClient({ token, gatewayUrl: "http://127.0.0.1", fetchImpl: async () => makeResponse() });
    await assert.rejects(evaluate("{}"), /^Error: EVALUATION_UNAVAILABLE$/);
  }
});

test("client cancels its own timeout and propagates host cancellation", async () => {
  const waitForAbort = async (_url, { signal }) => {
    if (signal.aborted) throw signal.reason;
    return new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
  };
  const evaluate = createEvaluationClient({ token, gatewayUrl: "http://127.0.0.1", timeoutMs: 250, fetchImpl: waitForAbort });
  await assert.rejects(evaluate("{}"), /EVALUATION_UNAVAILABLE/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(evaluate("{}", controller.signal), /EVALUATION_UNAVAILABLE/);
});
