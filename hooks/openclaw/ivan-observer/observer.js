import { randomUUID } from "node:crypto";
import { canonicalJson, createKeyedBinding } from "../../../services/jev-gateway/src/action-binding.js";

const toolPattern = /^[a-z][a-z0-9_]{0,63}$/;

// Observation only: these callbacks ALWAYS return undefined. They never grant
// permission, rewrite arguments, block a tool, or request human approval.
export function createObserver({ token, agentId, tools, evaluate, audit, warn = () => {}, now = Date.now, maxPending = 256, ttlMs = 900_000 }) {
  if (typeof agentId !== "string" || !agentId || !Array.isArray(tools) || !tools.length || tools.length > 32 || tools.some(t => typeof t !== "string" || !toolPattern.test(t)) ||
      typeof evaluate !== "function" || typeof audit !== "function" || !Number.isInteger(maxPending) || maxPending < 1 || maxPending > 1024 || !Number.isInteger(ttlMs) || ttlMs < 1) throw new Error("INVALID_OBSERVER_CONFIG");
  const names = new Set(tools);
  const bind = createKeyedBinding(token);
  const reference = createKeyedBinding(token, "call-reference");
  const pending = new Map();
  let stopped = false;

  function warning(code) { try { warn(code); } catch {} }
  function record(fields) {
    try { audit({ version: 1, type: "tool_observation", timestamp: new Date(now()).toISOString(), ...fields }); }
    catch { warning("OBSERVER_AUDIT_UNAVAILABLE"); }
  }
  function expire() {
    for (const [key, item] of pending) if (now() - item.createdAt >= ttlMs) {
      pending.delete(key);
      record({ phase: "expired", observation_id: item.id, call_ref: key, action_binding: item.binding });
    }
  }
  function capture(event, ctx) {
    if (stopped || ctx?.agentId !== agentId || !names.has(event?.toolName)) return null;
    if (ctx.toolName !== event.toolName || !toolPattern.test(event.toolName)) throw new Error("INVALID_CAPTURE");
    const runId = ctx.runId ?? event.runId;
    const toolCallId = ctx.toolCallId ?? event.toolCallId;
    for (const key of ["runId", "toolCallId"]) if (ctx[key] !== undefined && event[key] !== undefined && ctx[key] !== event[key]) throw new Error("INVALID_CAPTURE");
    if (![runId, toolCallId].every(v => typeof v === "string" && v.length > 0 && v.length <= 512)) throw new Error("INVALID_CAPTURE");
    if (!event.params || typeof event.params !== "object" || Array.isArray(event.params)) throw new Error("INVALID_CAPTURE");
    // Snapshot before any await; no original params or requester/session data
    // are retained in pending state, persisted, or included in warnings.
    const body = canonicalJson({ tool: event.toolName, arguments: event.params });
    const key = reference({ agentId, runId, toolCallId, tool: event.toolName });
    return { key, body, binding: bind(JSON.parse(body)) };
  }

  return {
    async before(event, ctx) {
      let captureResult;
      try { captureResult = capture(event, ctx); } catch { warning("OBSERVER_CAPTURE_INVALID"); return; }
      if (!captureResult) return;
      expire();
      const { key, body, binding } = captureResult;
      if (pending.has(key)) { warning("OBSERVER_DUPLICATE_BEFORE"); return; }
      if (pending.size >= maxPending) { warning("OBSERVER_CAPACITY_REACHED"); return; }
      const item = { id: randomUUID(), binding, createdAt: now() };
      pending.set(key, item);
      let evaluated;
      try {
        evaluated = await evaluate(body, ctx.abortSignal);
        if (evaluated.action_binding !== binding) throw new Error("BINDING_MISMATCH");
      } catch { warning("OBSERVER_EVALUATION_UNAVAILABLE"); }
      if (stopped || pending.get(key) !== item) return;
      record({
        phase: "before", observation_id: item.id, call_ref: key, action_binding: binding,
        evaluation: evaluated?.action_binding === binding ? "recorded" : "unavailable",
        ...(evaluated?.action_binding === binding ? { request_id: evaluated.request_id, decision: evaluated.decision, policy_revision: evaluated.policy_revision } : {})
      });
    },
    after(event, ctx) {
      let captured;
      try { captured = capture(event, ctx); } catch { warning("OBSERVER_CAPTURE_INVALID"); return; }
      if (!captured) return;
      expire();
      const item = pending.get(captured.key);
      if (!item) { warning("OBSERVER_UNMATCHED_AFTER"); return; }
      pending.delete(captured.key);
      record({
        phase: "after", observation_id: item.id, call_ref: captured.key,
        action_binding: captured.binding, before_binding: item.binding,
        params_unchanged: item.binding === captured.binding,
        outcome: event.error ? "reported_error" : "completion_observed"
      });
    },
    stop() {
      stopped = true;
      for (const [key, item] of pending) record({ phase: "incomplete", observation_id: item.id, call_ref: key, action_binding: item.binding });
      pending.clear();
    }
  };
}
