// Client for registered Jev questions (POST /v1/classify on the authenticated gateway). Callers
// pass a question id and PUBLIC inputs only; the gateway owns the question text, the budget and
// the audit. Until Codex opens a question the call fails closed: JEV_QUESTION_UNAVAILABLE.
// Usage: echo '{"titre":"…"}' | node classify.mjs <question-id>
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readDecisionToken } from "../../../services/jev-gateway/src/runtime-token.js";

export const QUESTIONS = Object.freeze({
  "sujet.captivant": { type: "noul", fields: ["titre", "langue", "vues", "jours"] },
  "sujet.domaine": { type: "choice", fields: ["titre", "langue", "domaines"] },
  "source.fiable": { type: "choice", fields: ["domaine", "titre", "extrait", "type_affirmation"] },
  "publication.prete": { type: "noul", fields: ["slug", "resume_verification", "mots", "visuel", "validateur"] },
  "signal.pertinent": { type: "noul", fields: ["titre", "extrait", "type"] },
  "preuve.suffisante": { type: "choice", fields: ["critere", "note", "titre", "extrait"] },
  "alerte.importante": { type: "noul", fields: ["indicateur", "ancien", "nouveau", "seuil"] },
  "memoire.contradiction": { type: "noul", fields: ["titre_a", "titre_b", "valeurs_a", "valeurs_b"] },
  "tache.categorie": { type: "choice", fields: ["titre", "extensions"] },
  "constat.severite": { type: "choice", fields: ["resume", "type_preuve"] }
});
const CREDENTIALS = /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bBearer\s+\S{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/i;

export class JevError extends Error {}
const fail = code => { throw new JevError(code); };

export function buildRequest(question, input) {
  const spec = QUESTIONS[question];
  if (!spec) fail("JEV_QUESTION_UNKNOWN");
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("JEV_INPUT_INVALID");
  const extra = Object.keys(input).filter(k => !spec.fields.includes(k));
  if (extra.length) fail(`JEV_INPUT_FIELD_REFUSED_${extra[0]}`);
  for (const [k, v] of Object.entries(input)) {
    if (!["string", "number", "boolean"].includes(typeof v)) fail(`JEV_INPUT_TYPE_${k}`);
    if (typeof v === "string" && v.length > 500) fail(`JEV_INPUT_TOO_LONG_${k}`);
  }
  if (CREDENTIALS.test(JSON.stringify(input))) fail("JEV_INPUT_CREDENTIAL_REFUSED");
  return { question, input };
}

// Returns { question, decision, confidence, request_id, provider } or throws a JevError code.
export async function classify(question, input, { gatewayUrl = process.env.IVAN_GATEWAY_URL ?? "http://127.0.0.1:4311", token, fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const body = buildRequest(question, input);
  const url = new URL(gatewayUrl);
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/" || url.search) fail("JEV_GATEWAY_MUST_BE_LOOPBACK");
  let secret = token;
  if (secret === undefined) { try { secret = readDecisionToken(); } catch { fail("JEV_TOKEN_UNAVAILABLE"); } }
  if (!secret) fail("JEV_TOKEN_UNAVAILABLE");
  let response;
  try {
    response = await fetchImpl(new URL("/v1/classify", url), { method: "POST", redirect: "error", signal: AbortSignal.timeout(timeoutMs),
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` }, body: JSON.stringify(body) });
  } catch { fail("JEV_UNAVAILABLE"); }
  if (response.status === 404) fail("JEV_QUESTION_UNAVAILABLE");
  if (!response.ok) fail(`JEV_HTTP_${response.status}`);
  const r = await response.json().catch(() => fail("JEV_RESPONSE_INVALID"));
  const valid = r?.question === question && typeof r.request_id === "string" && Number.isFinite(r.confidence) && r.confidence >= 0 && r.confidence <= 1 &&
    (QUESTIONS[question].type === "noul" ? Number.isFinite(r.decision) && r.decision >= 0 && r.decision <= 1 : typeof r.decision === "string");
  if (!valid) fail("JEV_RESPONSE_INVALID");
  return { question, decision: r.decision, confidence: r.confidence, request_id: r.request_id, provider: String(r.provider ?? "jev") };
}

// Bounded parallelism for batches: order preserved; each item resolves to {ok, value} or
// {ok:false, code}. Callers decide what a failure means (fail closed per item).
export async function pool(items, worker, concurrency = 4) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const i = next++;
      try { results[i] = { ok: true, value: await worker(items[i], i) }; }
      catch (error) { results[i] = { ok: false, code: error instanceof JevError ? error.message : "JEV_UNAVAILABLE" }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const [question] = process.argv.slice(2);
  try {
    const input = JSON.parse(readFileSync(0, "utf8") || "{}");
    console.log(JSON.stringify(await classify(question, input)));
  } catch (error) {
    console.error(error instanceof JevError ? error.message : "JEV_ERROR");
    process.exitCode = 1;
  }
}
