import { createHmac } from "node:crypto";

export const MAX_CAPTURE_BYTES = 64_000;

// Shared wire contract: canonical JSON with budgets and no getter/toJSON calls.
// Reject values that cannot describe a JSON tool call instead of dropping them.
export function canonicalJson(value) {
  let nodes = 0;
  let bytes = 0;
  function emit(text) {
    bytes += Buffer.byteLength(text);
    if (bytes > MAX_CAPTURE_BYTES) throw new Error("INVALID_CAPTURE");
    return text;
  }
  function visit(input, depth) {
    if (++nodes > 10_000 || depth > 20) throw new Error("INVALID_CAPTURE");
    if (input === null || typeof input === "boolean") return emit(JSON.stringify(input));
    if (typeof input === "number" && Number.isFinite(input) && !Object.is(input, -0)) return emit(JSON.stringify(input));
    if (typeof input === "string" && input.length <= MAX_CAPTURE_BYTES) return emit(JSON.stringify(input));
    if (typeof input !== "object" || input === null || Object.getOwnPropertySymbols(input).length) throw new Error("INVALID_CAPTURE");
    const descriptors = Object.getOwnPropertyDescriptors(input);
    if (Array.isArray(input)) {
      if (input.length > 10_000 || Object.keys(descriptors).length !== input.length + 1) throw new Error("INVALID_CAPTURE");
      const parts = [];
      for (let i = 0; i < input.length; i++) {
        const d = descriptors[i];
        if (!d || !Object.hasOwn(d, "value")) throw new Error("INVALID_CAPTURE");
        parts.push(visit(d.value, depth + 1));
      }
      emit("[]" + ",".repeat(Math.max(0, parts.length - 1)));
      return `[${parts.join(",")}]`;
    }
    if (![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new Error("INVALID_CAPTURE");
    const parts = [];
    for (const key of Object.keys(descriptors).sort()) {
      if (key.length > MAX_CAPTURE_BYTES) throw new Error("INVALID_CAPTURE");
      const d = descriptors[key];
      if (!d.enumerable || !Object.hasOwn(d, "value")) throw new Error("INVALID_CAPTURE");
      parts.push(`${emit(JSON.stringify(key))}${emit(":")}${visit(d.value, depth + 1)}`);
    }
    emit("{}" + ",".repeat(Math.max(0, parts.length - 1)));
    return `{${parts.join(",")}}`;
  }
  return visit(value, 0);
}

export function createKeyedBinding(token, domain = "action") {
  if (typeof token !== "string" || token.length < 32 || /\s/.test(token) || !["action", "call-reference"].includes(domain)) throw new Error("INVALID_BINDING_CONFIG");
  return value => createHmac("sha256", token).update(`ivan-ai-os:${domain}:v1\0`).update(canonicalJson(value)).digest("hex");
}
