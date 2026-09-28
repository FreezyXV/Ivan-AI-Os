export async function decideWithProvider({ action, policies }) {
  const provider = process.env.JEV_PROVIDER || "mock";

  if (provider === "mock") {
    return {
      decision: "REVIEW",
      confidence: 0.5,
      reasons: ["Jev provider is not configured; non-kernel action requires review."],
      policies: policies.map((p) => p.id).filter(Boolean),
      provider: "mock",
      fallback_used: true
    };
  }

  if (provider === "jev") return callJev({ action, policies });
  throw new Error(`Unsupported JEV_PROVIDER: ${provider}`);
}

async function callJev({ action, policies }) {
  const url = process.env.JEV_API_URL;
  const apiKey = process.env.JEV_API_KEY;
  if (!url || !apiKey) throw new Error("JEV_API_URL and JEV_API_KEY are required");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.JEV_TIMEOUT_MS || 3000));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ action, policies }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Jev provider returned HTTP ${response.status}`);
    return normalizeProviderResult(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeProviderResult(raw) {
  const allowed = new Set(["ALLOW", "DENY", "REQUIRE_HUMAN", "ESCALATE", "REVIEW"]);
  const decision = String(raw.decision || "").toUpperCase();
  if (!allowed.has(decision)) throw new Error("Invalid Jev decision");

  return {
    decision,
    confidence: clamp(Number(raw.confidence ?? 0)),
    reasons: Array.isArray(raw.reasons) ? raw.reasons.map(String) : [],
    policies: Array.isArray(raw.policies) ? raw.policies.map(String) : [],
    provider: "jev",
    fallback_used: false
  };
}

function clamp(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}
