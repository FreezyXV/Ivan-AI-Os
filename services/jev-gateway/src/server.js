import http from "node:http";
import { ProviderError } from "./provider.js";
import { routeRequest } from "./routing.js";
import { pathToFileURL } from "node:url";
import { createTrustedEvaluator } from "./trusted-evaluator.js";
import { RoutingInputError, validateRoutingMetadata } from "./routing-metadata.js";
import { getRuntimeBudget } from "./budget.js";
import { readDecisionToken } from "./runtime-token.js";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { classifyRequest, ClassificationInputError, QUESTIONS } from "./classification.js";

const port = Number(process.env.PORT || 4310);
const host = process.env.HOST || "127.0.0.1";

export function createGatewayServer({ trustedEvaluator = null, budget, route = metadata => routeRequest(metadata, { budget }), classify = payload => classifyRequest(payload, { budget }) } = {}) {
  return http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true, service: "jev-gateway", provider: process.env.JEV_PROVIDER || "mock" });

    const privateEndpoint = (req.method === "POST" && ["/v1/evaluate-tool", "/v1/route", "/v1/decide", "/v1/classify"].includes(req.url)) || (req.method === "GET" && req.url === "/v1/usage");
    if (privateEndpoint) {
      if (!trustedEvaluator) return json(res, 503, { decision: "ESCALATE", reason_code: "TRUSTED_EVALUATION_DISABLED", advisory: true, executable: false });
      if (!trustedEvaluator.authenticate(req.headers.authorization)) return json(res, 401, { decision: "ESCALATE", reason_code: "UNAUTHORIZED", advisory: true, executable: false });
    }
    if (req.method === "GET" && req.url === "/v1/usage") {
      try { return json(res, 200, (budget ?? getRuntimeBudget()).status()); }
      catch { return json(res, 503, { reason_code: "BUDGET_UNAVAILABLE" }); }
    }
    if (req.method === "POST" && req.url === "/v1/classify") {
      const started = performance.now(), requestId = randomUUID();
      let status = 200, result, reasonCode = "CLASSIFIED";
      try {
        result = await classify(await readJson(req));
        if (!result || !Object.hasOwn(QUESTIONS, result.question) || result.provider !== "jev" ||
            !Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1)
          throw new ProviderError("TYPESAFE_CLASSIFICATION_RESPONSE_INVALID");
      } catch (error) {
        status = error instanceof ClassificationInputError ? error.status : error instanceof InputError ? 400 : 503;
        reasonCode = error instanceof ClassificationInputError ? error.code : error instanceof InputError ? "INVALID_CLASSIFICATION_REQUEST" :
          error instanceof ProviderError ? error.code : "CLASSIFICATION_UNAVAILABLE";
      }
      const question = result?.question && Object.hasOwn(QUESTIONS, result.question) ? result.question : null;
      try {
        await trustedEvaluator.auditClassification({ requestId, question, status,
          decision: status === 200 ? result.decision : null, confidence: status === 200 ? result.confidence : null,
          provider: status === 200 ? "jev" : "gateway", reasonCode, latencyMs: Math.round(performance.now() - started) });
      } catch { return json(res, 503, { reason_code: "AUDIT_UNAVAILABLE", request_id: requestId }); }
      return json(res, status, status === 200 ? { ...result, request_id: requestId } : { reason_code: reasonCode, request_id: requestId });
    }
    // Legacy caller-supplied intents, risk flags and policies are retired.
    // /decide is now a compatibility alias for concrete shadow evaluation.
    if (req.method === "POST" && ["/v1/evaluate-tool", "/v1/decide"].includes(req.url)) {
      let payload;
      try { payload = await readJson(req); }
      catch { payload = null; }
      const result = await trustedEvaluator.evaluate(payload);
      return json(res, result.status, result.body);
    }

    if (req.method === "POST" && req.url === "/v1/route") {
      try {
        const payload = await readJson(req);
        if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "metadata")) throw new InputError("ROUTING_METADATA_REQUIRED");
        return json(res, 200, await route(validateRoutingMetadata(payload.metadata)));
      } catch (error) {
        const invalid = error instanceof InputError || error instanceof RoutingInputError;
        return json(res, invalid ? 400 : 503, {
          status: "REVIEW", manager: null,
          error_code: invalid ? "INVALID_REQUEST" : error instanceof ProviderError ? error.code : "GATEWAY_ERROR",
          reason: invalid ? "ROUTING_METADATA_REQUIRED" : "Router unavailable"
        });
      }
    }

    return json(res, 404, { error: "not_found" });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if ((process.env.JEV_PROVIDER || "mock") === "jev") getRuntimeBudget().status();
    const token = readDecisionToken();
    const trustedEvaluator = token ? createTrustedEvaluator({
      token,
      workspaceRoot: process.env.IVAN_WORKSPACE_ROOT,
      auditPath: process.env.IVAN_AUDIT_PATH
    }) : null;
    createGatewayServer({ trustedEvaluator }).listen(port, host, () => console.log(`jev-gateway listening on ${host}:${port}`));
  } catch {
    console.error("Gateway startup refused: invalid trusted evaluation configuration.");
    process.exitCode = 1;
  }
}

class InputError extends Error {}

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
