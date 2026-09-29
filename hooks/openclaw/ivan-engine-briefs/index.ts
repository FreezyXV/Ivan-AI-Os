import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createEngineTools } from "./tools.js";

export default definePluginEntry({
  id: "ivan-ai-os-engine-briefs",
  name: "Ivan AI OS Engine Briefs",
  description: "Read prepared public Business and Finance results without shell access.",
  register(api) {
    api.registerTool(context => createEngineTools(context, api.pluginConfig), {
      names: ["ivan_business_brief", "ivan_finance_brief"], optional: true
    });
  }
});
