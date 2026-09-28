import { askTypeSafe } from "./provider.js";
import { routingQuestions } from "./questions.js";

const MANAGERS = Object.keys(routingQuestions.manager.criteria);

export async function routeRequest(text) {
  if ((process.env.JEV_PROVIDER || "mock") !== "jev") {
    return { status: "REVIEW", manager: null, urgency: null, unclear_probability: null, provider: "mock" };
  }
  const raw = await askTypeSafe(text, routingQuestions);
  const { manager, unclear, urgency } = raw?.answers || {};
  if (manager?.type !== "choice" || !MANAGERS.includes(manager.choice) ||
      !Number.isFinite(manager.confidence) || manager.confidence < 0 || manager.confidence > 1 ||
      unclear?.type !== "noul" || !Number.isFinite(unclear.noul) || unclear.noul < 0 || unclear.noul > 1 ||
      urgency?.type !== "score" || !Number.isFinite(urgency.score) || urgency.score < 0 || urgency.score > 2) {
    throw new Error("Invalid TypeSafe routing response");
  }
  // The router only proposes an assignment; an unclear request or uncertain
  // manager selection goes to review rather than launching an agent.
  return {
    status: unclear.noul >= 0.7 || manager.confidence < 0.7 ? "REVIEW" : "ROUTED",
    manager: manager.choice,
    urgency: urgency.score,
    unclear_probability: unclear.noul,
    provider: "jev"
  };
}
