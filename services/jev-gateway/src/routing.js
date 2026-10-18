import { askTypeSafe, ProviderError } from "./provider.js";
import { routingQuestions } from "./questions.js";
import { ROUTING_TASKS, ROUTING_URGENCY, validateRoutingMetadata } from "./routing-metadata.js";

const MANAGERS = Object.keys(routingQuestions.manager.criteria);

// Deterministic routing (proposal after the 2026-09-29 live calibration): metadata are
// enumerated labels ordered by priority, so the first task decides the manager. Same
// labels as the reviewed calibration corpora; `other` stays with system.
export const TASK_MANAGER = Object.freeze({
  unit_test: "engineering", bug_fix: "engineering", code_review: "engineering", build_feature: "engineering", software_design: "engineering",
  job_search: "career", cv_draft: "career", career_positioning: "career",
  market_research: "business", business_validation: "business",
  portfolio_review: "finance", financial_research: "finance",
  topic_research: "knowledge", learning_material: "knowledge",
  organize_notes: "system", configure_agent: "system", configure_skill: "system", maintain_infrastructure: "system", other: "system"
});

if (ROUTING_TASKS.some(task => !MANAGERS.includes(TASK_MANAGER[task])) || Object.keys(TASK_MANAGER).length !== ROUTING_TASKS.length) throw new Error("ROUTING_TABLE_INCOMPLETE");

export function routeByTable(metadata) {
  const manager = TASK_MANAGER[metadata.requested_tasks[0]];
  const needsDetails = metadata.details_available ? 0 : 1;
  // Same review rule as the Jev path: a vague system request without details needs Ivan.
  return {
    status: manager === "system" && needsDetails >= 0.7 ? "REVIEW" : "ROUTED",
    manager, manager_confidence: 1, urgency: ROUTING_URGENCY.indexOf(metadata.urgency),
    needs_details_probability: needsDetails, provider: "table"
  };
}

export async function routeRequest(input, options) {
  const metadata = validateRoutingMetadata(input);
  // Opt-in: JEV_ROUTING_MODE=table routes without any provider call or budget use.
  if (process.env.JEV_ROUTING_MODE === "table") return routeByTable(metadata);
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
