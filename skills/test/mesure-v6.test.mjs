import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { assembler } from "../rapport-telegram/corpus/pertinence-v1/assembler.mjs";

const dir = new URL("../rapport-telegram/corpus/mesure-v6/", import.meta.url);
const raw = readFileSync(new URL("fixtures.jsonl", dir));
const fixtures = raw.toString().trim().split("\n").map(l => JSON.parse(l));
const labels = JSON.parse(readFileSync(new URL("labels.json", dir), "utf8"));

test("mesure v6: 4-6 cases, labels separate and bound by hash, real and synthetic flagged", () => {
  assert.ok(fixtures.length >= 4 && fixtures.length <= 6);
  assert.equal(createHash("sha256").update(raw).digest("hex"), labels.fixturesSha256);
  assert.deepEqual(fixtures.map(f => f.id), labels.labels.map(l => l.id));
  for (const f of fixtures) for (const leak of ["selection", "livraison", "argument", "desaccords"]) assert.ok(!JSON.stringify(f).includes(`"${leak}"`), f.id);
  assert.ok(fixtures.every(f => f.reel));
  for (const f of fixtures.filter(f => !f.reel)) assert.match(f.item.url, /^https:\/\/example\.org\//, `${f.id} synthetic URL must be fictitious`);
});
test("control v2 never reuses a measured source", () => {
  const used = new Set();
  for (const prior of ["pertinence-v1/fixtures.jsonl", "calibration-jev-v1/inputs.jsonl", "controle-v2/fixtures.jsonl", "../benchmark/architecture-v1/fixtures.jsonl"])
    for (const line of readFileSync(new URL(`../${prior}`, dir), "utf8").trim().split("\n")) {
      const url = JSON.parse(line).item?.url;
      if (url) used.add(url);
    }
  for (const f of fixtures) assert.ok(!used.has(f.item.url), f.id);
});
test("control v2 assembles into the evaluator format", () => {
  const corpus = assembler(dir);
  assert.equal(corpus.cas.length, fixtures.length);
  assert.equal(corpus.fixturesSha256, labels.fixturesSha256);
});
