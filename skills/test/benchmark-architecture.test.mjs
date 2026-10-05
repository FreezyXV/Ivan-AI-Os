import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { rulesA, score } from "../rapport-telegram/scripts/benchmark-architecture.mjs";

const dir = new URL("../rapport-telegram/benchmark/architecture-v1/", import.meta.url);
const raw = readFileSync(new URL("fixtures.jsonl", dir));
const fixtures = raw.toString().trim().split("\n").map(l => JSON.parse(l));
const labels = JSON.parse(readFileSync(new URL("labels.json", dir), "utf8"));

test("benchmark: labels frozen and bound to fixtures; required situations present", () => {
  assert.equal(createHash("sha256").update(raw).digest("hex"), labels.fixturesSha256);
  assert.deepEqual(fixtures.map(f => f.id), labels.labels.map(l => l.id));
  for (const f of fixtures) for (const leak of ["selection", "livraison", "argument"]) assert.ok(!JSON.stringify(f).includes(`"${leak}"`), f.id);
  const cats = new Set(fixtures.map(f => f.categorie));
  for (const c of ["utile", "bruit", "plausible-insuffisant", "extrait-incomplet", "differe", "urgence", "injection", "non-lu"]) assert.ok(cats.has(c), c);
  assert.ok(labels.routage.length >= 4 && labels.pannes.length >= 3);
  assert.ok(labels.labels.some(l => l.selection === "keep" && l.livraison === "digest") && labels.labels.some(l => l.livraison === "immediat"));
});
test("benchmark sources are disjoint from every earlier measured corpus", () => {
  const prior = new Set();
  for (const f of ["../../corpus/calibration-jev-v1/inputs.jsonl", "../../corpus/pertinence-v1/fixtures.jsonl", "../../corpus/controle-v2/fixtures.jsonl"])
    for (const l of readFileSync(new URL(f, dir), "utf8").trim().split("\n")) { const u = JSON.parse(l).item?.url; if (u) prior.add(u); }
  for (const f of fixtures) assert.ok(!prior.has(f.item.url), f.id);
});
test("rules A apply code exclusions before any judgment", () => {
  const byId = Object.fromEntries(fixtures.map(f => [f.id, f.item]));
  assert.equal(rulesA(byId.A22).reason, "TOPIC_DEFERRED");
  assert.equal(rulesA(byId.A25).reason, "INJECTION_SUSPECTE");
  assert.equal(rulesA(byId.A26).reason, "SOURCE_NOT_READ");
});
test("scorer: an always-review system is not a success; errors count as abstentions", () => {
  const always = labels.labels.map(l => ({ id: l.id, decision: "review" }));
  const s = score(labels, always);
  assert.equal(s.noiseKept, 0);
  assert.equal(s.keepFound, "0/5");
  assert.ok(s.abstentionPct === 100 && s.exactPct < 40, "zero noise by abstaining everywhere must not look good");
  const failing = score(labels, [{ id: "A01", error: "JEV_UNAVAILABLE", ms: 10000, calls: 1 }]);
  assert.equal(failing.errors, 1); assert.equal(failing.matrix["keep>review"], 1);
  const urgent = score(labels, [{ id: "A01", decision: "keep", delivery: "immediat" }, { id: "A24", decision: "keep", delivery: "digest" }]);
  assert.equal(urgent.falseUrgent, 1); assert.equal(urgent.urgency, "0/1");
});
