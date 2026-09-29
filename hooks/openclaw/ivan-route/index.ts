import { Type } from "typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { GatewayClientError, routeWithGateway } from "./client.js";
import { ROUTING_TASKS, ROUTING_URGENCY } from "../../../services/jev-gateway/src/routing-metadata.js";

export default definePluginEntry({
  id: "ivan-ai-os-route",
  name: "Ivan AI OS Route",
  description: "Advisory specialist routing backed by Jev.",
  register(api) {
    const gatewayUrl = api.pluginConfig?.gatewayUrl;
    if (typeof gatewayUrl !== "string") throw new Error("gatewayUrl is required");
    api.registerTool({
      name: "ivan_route",
      description: "Select a specialist using task labels ordered by priority, urgency and detail readiness. Send no free text, names, contacts, file contents or credentials. Advisory only: does not launch agents or authorize tools.",
      parameters: Type.Object({
        requested_tasks: Type.Array(Type.Union(ROUTING_TASKS.map(task => Type.Literal(task))), { minItems: 1, maxItems: 8, uniqueItems: true }),
        urgency: Type.Union(ROUTING_URGENCY.map(value => Type.Literal(value))),
        details_available: Type.Boolean()
      }, { additionalProperties: false }),
      async execute(_id, params) {
        try {
          const result = await routeWithGateway(params, gatewayUrl);
          return { content: [{ type: "text", text: JSON.stringify(result) }], details: result };
        } catch (error) {
          const fallback = { status: "REVIEW", manager: null, provider: "gateway-unavailable",
            error_code: error instanceof GatewayClientError ? error.code : "GATEWAY_UNAVAILABLE" };
          return { content: [{ type: "text", text: JSON.stringify(fallback) }], details: fallback };
        }
      }
    });
  }
});
