import { createAuditWriter } from "../../../services/jev-gateway/src/audit.js";
import { createEvaluationClient } from "./client.js";
import { createObserver } from "./observer.js";
import { readDecisionToken } from "../../../services/jev-gateway/src/runtime-token.js";

export default {
  id: "ivan-ai-os-observer",
  name: "Ivan AI OS Observer",
  description: "Scoped, advisory tool observations; no enforcement.",
  register(api) {
    const config = api.pluginConfig;
    if (config?.enabled !== true) return;
    const timeoutMs = config.timeoutMs ?? 3000;
    let observer;
    try {
      const token = readDecisionToken();
      observer = createObserver({
        token, agentId: config.agentId, tools: config.tools,
        evaluate: createEvaluationClient({ gatewayUrl: config.gatewayUrl, token, timeoutMs }),
        audit: createAuditWriter(config.auditPath),
        warn: code => api.logger.warn(code)
      });
    } catch {
      // Optional telemetry must not make the host unavailable. No hooks are
      // registered on failure; this warning does not imply policy enforcement.
      try { api.logger.warn("OBSERVER_DISABLED_INVALID_CONFIG"); } catch {}
      return;
    }
    const options = { matcher: config.tools, timeoutMs: timeoutMs + 2000 };
    api.on("before_tool_call", observer.before, options);
    api.on("after_tool_call", observer.after, options);
    api.on("gateway_stop", observer.stop);
  }
};
