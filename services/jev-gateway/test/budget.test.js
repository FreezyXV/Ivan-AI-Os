import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, chmodSync, symlinkSync, unlinkSync, statSync } from "node:fs";
import { createJevBudget, PRICED_MODEL } from "../src/budget.js";
import { askTypeSafe } from "../src/provider.js";
import { testBudget } from "./helpers.js";

test("durable budget settles metered calls, retains unknown usage, and rejects double refunds", t => {
  const { budget, filename } = testBudget(t);
  const first = budget.reserve();
  assert.equal(budget.status().usage_unknown_calls, 1);
  first.complete(300);
  assert.equal(budget.status().charged_micro_eur, 13);
  assert.equal(budget.status().reported_input_tokens, 300);
  assert.throws(() => first.complete(300), { code: "BUDGET_RECEIPT_USED" });
  budget.reserve(); // Simulates interruption before usage is returned.
  const restarted = createJevBudget({ filename });
  assert.equal(restarted.status().calls, 2);
  assert.equal(restarted.status().usage_unknown_calls, 1);
  assert.equal(restarted.status().charged_micro_eur, 2766);
  assert.equal(statSync(filename).mode & 0o777, 0o600);
  assert.equal(readFileSync(filename, "utf8").includes("arguments"), false);
});

test("shared instances reserve before completion, cannot overspend and can release only their own reserve", t => {
  const { budget, filename } = testBudget(t, { monthlyMicroEuro: 5000 });
  const peer = createJevBudget({ filename, monthlyMicroEuro: 5000 });
  const first = budget.reserve();
  assert.throws(() => peer.reserve(), { code: "JEV_BUDGET_EXHAUSTED" });
  first.complete(100);
  const second = peer.reserve(); second.complete(undefined);
  assert.equal(budget.status().calls, 2);
  assert.equal(budget.status().charged_micro_eur, 2758);
});

test("UTC rollover keeps an in-flight charge in its original month", t => {
  let time = "2026-09-30T23:59:59Z";
  const { budget, filename } = testBudget(t, { now: () => new Date(time), monthlyMicroEuro: 5000 });
  const old = budget.reserve();
  time = "2026-10-01T00:00:01Z";
  const current = budget.reserve();
  old.complete(300); current.complete(200);
  const state = JSON.parse(readFileSync(filename, "utf8"));
  assert.equal(state.months["2026-09"].charged_micro_eur, 13);
  assert.equal(budget.status().month, "2026-10");
  assert.equal(budget.status().charged_micro_eur, 9);
  assert.equal(budget.status().calls, 1);
  time = "2026-09-30T23:59:59Z";
  assert.throws(() => budget.reserve(), { code: "BUDGET_CLOCK_ROLLBACK" });
});

test("unsafe, corrupt or locked ledgers fail closed without resetting consumption", t => {
  const { budget, filename } = testBudget(t);
  budget.reserve();
  const original = readFileSync(filename);
  chmodSync(filename, 0o644);
  assert.throws(() => budget.reserve(), { code: "BUDGET_STORAGE_UNAVAILABLE" });
  chmodSync(filename, 0o600);
  writeFileSync(`${filename}.lock`, "synthetic stale lock", { mode: 0o600 });
  assert.throws(() => budget.reserve(), { code: "BUDGET_BUSY" });
  unlinkSync(`${filename}.lock`);
  assert.deepEqual(readFileSync(filename), original);
  const linked = `${filename}.alias`; symlinkSync(filename, linked);
  assert.throws(() => createJevBudget({ filename: linked }).reserve(), { code: "BUDGET_STORAGE_UNAVAILABLE" });
  writeFileSync(filename, "invalid JSON");
  assert.throws(() => budget.reserve(), { code: "BUDGET_STORAGE_UNAVAILABLE" });
  assert.equal(readFileSync(filename, "utf8"), "invalid JSON");
});

test("budget refusal prevents any provider fetch; failed requests remain accounted", async t => {
  const saved = { key: process.env.TYPESAFE_API_KEY, model: process.env.JEV_MODEL };
  process.env.TYPESAFE_API_KEY = "synthetic-provider-fixture";
  process.env.JEV_MODEL = PRICED_MODEL;
  let calls = 0;
  const { budget } = testBudget(t, { monthlyMicroEuro: 5000 });
  const options = { budget, fetchImpl: async () => { calls++; throw new Error("private-provider-error-not-for-output"); } };
  try {
    await assert.rejects(askTypeSafe({ task: "synthetic" }, {}, options), { code: "TYPESAFE_NETWORK_ERROR" });
    await assert.rejects(askTypeSafe({ task: "synthetic" }, {}, options), { code: "JEV_BUDGET_EXHAUSTED" });
    assert.equal(calls, 1);
    assert.equal(budget.status().usage_unknown_calls, 1);
    process.env.JEV_MODEL = "unpriced-model";
    await assert.rejects(askTypeSafe({}, {}, options), { code: "TYPESAFE_MODEL_NOT_PRICED" });
    assert.equal(calls, 1);
  } finally {
    for (const [name, value] of [["TYPESAFE_API_KEY", saved.key], ["JEV_MODEL", saved.model]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
