import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { evaluateKernel } from "./kernel.js";
import { decideWithProvider } from "./provider.js";
import { createAuditWriter } from "./audit.js";
import { classifyToolCall, loadPolicyCatalog, validateToolCall, TrustedInputError } from "./trusted-policy.js";

// Shadow evaluation only. No ALLOW response, action execution, runtime hook or
// human-approval token is implemented by this endpoint.
export function createTrustedEvaluator({ token, workspaceRoot, auditPath, audit = auditPath && createAuditWriter(auditPath), catalog = loadPolicyCatalog(), decide = decideWithProvider } = {}) {
  if (typeof token !== "string" || token.length < 32 || /\s/.test(token) || typeof audit !== "function") throw new Error("INVALID_TRUSTED_CONFIG");
  const expected = digest(`Bearer ${token}`);
  return {
    authenticate(header) {
      return typeof header === "string" && header.length < 4096 && timingSafeEqual(expected, digest(header));
    },
    async evaluate(payload) {
      const started = performance.now();
      const requestId = randomUUID();
      let status = 200, classification, result;
      try {
        classification = classifyToolCall(validateToolCall(payload), workspaceRoot);
        const { action, hardDecision, consultProvider, reason } = classification;
        const kernel = evaluateKernel(action);
        result = { decision: hardDecision || kernel?.decision || "REVIEW", confidence: hardDecision || kernel ? 1 : 0, reason_code: reason, provider: "deterministic-kernel" };
        if (!hardDecision && !kernel && consultProvider) {
          const proposed = await decide({ action, policies: catalog.policies });
          if (!["ALLOW", "DENY", "REVIEW"].includes(proposed?.decision) || !Number.isFinite(proposed.confidence) || proposed.confidence < 0 || proposed.confidence > 1) throw new Error("INVALID_PROVIDER_RESULT");
          result = {
            decision: proposed.decision === "ALLOW" ? "REVIEW" : proposed.decision,
            confidence: proposed.confidence,
            reason_code: proposed.decision === "ALLOW" ? "ENFORCEMENT_NOT_ENABLED" : "PROVIDER_CLASSIFICATION",
            provider: proposed.provider === "jev" ? "jev" : "mock"
          };
        }
      } catch (error) {
        status = error instanceof TrustedInputError ? 400 : 503;
        result = { decision: "ESCALATE", confidence: 0, reason_code: status === 400 ? "INVALID_TOOL_CALL" : "EVALUATION_UNAVAILABLE", provider: "gateway" };
      }
      const response = {
        ...result, request_id: requestId, advisory: true, executable: false,
        policies: catalog.policies.map(p => p.id), policy_revision: catalog.revision,
        latency_ms: Math.round(performance.now() - started)
      };
      // Field allowlist: never spread payload, arguments, provider prose, request
      // headers, paths, addresses or error objects into the audit journal.
      const event = {
        version: 1, request_id: requestId, timestamp: new Date().toISOString(),
        actor: "local-adapter", tool: classification?.action.tool ?? "invalid",
        risk: classification?.action.risk ?? "unknown", decision: response.decision, confidence: response.confidence,
        reason_code: response.reason_code, provider: response.provider,
        policies: response.policies, policy_revision: response.policy_revision,
        latency_ms: response.latency_ms
      };
      try { await audit(event); }
      catch {
        return { status: 503, body: { decision: "ESCALATE", reason_code: "AUDIT_UNAVAILABLE", request_id: requestId, advisory: true, executable: false } };
      }
      return { status, body: response };
    }
  };
}

function digest(value) { return createHash("sha256").update(value).digest(); }
