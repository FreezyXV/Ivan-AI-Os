import { createAuditWriter } from "../../../services/jev-gateway/src/audit.js";
import { createEvaluationClient } from "./client.js";
import { createObserver } from "./observer.js";

export default {
  id: "ivan-ai-os-observer",
  name: "Ivan AI OS Observer",
  description: "Scoped, advisory tool observations; no enforcement.",
  register(api) {
    const config = api.pluginConfig;
    if (config?.enabled !== true) return;
    const timeoutMs = config.timeoutMs ?? 3000;
    const token = process.env.IVAN_DECISION_TOKEN;
    let observer;
    try {
      observer = createObserver({
        token, agentId: config.agentId, tools: config.tools,
        evaluate: createEvaluationClient({ gatewayUrl: config.gatewayUrl, token, timeoutMs }),
        audit: createAuditWriter(config.auditPath),
        warn: code => api.logger.warn(code)
      });
    } catch { throw new Error("INVALID_OBSERVER_CONFIG"); }
    const options = { matcher: config.tools, timeoutMs: timeoutMs + 2000 };
    api.on("before_tool_call", observer.before, options);
    api.on("after_tool_call", observer.after, options);
    api.on("gateway_stop", observer.stop);
  }
};
