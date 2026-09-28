import test from "node:test";
import assert from "node:assert/strict";
import { routeWithGateway } from "../client.js";

test("routes request to the local decision gateway", async () => {
  const result = await routeWithGateway("Research a career opportunity", "http://127.0.0.1:4310", async (url, options) => {
    assert.equal(url.href, "http://127.0.0.1:4310/v1/route");
    assert.deepEqual(JSON.parse(options.body), { text: "Research a career opportunity" });
    return { ok: true, json: async () => ({ status: "ROUTED", manager: "career" }) };
  });
  assert.equal(result.manager, "career");
});

test("rejects malformed routing response", async () => {
  await assert.rejects(routeWithGateway("x", "http://127.0.0.1:4310", async () => ({ ok: true, json: async () => ({ status: "ROUTED", manager: "payments" }) })), { code: "GATEWAY_INVALID_RESPONSE" });
});

test("distinguishes local transport failures from upstream HTTP errors", async () => {
  await assert.rejects(routeWithGateway("x", "http://127.0.0.1:4310", async () => { throw new Error("network"); }), { code: "GATEWAY_NETWORK_ERROR" });
  await assert.rejects(routeWithGateway("x", "http://127.0.0.1:4310", async () => ({ ok: false, status: 503 })), { code: "GATEWAY_HTTP_503" });
});

test("never sends an unauthenticated routing request to a remote host", async () => {
  await assert.rejects(routeWithGateway("x", "https://example.com", async () => { throw new Error("should not fetch"); }), /local loopback/);
});
