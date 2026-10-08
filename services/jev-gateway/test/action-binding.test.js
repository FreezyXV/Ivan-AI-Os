import test from "node:test";
import assert from "node:assert/strict";
import { canonicalJson, createKeyedBinding } from "../src/action-binding.js";
import { createTrustedEvaluator } from "../src/trusted-evaluator.js";

const token = "synthetic-binding-test-key-no-real-credential";

test("keyed binding preserves JSON semantics, tool identity, values and array order", () => {
  const bind = createKeyedBinding(token);
  const call = { tool: "message", arguments: { action: "send", target: "synthetic", message: "hello", list: [1, 2] } };
  assert.equal(bind(call), bind({ arguments: { list: [1, 2], message: "hello", target: "synthetic", action: "send" }, tool: "message" }));
  for (const different of [
    { ...call, tool: "exec" },
    { ...call, arguments: { ...call.arguments, target: "changed" } },
    { ...call, arguments: { ...call.arguments, list: [2, 1] } }
  ]) assert.notEqual(bind(call), bind(different));
  assert.notEqual(bind(call), createKeyedBinding(`${token}-rotated`)(call));
  assert.notEqual(bind(call), createKeyedBinding(token, "call-reference")(call));
  assert.match(bind(call), /^[a-f0-9]{64}$/);
});

test("capture rejects lossy JSON, getters, cycles and excessive size/depth", () => {
  let getterCalls = 0;
  const getter = { get field() { getterCalls++; return "private"; } };
  const circular = {}; circular.self = circular;
  let deep = {}; for (let i = 0; i < 22; i++) deep = { next: deep };
  for (const value of [undefined, NaN, Infinity, -0, 1n, () => {}, getter, circular, deep, new Date(), [undefined], Array(2), { x: "x".repeat(64_001) }]) {
    assert.throws(() => canonicalJson(value), /INVALID_CAPTURE/);
  }
  assert.equal(getterCalls, 0);
  const prototypeKey = JSON.parse('{"__proto__":{"polluted":true},"constructor":"data"}');
  assert.deepEqual(JSON.parse(canonicalJson(prototypeKey)), prototypeKey);
  assert.equal({}.polluted, undefined);
});

test("gateway returns and audits the binding of its own immutable snapshot", async () => {
  const events = [];
  const evaluator = createTrustedEvaluator({ token, audit: e => events.push(e) });
  const call = { tool: "message", arguments: { action: "send", target: "private-fixture" } };
  const result = await evaluator.evaluate(call);
  assert.equal(result.body.action_binding, createKeyedBinding(token)(call));
  assert.equal(events[0].action_binding, result.body.action_binding);
  assert.equal(JSON.stringify(events).includes("private-fixture"), false);
  assert.equal(result.body.executable, false);
  assert.equal((await evaluator.evaluate({ ...call, arguments: { action: undefined } })).status, 400);
});
