import { businessBrief, financeBrief } from "./briefs.js";

const output = details => ({ content: [{ type: "text", text: JSON.stringify(details) }], details });
const tool = (name, description, directory, reader) => ({
  name, label: description, description,
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async execute() {
    try { return output(reader(directory)); }
    catch { return output({ status: "UNAVAILABLE", error_code: "BRIEF_UNAVAILABLE" }); }
  }
});

export function createEngineTools(context, config) {
  if (context?.agentId === "ivan-business") return tool("ivan_business_brief",
    "Read up to three prepared public Business opportunities with scores and evidence links; no private profile, shell or network call.", config?.businessDir, businessBrief);
  if (context?.agentId === "ivan-finance") return tool("ivan_finance_brief",
    "Read the latest prepared public macro and market snapshot, with previous values; no personal allocation, shell or network call.", config?.financeDir, financeBrief);
  return null;
}
