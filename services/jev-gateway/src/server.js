import http from "node:http";
import { performance } from "node:perf_hooks";
import { evaluateKernel } from "./kernel.js";
import { decideWithProvider } from "./provider.js";
import { routeRequest } from "./routing.js";

const port = Number(process.env.PORT || 4310);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true, service: "jev-gateway", provider: process.env.JEV_PROVIDER || "mock" });

  if (req.method === "POST" && req.url === "/v1/route") {
    try {
      const payload = await readJson(req);
      if (typeof payload?.text !== "string" || !payload.text.trim() || payload.text.length > 2000) {
        throw new InputError("Expected a nonempty text field (maximum 2000 characters).");
      }
      return json(res, 200, await routeRequest(payload.text));
    } catch (error) {
      return json(res, error instanceof InputError ? 400 : 503, {
        status: "REVIEW", manager: null, reason: error instanceof InputError ? error.message : "Router unavailable"
      });
    }
  }

  if (req.method === "POST" && req.url === "/v1/decide") {
    const started = performance.now();
    try {
      const payload = await readJson(req);
      validate(payload);
      const { action, policies } = payload;
      const kernel = evaluateKernel(action);
      const result = kernel || await decideWithProvider({ action, policies });
      result.latency_ms = Math.round(performance.now() - started);
      return json(res, 200, result);
    } catch (error) {
      // The HTTP status is also fail-closed; clients must never interpret a
      // transport error, malformed request or provider outage as permission.
      return json(res, error instanceof InputError ? 400 : 503, {
        decision: "ESCALATE", confidence: 1,
        reasons: [error instanceof InputError ? error.message : "Decision gateway unavailable"],
        policies: [], provider: "gateway", fallback_used: true,
        latency_ms: Math.round(performance.now() - started)
      });
    }
  }
  return json(res, 404, { error: "not_found" });
});

server.listen(port, "0.0.0.0", () => console.log(`jev-gateway listening on :${port}`));

class InputError extends Error {}

function validate(payload) {
  const a = payload?.action;
  if (!a || typeof a !== "object" || Array.isArray(a) ||
      typeof a.id !== "string" || !a.id.trim() ||
      typeof a.actor !== "string" || !a.actor.trim() ||
      typeof a.requested_at !== "string" || !Number.isFinite(Date.parse(a.requested_at)) ||
      typeof a.intent !== "string" || !a.intent.trim() || a.intent.length > 2000 ||
      typeof a.tool !== "string" || !a.tool.trim() ||
      !["low", "medium", "high", "critical"].includes(a.risk) ||
      !["external_contact", "financial_action", "policy_mutation", "destructive"].every((key) => typeof a[key] === "boolean") ||
      !Array.isArray(payload.policies) || payload.policies.length > 20 ||
      !payload.policies.every((p) => p && typeof p.id === "string" && typeof p.description === "string" && p.description.length <= 1000)) {
    throw new InputError("Invalid action or policy summary; explicit risk flags and policy list are required.");
  }
}

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.byteLength;
    if (bytes > 100_000) throw new InputError("Request too large");
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new InputError("Invalid JSON"); }
}
