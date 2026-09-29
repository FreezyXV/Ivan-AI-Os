import test from "node:test";
import assert from "node:assert/strict";
import { routeWithGateway } from "../client.js";

const metadata = { requested_tasks: ["job_search"], urgency: "none", details_available: true };
const token = "synthetic-client-fixture-token-for-tests";

test("authenticated route sends only enumerated metadata and strips extra response fields", async () => {
  const result = await routeWithGateway(metadata, "http://127.0.0.1:4310", { token, fetchImpl: async (url, options) => {
    assert.equal(url.href, "http://127.0.0.1:4310/v1/route");
    assert.deepEqual(JSON.parse(options.body), { metadata });
    assert.equal(options.headers.authorization, `Bearer ${token}`);
    assert.equal(options.redirect, "error");
    return { ok: true, json: async () => ({ status: "ROUTED", manager: "career", private_extra: "must-not-return" }) };
  } });
  assert.equal(result.manager, "career");
  assert.equal(Object.hasOwn(result, "private_extra"), false);
});

test("rejects malformed routing response", async () => {
  await assert.rejects(routeWithGateway(metadata, "http://127.0.0.1:4310", { token, fetchImpl: async () => ({ ok: true, json: async () => ({ status: "ROUTED", manager: "payments" }) }) }), { code: "GATEWAY_INVALID_RESPONSE" });
});

test("distinguishes local transport failures from upstream HTTP errors", async () => {
  await assert.rejects(routeWithGateway(metadata, "http://127.0.0.1:4310", { token, fetchImpl: async () => { throw new Error("network"); } }), { code: "GATEWAY_NETWORK_ERROR" });
  await assert.rejects(routeWithGateway(metadata, "http://127.0.0.1:4310", { token, fetchImpl: async () => ({ ok: false, status: 503 }) }), { code: "GATEWAY_HTTP_503" });
});

test("missing token, prose, remote hosts and DNS names cannot launch a routing request", async () => {
  const fetchImpl = async () => { assert.fail("must not fetch"); };
  for (const url of ["https://example.com", "http://localhost:4310", "http://127.0.0.1/path", "http://127.0.0.1?private=value"]) {
    await assert.rejects(routeWithGateway(metadata, url, { token, fetchImpl }), /local loopback/);
  }
  await assert.rejects(routeWithGateway(metadata, "http://127.0.0.1", { token: "", fetchImpl }), { code: "GATEWAY_AUTH_MISSING" });
  await assert.rejects(routeWithGateway("private-text-fixture", "http://127.0.0.1", { token, fetchImpl }), { code: "ROUTING_METADATA_REQUIRED" });
});
