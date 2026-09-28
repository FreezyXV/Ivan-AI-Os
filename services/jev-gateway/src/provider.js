import { permissionQuestion, MIN_ALLOW_CONFIDENCE, MIN_ALLOW_PROBABILITY } from "./questions.js";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

export class ProviderError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export async function decideWithProvider({ action, policies }) {
  const provider = process.env.JEV_PROVIDER || "mock";
  if (policies.length === 0) return review("gateway", policies, "No applicable policies supplied; action requires review.");
  if (provider === "mock") return review("mock", policies, "TypeSafe API is not configured.");
  if (provider !== "jev") throw new Error("Unsupported JEV_PROVIDER");
  return callJev({ action, policies });
}

function review(provider, policies, reason) {
  return {
    decision: "REVIEW", confidence: 0, reasons: [reason],
    policies: policies.map((p) => p.id), provider, fallback_used: provider === "mock"
  };
}

async function callJev({ action, policies }) {
  // Tool arguments and raw output may contain credentials or personal data.
  // The gateway never sends them to the provider.
  const state = {
    intent: action.intent,
    tool: action.tool,
    risk: action.risk,
    policies: policies.map(({ id, description }) => ({ id, description }))
  };
  return normalize(await askTypeSafe(state, { permission: permissionQuestion }), policies);
}

export async function askTypeSafe(state, questions) {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw new ProviderError("TYPESAFE_KEY_MISSING");
  const controller = new AbortController();
  const configuredTimeout = Number(process.env.JEV_TIMEOUT_MS || 8000);
  const timeoutMs = Number.isFinite(configuredTimeout) ? Math.max(1000, Math.min(30000, configuredTimeout)) : 8000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ state, model: process.env.JEV_MODEL || "jev-latest", questions }),
      signal: controller.signal
    });
    if (!response.ok) throw new ProviderError(`TYPESAFE_HTTP_${response.status}`);
    try { return await response.json(); }
    catch { throw new ProviderError("TYPESAFE_INVALID_JSON"); }
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (controller.signal.aborted) throw new ProviderError("TYPESAFE_TIMEOUT");
    throw new ProviderError("TYPESAFE_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

function normalize(raw, policies) {
  const answer = raw?.answers?.permission;
  if (answer?.type !== "choice" || !["ALLOW", "REVIEW", "DENY"].includes(answer.choice)) {
    throw new Error("Invalid TypeSafe choice answer");
  }
  const { probabilities, confidence } = answer;
  if (!probabilities || !Number.isFinite(confidence) || confidence < 0 || confidence > 1 ||
      !["ALLOW", "REVIEW", "DENY"].every((key) => Number.isFinite(probabilities[key]) && probabilities[key] >= 0 && probabilities[key] <= 1) ||
      Math.abs(Object.values(probabilities).reduce((sum, value) => sum + value, 0) - 1) > 0.03) {
    throw new Error("Invalid TypeSafe probability distribution");
  }
  let decision = answer.choice;
  if (decision === "ALLOW" && (confidence < MIN_ALLOW_CONFIDENCE || probabilities.ALLOW < MIN_ALLOW_PROBABILITY)) {
    decision = "REVIEW";
  }
  return {
    decision, confidence, reasons: [decision === "REVIEW" && answer.choice === "ALLOW"
      ? "TypeSafe allow score is below the configured threshold."
      : `TypeSafe classified this action as ${decision}.`],
    policies: policies.map((p) => p.id), provider: "jev", fallback_used: false
  };
}
