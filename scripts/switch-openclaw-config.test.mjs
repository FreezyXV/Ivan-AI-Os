import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { switchOpenClawConfig } from "./switch-openclaw-config.mjs";

const digest = value => createHash("sha256").update(value).digest("hex");
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ivan-switch-test-"));
  const backupDir = join(root, "backup");
  mkdirSync(backupDir, { mode: 0o700 });
  const livePath = join(root, "live.json"), candidatePath = join(root, "candidate.json");
  const previous = Buffer.from('{"role":"old"}'), candidate = Buffer.from('{"role":"new"}');
  writeFileSync(livePath, previous, { mode: 0o600 });
  writeFileSync(candidatePath, candidate, { mode: 0o600 });
  return { root, backupDir, livePath, candidatePath, previous, candidate,
    expectedCurrentSha256: digest(previous) };
}

test("applies a validated config and keeps a private exact rollback snapshot", async () => {
  const f = fixture();
  try {
    let restarts = 0;
    const result = await switchOpenClawConfig({ ...f,
      validate: async () => true,
      restart: async () => { restarts++; },
      checkHealth: async () => true
    });
    assert.equal(result.status, "ACTIVE");
    assert.equal(restarts, 1);
    assert.deepEqual(readFileSync(f.livePath), f.candidate);
    assert.deepEqual(readFileSync(result.backup), f.previous);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("restores the exact prior config when health fails", async () => {
  const f = fixture();
  try {
    let restarts = 0;
    const result = await switchOpenClawConfig({ ...f,
      validate: async () => true,
      restart: async () => { restarts++; },
      checkHealth: async () => restarts === 2,
      healthTimeoutMs: 2,
      delay: async () => {}
    });
    assert.equal(result.status, "ROLLED_BACK");
    assert.equal(restarts, 2);
    assert.deepEqual(readFileSync(f.livePath), f.previous);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("refuses a changed source before writing or restarting", async () => {
  const f = fixture();
  try {
    let restarts = 0;
    await assert.rejects(switchOpenClawConfig({ ...f, expectedCurrentSha256: digest("stale"),
      validate: async () => true,
      restart: async () => { restarts++; },
      checkHealth: async () => true
    }), /SOURCE_FINGERPRINT_MISMATCH/);
    assert.equal(restarts, 0);
    assert.deepEqual(readFileSync(f.livePath), f.previous);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test("refuses a candidate changed while native validation runs", async () => {
  const f = fixture();
  try {
    let restarts = 0;
    await assert.rejects(switchOpenClawConfig({ ...f,
      validate: async () => {
        writeFileSync(f.candidatePath, '{"role":"tampered"}', { mode: 0o600 });
        return true;
      },
      restart: async () => { restarts++; },
      checkHealth: async () => true
    }), /CANDIDATE_CHANGED_DURING_VALIDATION/);
    assert.equal(restarts, 0);
    assert.deepEqual(readFileSync(f.livePath), f.previous);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});
