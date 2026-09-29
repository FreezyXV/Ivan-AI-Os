// Hand-labelled synthetic validation cases, written before provider predictions.
// No reuse of the original calibration triples, no threshold/question changes.
export const ROUTING_HOLDOUT = Object.freeze([
  ["engineering-before-system", ["bug_fix", "configure_agent"], "immediate", false, "engineering"],
  ["system-before-engineering", ["configure_agent", "bug_fix"], "immediate", false, "system"],
  ["career-before-business", ["job_search", "cv_draft", "market_research"], "soon", true, "career"],
  ["business-before-career", ["market_research", "job_search"], "soon", true, "business"],
  ["finance-before-knowledge", ["financial_research", "topic_research"], "none", true, "finance"],
  ["knowledge-before-finance", ["topic_research", "financial_research"], "none", true, "knowledge"],
  ["memory-before-learning", ["organize_notes", "learning_material"], "soon", false, "system"],
  ["learning-before-memory", ["learning_material", "organize_notes"], "soon", false, "knowledge"],
  ["unclear-primary", ["other", "unit_test"], "none", false, "system"],
  ["engineering-before-unclear", ["unit_test", "other"], "none", false, "engineering"],
  ["private-finance-route-only", ["portfolio_review", "unit_test"], "none", false, "finance"],
  ["engineering-before-private-finance", ["unit_test", "portfolio_review"], "none", false, "engineering"],
  ["eight-priorities", ["code_review", "cv_draft", "financial_research", "market_research", "learning_material", "organize_notes", "configure_agent", "other"], "immediate", true, "engineering"],
  ["skill-details-missing", ["configure_skill"], "immediate", false, "system"],
  ["infrastructure-details-missing", ["maintain_infrastructure"], "soon", false, "system"],
  ["unclear-details-missing", ["other"], "none", false, "system"],
  ["memory-details-missing", ["organize_notes"], "immediate", false, "system"],
  ["bug-details-ready", ["bug_fix"], "immediate", true, "engineering"],
  ["career-details-ready", ["job_search"], "immediate", true, "career"]
].map(([id, requested_tasks, urgency, details_available, manager]) => Object.freeze({
  id, metadata: Object.freeze({ requested_tasks: Object.freeze(requested_tasks), urgency, details_available }),
  expected: Object.freeze({ manager })
})));
