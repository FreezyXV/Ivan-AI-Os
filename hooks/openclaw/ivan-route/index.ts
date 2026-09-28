import { Type } from "typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { routeWithGateway } from "./client.js";

export default definePluginEntry({
  id: "ivan-ai-os-route",
  name: "Ivan AI OS Route",
  description: "Advisory specialist routing backed by Jev.",
  register(api) {
    const gatewayUrl = api.pluginConfig?.gatewayUrl;
    if (typeof gatewayUrl !== "string") throw new Error("gatewayUrl is required");
    api.registerTool({
      name: "ivan_route",
      description: "Classify a request into Business, Career, Finance, Knowledge, Engineering or System. Advisory only: does not launch an agent or authorize tools.",
      parameters: Type.Object({ text: Type.String({ minLength: 1, maxLength: 2000 }) }),
      async execute(_id, params) {
        try {
          const result = await routeWithGateway(params.text, gatewayUrl);
          return { content: [{ type: "text", text: JSON.stringify(result) }], details: result };
        } catch {
          const fallback = { status: "REVIEW", manager: null, provider: "gateway-unavailable" };
          return { content: [{ type: "text", text: JSON.stringify(fallback) }], details: fallback };
        }
      }
    });
  }
});
