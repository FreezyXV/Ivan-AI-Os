import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { routePilotTask } from "./pilot-routing.js";
import { ROUTING_TASKS, ROUTING_URGENCY } from "../../../services/jev-gateway/src/routing-metadata.js";

export default definePluginEntry({
  id: "ivan-ai-os-route",
  name: "Ivan AI OS Route",
  description: "Advisory specialist routing for the active Mac pilot.",
  register(api) {
    const gatewayUrl = api.pluginConfig?.gatewayUrl;
    if (typeof gatewayUrl !== "string") throw new Error("gatewayUrl is required");
    api.registerTool({
      name: "ivan_route",
      description: "Select a specialist using task labels ordered by priority, urgency and detail readiness. Send no free text, names, contacts, file contents or credentials. Advisory only: does not launch agents or authorize tools.",
      parameters: {
        type: "object",
        properties: {
          requested_tasks: {type:"array",items:{type:"string",enum:[...ROUTING_TASKS]},minItems:1,maxItems:8,uniqueItems:true},
          urgency: {type:"string",enum:[...ROUTING_URGENCY]},
          details_available: {type:"boolean"}
        },
        required: ["requested_tasks","urgency","details_available"],
        additionalProperties: false
      },
      async execute(_id, params) {
        try {
          const result = routePilotTask(params);
          return { content: [{ type: "text", text: JSON.stringify(result) }], details: result };
        } catch (error) {
          const fallback = { status: "REVIEW", manager: null, provider: "deterministic-kernel",
            error_code: "ROUTING_METADATA_REQUIRED" };
          return { content: [{ type: "text", text: JSON.stringify(fallback) }], details: fallback };
        }
      }
    });
  }
});
