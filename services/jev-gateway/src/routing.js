import { askTypeSafe, ProviderError } from "./provider.js";
import { routingQuestions } from "./questions.js";
import { validateRoutingMetadata } from "./routing-metadata.js";

const MANAGERS = Object.keys(routingQuestions.manager.criteria);

export async function routeRequest(input, options) {
  const metadata = validateRoutingMetadata(input);
  if ((process.env.JEV_PROVIDER || "mock") !== "jev") {
    return { status: "REVIEW", manager: null, manager_confidence: null, urgency: null, needs_details_probability: null, provider: "mock" };
  }
  const raw = await askTypeSafe(metadata, routingQuestions, options);
  const { manager, needs_details, urgency } = raw?.answers || {};
  if (manager?.type !== "choice" || !MANAGERS.includes(manager.choice) ||
      !Number.isFinite(manager.confidence) || manager.confidence < 0 || manager.confidence > 1 ||
      needs_details?.type !== "noul" || !Number.isFinite(needs_details.noul) || needs_details.noul < 0 || needs_details.noul > 1 ||
      urgency?.type !== "score" || !Number.isFinite(urgency.score) || urgency.score < 0 || urgency.score > 2) {
    throw new ProviderError("TYPESAFE_ROUTING_RESPONSE_INVALID");
  }
  // Missing execution details do not prevent assigning a clear specialist.
  // Only an uncertain domain, or a vague request classified as system, needs
  // review before dispatch. This is still advisory: no agent is launched here.
  return {
    status: manager.confidence < 0.7 || (manager.choice === "system" && needs_details.noul >= 0.7) ? "REVIEW" : "ROUTED",
    manager: manager.choice,
    manager_confidence: manager.confidence,
    urgency: urgency.score,
    needs_details_probability: needs_details.noul,
    provider: "jev"
  };
}
