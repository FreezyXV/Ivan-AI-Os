import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, chmodSync, symlinkSync } from "node:fs";
import path from "node:path";
import { readDecisionToken } from "../src/runtime-token.js";
import { testBudget } from "./helpers.js";

const token = "synthetic-runtime-file-credential-for-tests";
test("private runtime file supplies a token without a secret config field", t => {
  const { directory } = testBudget(t);
  const filename = path.join(directory, "decision-token");
  assert.equal(readDecisionToken({ IVAN_DECISION_TOKEN_FILE: filename }), undefined);
  writeFileSync(filename, token, { mode: 0o600 });
  assert.equal(readDecisionToken({ IVAN_DECISION_TOKEN_FILE: filename }), token);
  assert.equal(readDecisionToken({ IVAN_DECISION_TOKEN: token }), token);
});
test("unsafe permissions, symlinks and malformed runtime secrets never yield a token", t => {
  const { directory } = testBudget(t);
  const filename = path.join(directory, "decision-token");
  writeFileSync(filename, token, { mode: 0o600 });
  chmodSync(filename, 0o644);
  assert.throws(() => readDecisionToken({ IVAN_DECISION_TOKEN_FILE: filename }), /RUNTIME_SECRET_UNAVAILABLE/);
  chmodSync(filename, 0o600);
  symlinkSync(filename, `${filename}.link`);
  assert.throws(() => readDecisionToken({ IVAN_DECISION_TOKEN_FILE: `${filename}.link` }), /RUNTIME_SECRET_UNAVAILABLE/);
  assert.throws(() => readDecisionToken({ IVAN_DECISION_TOKEN: "invalid" }), /RUNTIME_SECRET_UNAVAILABLE/);
  assert.throws(() => readDecisionToken({ IVAN_DECISION_TOKEN_FILE: "relative-file" }), /RUNTIME_SECRET_UNAVAILABLE/);
});
