import http from "node:http";
import { performance } from "node:perf_hooks";
import { evaluateKernel } from "./kernel.js";
import { decideWithProvider } from "./provider.js";

const port = Number(process.env.PORT || 4310);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true, service: "jev-gateway" });

  if (req.method === "POST" && req.url === "/v1/decide") {
    const started = performance.now();
    try {
      const payload = await readJson(req);
      const action = payload.action || {};
      const policies = Array.isArray(payload.policies) ? payload.policies : [];

      const kernel = evaluateKernel(action);
      const result = kernel || await decideWithProvider({ action, policies });
      result.latency_ms = Math.round(performance.now() - started);
      return json(res, 200, result);
    } catch (error) {
      return json(res, 503, {
        decision: "ESCALATE",
        confidence: 1,
        reasons: [error instanceof Error ? error.message : "Decision gateway failure"],
        policies: [],
        provider: "gateway",
        fallback_used: true,
        latency_ms: Math.round(performance.now() - started)
      });
    }
  }

  return json(res, 404, { error: "not_found" });
});

server.listen(port, "0.0.0.0", () => console.log(`jev-gateway listening on :${port}`));

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Request too large");
  }
  return body ? JSON.parse(body) : {};
}
