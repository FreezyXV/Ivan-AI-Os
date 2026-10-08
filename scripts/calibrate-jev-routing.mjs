// Default validates the public corpus without network/model calls. --live uses
// the authenticated, budgeted gateway; no provider key enters this process.
import { ROUTING_CALIBRATION, validateCalibration, summarizeCalibration } from "../services/jev-gateway/src/calibration.js";
import { ROUTING_HOLDOUT } from "../services/jev-gateway/src/routing-holdout.js";
import { readDecisionToken } from "../services/jev-gateway/src/runtime-token.js";

try {
  const args = process.argv.slice(2);
  if (new Set(args).size !== args.length || args.some(arg => !["--live", "--dry-run", "--holdout"].includes(arg)) || (args.includes("--live") && args.includes("--dry-run"))) throw new Error("INVALID_CALIBRATION_OPTION");
  const holdout = args.includes("--holdout"), cases = holdout ? ROUTING_HOLDOUT : ROUTING_CALIBRATION;
  validateCalibration(cases, { holdout });
  if (!process.argv.includes("--live")) {
    console.log(JSON.stringify({ corpus_valid: true, corpus: holdout ? "holdout-v1" : "training-v1", cases: cases.length, provider_calls: 0, measured_accuracy: null }));
  } else {
    const url = new URL(process.env.IVAN_GATEWAY_URL || "http://127.0.0.1:4310");
    if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("GATEWAY_MUST_BE_LOOPBACK");
    const token = readDecisionToken(); if (!token) throw new Error("DECISION_TOKEN_REQUIRED");
    const request = async (pathname, metadata) => {
      const response = await fetch(new URL(pathname, url), { method: metadata ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(45000),
        headers: { authorization: `Bearer ${token}`, ...(metadata ? { "content-type": "application/json" } : {}) },
        ...(metadata ? { body: JSON.stringify({ metadata }) } : {}) });
      if (!response.ok) throw new Error("CALIBRATION_GATEWAY_UNAVAILABLE");
      return response.json();
    };
    const before = await request("/v1/usage"), observations = [];
    for (const item of cases) {
      try { observations.push({ id: item.id, result: await request("/v1/route", item.metadata) }); }
      catch { observations.push({ id: item.id }); break; } // No retries or repeated failures.
    }
    const after = await request("/v1/usage");
    const summary = summarizeCalibration(observations, cases, { holdout });
    const delta = before.month === after.month && Number.isSafeInteger(before.charged_micro_eur) && Number.isSafeInteger(after.charged_micro_eur)
      ? (after.charged_micro_eur - before.charged_micro_eur) / 1_000_000 : null;
    console.log(JSON.stringify({ ...summary, local_budget_estimate: true,
      estimated_gateway_charge_delta_eur: delta, usage_delta_can_include_other_clients: true,
      usage_read_before_and_after: Boolean(before.estimate && after.estimate) }));
    if (summary.unavailable) process.exitCode = 1;
  }
} catch { console.error("CALIBRATION_REFUSED"); process.exitCode = 1; }
