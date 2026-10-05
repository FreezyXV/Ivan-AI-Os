// Claude Code PreToolUse adapter for the Jev Gateway (POST /v1/evaluate-tool).
// Modes (IVAN_CLAUDE_HOOK_MODE):
//   shadow (default) — evaluate and audit on the gateway side; never influences the tool call.
//   ask              — a DENY/REQUIRE_HUMAN/ESCALATE opinion asks Ivan to confirm the call.
//   gate             — level-0 rules first (rules.mjs): "never" is refused with its reason (no
//                      network), "autonome" skips the gateway, the rest goes to the gateway (kernel
//                      + Jev) for audit only: Ivan delegated autonomy (2026-09-29), so gate never asks.
// No mode ever returns "allow": the runtime's own permission system stays in charge.
// Any failure (no token, gateway down, timeout, bad response) leaves Claude Code unaffected.
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readDecisionToken } from "../../services/jev-gateway/src/runtime-token.js";
import { classifyCommand, classifyPath } from "./rules.mjs";

const DEFAULT_GATEWAY = "http://127.0.0.1:4310";
const OPINIONS_NEEDING_IVAN = new Set(["DENY", "REQUIRE_HUMAN", "ESCALATE"]);

// Resolve symlinked prefixes (e.g. macOS /var → /private/var) so the gateway sees the
// same canonical path as its workspace root; otherwise an alias looks "outside".
export function canonicalPath(file) {
  if (!path.isAbsolute(file)) return file;
  let existing = file;
  while (!existsSync(existing) && path.dirname(existing) !== existing) existing = path.dirname(existing);
  try { return path.join(realpathSync(existing), path.relative(existing, file)); } catch { return file; }
}

// Mutating tools only: reads would spend budget for little value. Only the fields the
// gateway classifies on are sent; file contents never leave Claude Code.
export function toToolCall(input) {
  const args = input?.tool_input;
  if (!args || typeof args !== "object") return null;
  const raw = args.file_path ?? args.notebook_path;
  const file = typeof raw === "string" ? canonicalPath(raw) : raw;
  switch (input.tool_name) {
    case "Write": return typeof file === "string" ? { tool: "write", arguments: { path: file } } : null;
    case "Edit":
    case "MultiEdit":
    case "NotebookEdit": return typeof file === "string" ? { tool: "edit", arguments: { path: file } } : null;
    case "Bash": return typeof args.command === "string" ? { tool: "exec", arguments: { command: args.command } } : null;
    default: return null;
  }
}

export function gatewayEndpoint(gatewayUrl = DEFAULT_GATEWAY) {
  const url = new URL(gatewayUrl);
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/") throw new Error("GATEWAY_MUST_BE_LOOPBACK");
  return new URL("/v1/evaluate-tool", url);
}

export async function evaluate(call, { gatewayUrl, token, fetchImpl = fetch, timeoutMs = 3000 }) {
  const response = await fetchImpl(gatewayEndpoint(gatewayUrl), {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(timeoutMs),
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(call)
  });
  // 401/503 etc. mean "no opinion", not an opinion needing Ivan.
  if (!response.ok) throw new Error("GATEWAY_UNAVAILABLE");
  const body = await response.json();
  if (typeof body?.decision !== "string" || body.executable !== false) throw new Error("GATEWAY_INVALID_RESPONSE");
  return { decision: body.decision, reason_code: String(body.reason_code ?? "") };
}

// Claude Code hook output; null means "say nothing".
export function hookOutput(result, mode) {
  if (mode !== "ask" || !OPINIONS_NEEDING_IVAN.has(result.decision)) return null;
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: `Jev Gateway (advisory): ${result.decision} — ${result.reason_code || "no reason"}`
    }
  };
}

export function denyOutput(reason) {
  return { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: `Ivan AI OS (règle niveau 0) : ${reason}` } };
}

export async function run(input, { env = process.env, fetchImpl = fetch, readToken = readDecisionToken } = {}) {
  const call = toToolCall(input);
  if (!call) return null;
  const mode = ["ask", "gate"].includes(env.IVAN_CLAUDE_HOOK_MODE) ? env.IVAN_CLAUDE_HOOK_MODE : "shadow";
  if (mode === "gate") {
    const rule = call.tool === "exec" ? classifyCommand(call.arguments.command) : classifyPath(call.arguments.path);
    // A refusal with its reason spares the agent retries: the rule is decided by code, not a model.
    if (rule.verdict === "never") return denyOutput(rule.raison);
    if (rule.verdict === "autonome") return null;
  }
  let token;
  try { token = readToken(env); } catch { return null; }
  if (!token) return null;
  try {
    const result = await evaluate(call, { gatewayUrl: env.IVAN_GATEWAY_URL, token, fetchImpl, timeoutMs: Number(env.IVAN_CLAUDE_HOOK_TIMEOUT_MS) || 3000 });
    return hookOutput(result, mode === "ask" ? "ask" : "shadow");
  } catch { return null; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let raw = "";
  for await (const chunk of process.stdin) { raw += chunk; if (raw.length > 1_000_000) break; }
  let input = null;
  try { input = JSON.parse(raw); } catch {}
  const output = input ? await run(input) : null;
  if (output) process.stdout.write(JSON.stringify(output));
  process.exit(0);
}
