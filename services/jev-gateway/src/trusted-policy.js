import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultPolicyRoot = fileURLToPath(new URL("../../../policies/kernel/", import.meta.url));
const definitions = [
  ["human-approval", "require_human"],
  ["destructive-actions", "require_human"],
  ["policy-integrity", "require_human"],
  ["secrets", "deny"]
];
const knownTools = new Set(["read", "write", "edit", "apply_patch", "message", "exec", "gateway", "plugins"]);

export class TrustedInputError extends Error {
  constructor() { super("INVALID_TOOL_CALL"); }
}

// These four policies are global. Keep their full, bounded source text instead
// of maintaining another copy of their prose or accepting summaries from callers.
// This is a fixed catalog loader, not a general YAML parser or policy language.
export function loadPolicyCatalog(root = defaultPolicyRoot) {
  const hash = createHash("sha256");
  const policies = definitions.map(([name, effect]) => {
    const id = `kernel.${name}`;
    const source = readFileSync(path.join(root, `${name}.yaml`), "utf8");
    if (Buffer.byteLength(source) > 2000) throw new Error("INVALID_POLICY_CATALOG");
    for (const [key, value] of Object.entries({ id, version: "1", scope: "global", effect, fail_mode: "closed", mutable_by_agents: "false" })) {
      const lines = source.split(/\r?\n/).filter(line => line.startsWith(`${key}:`));
      if (lines.length !== 1 || lines[0] !== `${key}: ${value}`) throw new Error("INVALID_POLICY_CATALOG");
    }
    hash.update(id).update("\0").update(source).update("\0");
    return Object.freeze({ id, description: source });
  });
  return Object.freeze({ revision: hash.digest("hex"), policies: Object.freeze(policies) });
}

export function validateToolCall(payload) {
  if (!record(payload) || Object.keys(payload).some(k => !["tool", "arguments"].includes(k)) ||
      typeof payload.tool !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(payload.tool) || !record(payload.arguments)) {
    throw new TrustedInputError();
  }
  return payload;
}

// Only trusted code derives these flags. All free text, addresses, commands and
// file contents stay local, and no unrecognized tool is treated as safe.
export function classifyToolCall(call, workspaceRoot) {
  const tool = knownTools.has(call.tool) ? call.tool : "unknown";
  const action = {
    tool, intent: "Unclassified concrete tool call", risk: "high",
    external_contact: false, financial_action: false, policy_mutation: false, destructive: false
  };
  if (tool === "unknown") return { action, reason: "UNKNOWN_TOOL" };
  if (tool === "exec") return { action, hardDecision: "REQUIRE_HUMAN", reason: "SHELL_REQUIRES_REVIEW" };
  if (tool === "gateway" || tool === "plugins") {
    return { action: { ...action, policy_mutation: true }, reason: "RUNTIME_CONFIGURATION" };
  }
  if (tool === "message") {
    if (typeof call.arguments.action !== "string") throw new TrustedInputError();
    // Treat every messaging operation conservatively until a trusted adapter
    // distinguishes read-only operations and Ivan's own reporting destination.
    return { action: { ...action, external_contact: true }, reason: "MESSAGING_REQUIRES_APPROVAL" };
  }
  if (tool === "apply_patch") {
    // A patch can contain many paths/operations. Do not approximate its effects.
    return { action, hardDecision: "REVIEW", reason: "PATCH_INSPECTION_PENDING" };
  }
  const requestedPath = call.arguments.path;
  if (typeof requestedPath !== "string" || !requestedPath.trim() || requestedPath.length > 4096 || requestedPath.includes("\0")) {
    throw new TrustedInputError();
  }
  if (!workspaceRoot || !path.isAbsolute(workspaceRoot)) return { action, reason: "WORKSPACE_NOT_CONFIGURED" };
  const root = realpathSync(workspaceRoot);
  const resolved = path.resolve(root, requestedPath);
  // Check the requested path before resolution so a missing secret file is
  // still reported as sensitive rather than PATH_NOT_RESOLVED.
  const denySensitive = { action, hardDecision: "DENY", reason: "SENSITIVE_PATH" };
  if (sensitivePath(resolved)) return denySensitive;
  let canonical, exists = true;
  try { canonical = realpathSync(resolved); }
  catch (error) {
    exists = false;
    // For new files, resolve the nearest existing ancestor as well. This
    // catches an ordinary directory alias whose destination is protected.
    canonical = error.code === "ENOENT" ? resolveMissingDestination(resolved) : null;
    if (!canonical) {
      if (tool !== "read" && protectedPath(resolved)) return protectedWrite(action);
      return { action, reason: "PATH_NOT_RESOLVED" };
    }
  }
  if (sensitivePath(canonical)) return denySensitive;
  const paths = [resolved, canonical];
  if (paths.some(p => outside(root, p))) return { action, reason: "OUTSIDE_WORKSPACE" };
  if (tool !== "read" && paths.some(protectedPath)) return protectedWrite(action);
  if (!exists) return { action, reason: "PATH_NOT_RESOLVED" };
  return {
    action: { ...action, intent: tool === "read" ? "Read an existing ordinary project file" : "Modify an existing ordinary project file", risk: tool === "read" ? "low" : "medium" },
    consultProvider: true, reason: "ORDINARY_PROJECT_FILE"
  };
}

function sensitivePath(p) {
  return /(?:^|\/)(?:\.env(?:\.[^/]*)?|(?:secrets?|credentials?)(?:[._-][^/]*)?|auth-profiles\.json|openclaw\.json|\.ssh|\.aws|\.gnupg)(?:\/|$)|\.(?:pem|key)$/i.test(p);
}
function protectedPath(p) {
  return /(?:^|\/)(?:policies|constitution|hooks|\.git|\.github|\.agents|\.codex|\.claude)(?:\/|$)|(?:^|\/)(?:AGENTS|CLAUDE)\.md$/i.test(p);
}
function protectedWrite(action) {
  return { action: { ...action, policy_mutation: true }, reason: "PROTECTED_PROJECT_METADATA" };
}
function resolveMissingDestination(target) {
  let parent = path.dirname(target);
  for (;;) {
    try { return path.resolve(realpathSync(parent), path.relative(parent, target)); }
    catch (error) { if (error.code !== "ENOENT") return null; }
    const next = path.dirname(parent);
    if (next === parent) return null;
    parent = next;
  }
}
function outside(root, target) {
  const relative = path.relative(root, target);
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}
function record(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
