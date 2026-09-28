import test from "node:test";
import assert from "node:assert/strict";
import { evaluateKernel } from "../src/kernel.js";

test("financial action requires human", () => {
  const result = evaluateKernel({ financial_action: true, risk: "low" });
  assert.equal(result.decision, "REQUIRE_HUMAN");
  assert.equal(result.confidence, 1);
});

test("external contact requires human", () => {
  const result = evaluateKernel({ external_contact: true, risk: "low" });
  assert.equal(result.decision, "REQUIRE_HUMAN");
});

test("ordinary low-risk action continues to Jev", () => {
  assert.equal(evaluateKernel({ risk: "low" }), null);
});
