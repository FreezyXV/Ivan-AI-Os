import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createMemoryTools } from "./tools.js";

export default definePluginEntry({
  id: "ivan-ai-os-memory",
  name: "Ivan AI OS Memory",
  description: "Read validated agent notes locally, without shell access or provider calls.",
  register(api) {
    api.registerTool(context => createMemoryTools(context, api.pluginConfig), {
      names: ["ivan_memory_search", "ivan_memory_read"], optional: true
    });
  }
});
