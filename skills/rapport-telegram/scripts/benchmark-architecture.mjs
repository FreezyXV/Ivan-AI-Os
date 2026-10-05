// Architecture benchmark (Claude, 2026-10-05). Architecture A = deterministic rules only.
// The rules below were written on calibration-jev-v1 "dev" ONLY, then frozen before being run
// on benchmark/architecture-v1. The scorer reads any architecture's outputs (A, B = rules+Jev,
// C = rules+one LLM judge/writer, D = targeted) in the same JSONL shape:
//   {"id","decision":"keep|review|skip","delivery"?:"silence|digest|immediat","ms"?,"calls"?,"error"?}
// Usage: node benchmark-architecture.mjs rules <fixtures.jsonl>      → A outputs (no network)
//        node benchmark-architecture.mjs score <labels.json> <outputs.jsonl>
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SECURITY = /\b(?:CVE-\d|GHSA-|remote code execution|security (?:release|update|fix|issue)|vulnerabilit|privilege[- ]escalat|exploit)/i;
const COST = /(?:\bprice|\bpricing|\bcheaper|\bcost|\ballowance|\busage limit|\$\d|per million tokens)/i;
const MACRO = /\b(?:inflation|interest rates?|deposit facility|basis points|staff projections?)\b/i;
const STACK = /\b(?:next\.?js|node\.?js|openclaw|codex|claude|anthropic|openai|gpt-\d|telegram|jev|typesafe)\b/i;
const INJECTION = /ignore\s+(?:(?:all|your|previous)\s+)*instructions|note to ai|(?:include|send|reveal)\b[^.!?]{0,80}\b(?:secret|token|api[ -]?key)/i;
const ACTIVE = ["business", "finance", "engineering", "system"];

export function rulesA(item) {
  if (!ACTIVE.includes(item.topic)) return { decision: "skip", reason: "TOPIC_DEFERRED" };
  if (item.sourceStatus !== "read") return { decision: "review", reason: "SOURCE_NOT_READ" };
  const text = `${item.title} ${item.excerpt}`;
  if (INJECTION.test(text)) return { decision: "review", reason: "INJECTION_SUSPECTE" };
  const digits = /\d/.test(item.excerpt);
  if (SECURITY.test(text) && STACK.test(text)) return { decision: "keep", reason: "SECURITY_ON_STACK" };
  if (COST.test(text) && STACK.test(text) && digits) return { decision: "keep", reason: "COST_ON_STACK" };
  if (item.topic === "finance" && MACRO.test(text) && digits) return { decision: "keep", reason: "MACRO_DATA" };
  return { decision: "skip", reason: "NO_RULE" };
}

const ratio = (a, b) => (b ? Math.round((100 * a) / b) : null);
const pct = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };

const DECISIONS = ["keep", "review", "skip"], DELIVERIES = ["silence", "digest", "immediat"];
// Every labelled id must have exactly one valid output. Missing, duplicated, unknown or invalid
// rows are reported and counted (missing → its own matrix cell), never silently ignored.
export function score(labels, outputs) {
  const byId = new Map(labels.labels.filter(l => l.selection).map(l => [l.id, l])), m = {}, ms = [], seen = new Map();
  const coverage = { missing: [], duplicates: [], unknown: [], invalid: [] };
  let calls = 0, errors = 0, urgencyOk = 0, urgencyTotal = 0, falseUrgent = 0;
  for (const o of outputs) {
    if (!byId.has(o?.id)) { coverage.unknown.push(o?.id ?? null); continue; }
    if (seen.has(o.id)) { coverage.duplicates.push(o.id); continue; }
    seen.set(o.id, o);
    if (!o.error && (!DECISIONS.includes(o.decision) || (o.delivery !== undefined && !DELIVERIES.includes(o.delivery)))) coverage.invalid.push(o.id);
  }
  for (const [id, l] of byId) {
    const o = seen.get(id);
    if (!o) { coverage.missing.push(id); m[`${l.selection}>missing`] = (m[`${l.selection}>missing`] ?? 0) + 1; continue; }
    if (o.error) errors++;
    const decision = o.error || coverage.invalid.includes(id) ? "review" : o.decision;
    m[`${l.selection}>${decision}`] = (m[`${l.selection}>${decision}`] ?? 0) + 1;
    if (Number.isFinite(o.ms)) ms.push(o.ms);
    calls += Number.isFinite(o.calls) ? o.calls : 0;
    if (l.livraison === "immediat") { urgencyTotal++; if (o.delivery === "immediat") urgencyOk++; }
    else if (o.delivery === "immediat") falseUrgent++;
  }
  coverage.complete = !coverage.missing.length && !coverage.duplicates.length && !coverage.unknown.length && !coverage.invalid.length;
  const g = k => m[k] ?? 0, n = byId.size;
  const keeps = ["keep", "review", "skip", "missing"].reduce((s, d) => s + g(`keep>${d}`), 0);
  return { n, coverage, matrix: m, keepFound: `${g("keep>keep")}/${keeps}`, noiseKept: g("skip>keep") + g("review>keep"),
    usefulDropped: g("keep>skip"), abstentionPct: ratio(g("keep>review") + g("review>review") + g("skip>review"), n),
    exactPct: ratio(g("keep>keep") + g("review>review") + g("skip>skip"), n),
    urgency: urgencyTotal ? `${urgencyOk}/${urgencyTotal}` : "n/a", falseUrgent, msP50: pct(ms, 0.5), msP95: pct(ms, 0.95), calls, errors };
}

const lines = f => readFileSync(f, "utf8").trim().split("\n").map(l => JSON.parse(l));
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "rules") for (const f of lines(a)) { const r = rulesA(f.item); console.log(JSON.stringify({ id: f.id, ...r, delivery: r.decision === "keep" ? "digest" : "silence", ms: 0, calls: 0 })); }
  else if (cmd === "score") console.log(JSON.stringify(score(JSON.parse(readFileSync(a, "utf8")), lines(b)), null, 1));
  else { console.error("usage: rules <fixtures.jsonl> | score <labels.json> <outputs.jsonl>"); process.exit(2); }
}
