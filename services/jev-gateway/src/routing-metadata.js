import { canonicalJson } from "./action-binding.js";

// Provider-bound routing contains only these public, finite labels. No caller
// prose, filenames, identifiers, contacts or document contents are accepted.
export const ROUTING_TASKS = Object.freeze([
  "unit_test", "bug_fix", "code_review", "build_feature", "software_design",
  "job_search", "cv_draft", "career_positioning", "market_research", "business_validation",
  "portfolio_review", "financial_research", "topic_research", "learning_material",
  "organize_notes", "configure_agent", "configure_skill", "maintain_infrastructure", "other"
]);
export const ROUTING_URGENCY = Object.freeze(["none", "soon", "immediate"]);

export class RoutingInputError extends Error {
  constructor() { super("ROUTING_METADATA_REQUIRED"); }
}

export function validateRoutingMetadata(input) {
  try {
    const metadata = JSON.parse(canonicalJson(input));
    if (!metadata || Array.isArray(metadata) || Object.keys(metadata).length !== 3 ||
        !Object.hasOwn(metadata, "requested_tasks") || !Object.hasOwn(metadata, "urgency") || !Object.hasOwn(metadata, "details_available") ||
        !Array.isArray(metadata.requested_tasks) || metadata.requested_tasks.length < 1 || metadata.requested_tasks.length > 8 ||
        new Set(metadata.requested_tasks).size !== metadata.requested_tasks.length || metadata.requested_tasks.some(t => !ROUTING_TASKS.includes(t)) ||
        !ROUTING_URGENCY.includes(metadata.urgency) || typeof metadata.details_available !== "boolean") throw new Error();
    return metadata;
  } catch { throw new RoutingInputError(); }
}
