import { validateRoutingMetadata } from "../../../services/jev-gateway/src/routing-metadata.js";
import { readDecisionToken } from "../../../services/jev-gateway/src/runtime-token.js";

export class GatewayClientError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export async function routeWithGateway(input, gatewayUrl, { token = readDecisionToken(), fetchImpl = fetch } = {}) {
  const base = new URL(gatewayUrl);
  if (base.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(base.hostname) ||
      base.username || base.password || base.search || base.hash || base.pathname !== "/") throw new Error("Gateway must be local loopback");
  if (typeof token !== "string" || token.length < 32 || /\s/.test(token)) throw new GatewayClientError("GATEWAY_AUTH_MISSING");
  let metadata;
  try { metadata = validateRoutingMetadata(input); }
  catch { throw new GatewayClientError("ROUTING_METADATA_REQUIRED"); }
  const url = new URL("/v1/route", base);
  // Jev can take up to 30s when JEV_TIMEOUT_MS is configured; the local client
  // must not cancel an in-flight request before the Gateway's own deadline.
  const signal = AbortSignal.timeout(35_000);
  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST", redirect: "error",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ metadata }),
      signal
    });
  } catch {
    throw new GatewayClientError(signal.aborted ? "GATEWAY_TIMEOUT" : "GATEWAY_NETWORK_ERROR");
  }
  if (!response.ok) throw new GatewayClientError(`GATEWAY_HTTP_${response.status}`);
  let result;
  try { result = await response.json(); }
  catch { throw new GatewayClientError("GATEWAY_INVALID_JSON"); }
  if (!["REVIEW", "ROUTED"].includes(result?.status) ||
      (result.status === "ROUTED" && !["business", "career", "finance", "knowledge", "engineering", "system"].includes(result.manager))) {
    throw new GatewayClientError("GATEWAY_INVALID_RESPONSE");
  }
  return Object.fromEntries(["status", "manager", "manager_confidence", "urgency", "needs_details_probability", "provider"].filter(key => Object.hasOwn(result, key)).map(key => [key, result[key]]));
}
