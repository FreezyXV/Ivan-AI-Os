const decisions = new Set(["REVIEW", "DENY", "REQUIRE_HUMAN", "ESCALATE"]);
const hex = /^[a-f0-9]{64}$/;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

export function createEvaluationClient({ gatewayUrl, token, timeoutMs = 3000, fetchImpl = fetch }) {
  let url;
  try { url = new URL(gatewayUrl); } catch { throw new Error("INVALID_OBSERVER_CONFIG"); }
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      typeof token !== "string" || token.length < 32 || /\s/.test(token) || !Number.isInteger(timeoutMs) || timeoutMs < 250 || timeoutMs > 10_000) throw new Error("INVALID_OBSERVER_CONFIG");
  const endpoint = new URL("/v1/evaluate-tool", url);
  return async (body, abortSignal) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const signal = abortSignal ? AbortSignal.any([controller.signal, abortSignal]) : controller.signal;
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST", redirect: "error", signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body
      });
      if (!response.ok) throw new Error("EVALUATION_UNAVAILABLE");
      // Bound the response even when Content-Length is absent or dishonest.
      const reader = response.body.getReader();
      const chunks = [];
      let bytes = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 16_000) throw new Error("EVALUATION_UNAVAILABLE");
          chunks.push(value);
        }
      } finally { await reader.cancel().catch(() => {}); }
      const result = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!decisions.has(result?.decision) || result.advisory !== true || result.executable !== false ||
          !uuid.test(result.request_id) || !hex.test(result.action_binding) || !hex.test(result.policy_revision)) throw new Error("EVALUATION_UNAVAILABLE");
      // No provider prose or extra response fields escape to the observer log.
      return { decision: result.decision, request_id: result.request_id, action_binding: result.action_binding, policy_revision: result.policy_revision };
    } catch { throw new Error("EVALUATION_UNAVAILABLE"); }
    finally { clearTimeout(timer); }
  };
}
