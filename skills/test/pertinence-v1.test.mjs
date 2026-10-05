import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const dir = new URL("../rapport-telegram/corpus/pertinence-v1/", import.meta.url);
const raw = readFileSync(new URL("fixtures.jsonl", dir));
const fixtures = raw.toString().split("\n").filter(Boolean).map(l => JSON.parse(l));
const labels = JSON.parse(readFileSync(new URL("labels.json", dir), "utf8"));

test("fixtures and expected answers are separate and bound by hash", () => {
  assert.equal(createHash("sha256").update(raw).digest("hex"), labels.fixturesSha256);
  assert.deepEqual(fixtures.map(f => f.id), labels.labels.map(l => l.id));
  assert.ok(fixtures.length >= 12 && fixtures.length <= 16);
  for (const f of fixtures) for (const leak of ["selection", "livraison", "argument", "desaccords", "attendu", "raison"])
    assert.ok(!JSON.stringify(f).includes(`"${leak}"`), `${f.id} leaks ${leak}`);
});

test("labels are argued before measurement and cover the required situations", () => {
  for (const l of labels.labels) assert.ok(l.argument.length >= 40 && l.desaccords.length >= 5, l.id);
  const by = key => labels.labels.map(l => l[key]);
  for (const s of ["keep", "review", "skip"]) assert.ok(by("selection").includes(s), s);
  for (const d of ["silence", "digest", "immediat"]) assert.ok(by("livraison").includes(d), d);
  for (const r of ["TOPIC_DEFERRED", "SOURCE_STALE", "SOURCE_NOT_READ"]) assert.ok(by("raison").includes(r), r);
  assert.ok(fixtures.some(f => f.demande), "mixed-task request");
  for (const l of labels.labels.filter(l => l.selection !== "keep" && l.selection)) assert.equal(l.livraison, "silence", l.id);
});

test("sources are new, public, read within 1200 characters, real ones hashed", () => {
  const used = new Set(labels.sourcesDejaUtilisees);
  for (const f of fixtures.filter(f => f.item)) {
    assert.ok(!used.has(f.item.url), `${f.id} reuses ${f.item.url}`);
    assert.equal(f.item.scope, "public");
    assert.ok(f.item.excerpt.length <= 1200);
    if (f.item.sourceStatus === "read") assert.ok(f.item.excerpt.length >= 20, f.id);
    if (f.reel && f.item.sourceStatus === "read") assert.match(f.lecture.sha256Texte, /^[0-9a-f]{64}$/, f.id);
  }
  assert.ok(fixtures.filter(f => f.reel).length >= 10, "mostly real sources");
});
