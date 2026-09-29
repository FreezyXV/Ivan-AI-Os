const CRITICAL = new Set(["high", "critical"]);

export function evaluateKernel(action = {}) {
  if (action.financial_action === true) {
    return requireHuman("kernel.human-approval", "Financial action requires Ivan's explicit approval.");
  }
  if (action.external_contact === true) {
    return requireHuman("kernel.human-approval", "External contact requires Ivan's explicit approval.");
  }
  if (action.policy_mutation === true) {
    return requireHuman("kernel.policy-integrity", "Kernel policy mutation requires explicit human approval.");
  }
  if (action.destructive === true && CRITICAL.has(action.risk)) {
    return requireHuman("kernel.destructive-actions", "High-impact destructive action requires explicit human approval.");
  }
  return null;
}

function requireHuman(policy, reason) {
  return {
    decision: "REQUIRE_HUMAN",
    confidence: 1,
    reasons: [reason],
    policies: [policy],
    provider: "deterministic-kernel",
    latency_ms: 0,
    fallback_used: false
  };
}
