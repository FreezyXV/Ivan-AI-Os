import { validateRoutingMetadata, ROUTING_TASKS } from "./routing-metadata.js";

// Public synthetic labels, reviewed independently of provider predictions.
export const ROUTING_CALIBRATION = Object.freeze([
  ["unit_test", "engineering"], ["bug_fix", "engineering"], ["code_review", "engineering"],
  ["build_feature", "engineering"], ["software_design", "engineering"],
  ["job_search", "career"], ["cv_draft", "career"], ["career_positioning", "career"],
  ["market_research", "business"], ["business_validation", "business"],
  ["portfolio_review", "finance"], ["financial_research", "finance"],
  ["topic_research", "knowledge"], ["learning_material", "knowledge"],
  ["organize_notes", "system"], ["configure_agent", "system"], ["configure_skill", "system"],
  ["maintain_infrastructure", "system"], ["other", "system"]
].map(([task, manager], index) => Object.freeze({
  id: task,
  metadata: Object.freeze({ requested_tasks: Object.freeze([task]), urgency: ["none", "soon", "immediate"][index % 3], details_available: manager === "system" || index % 2 === 0 }),
  expected: Object.freeze({ manager })
})));

export function validateCalibration(cases = ROUTING_CALIBRATION) {
  if (cases.length !== ROUTING_TASKS.length || new Set(cases.map(c => c.id)).size !== cases.length) throw new Error("INVALID_CALIBRATION_CORPUS");
  const labels = new Set(ROUTING_TASKS);
  for (const item of cases) {
    const metadata = validateRoutingMetadata(item.metadata);
    if (metadata.requested_tasks.length !== 1 || !labels.delete(metadata.requested_tasks[0]) || item.id !== metadata.requested_tasks[0] || !["business", "career", "finance", "knowledge", "engineering", "system"].includes(item.expected.manager)) throw new Error("INVALID_CALIBRATION_CORPUS");
  }
  if (labels.size) throw new Error("INVALID_CALIBRATION_CORPUS");
  return cases;
}

export function summarizeCalibration(observations, cases = ROUTING_CALIBRATION) {
  validateCalibration(cases);
  const seen = new Set(), results = new Map();
  for (const observation of observations) {
    if (!cases.some(c => c.id === observation.id) || seen.has(observation.id)) throw new Error("INVALID_CALIBRATION_OBSERVATIONS");
    seen.add(observation.id); results.set(observation.id, observation.result);
  }
  let measured = 0, correct = 0, reviewed = 0, unavailable = 0, detailMatches = 0, urgencyMatches = 0;
  const mismatches = [];
  for (const item of cases) {
    const r = results.get(item.id);
    if (!r || r.provider !== "jev" || !["ROUTED", "REVIEW"].includes(r.status) || !Number.isFinite(r.manager_confidence) || r.manager_confidence < 0 || r.manager_confidence > 1 || !Number.isFinite(r.needs_details_probability) || r.needs_details_probability < 0 || r.needs_details_probability > 1 || !Number.isFinite(r.urgency) || r.urgency < 0 || r.urgency > 2) { unavailable++; continue; }
    measured++;
    if (r.manager === item.expected.manager) correct++; else mismatches.push(item.id);
    if (r.status === "REVIEW") reviewed++;
    if ((r.needs_details_probability >= 0.5) === !item.metadata.details_available) detailMatches++;
    if (Math.abs(r.urgency - ["none", "soon", "immediate"].indexOf(item.metadata.urgency)) <= 0.25) urgencyMatches++;
  }
  return { corpus_version: 1, total: cases.length, measured, unavailable, manager_correct: correct,
    manager_accuracy: measured ? correct / measured : null, coverage: measured / cases.length,
    review_rate: measured ? reviewed / measured : null, detail_matches: detailMatches,
    urgency_matches: urgencyMatches, mismatches, permission_granted: false };
}
