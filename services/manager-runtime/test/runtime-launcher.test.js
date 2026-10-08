import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

test("pinned runtime evaluates the builder workspace, not the release directory", { timeout: 15000 }, async () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "ivan-runtime-workspace-"));
  const workspace = path.join(scratch, "builder"), directory = path.join(scratch, "runtime");
  mkdirSync(workspace, { mode: 0o700 }); mkdirSync(path.join(workspace, "hooks"));
  const probe = net.createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL("../../../scripts/mac-jev-runtime.mjs", import.meta.url)), "--mock", "--stay"], {
    env: { PATH: process.env.PATH, HOME: process.env.HOME, IVAN_RUNTIME_DIR: directory, IVAN_WORKSPACE_ROOT: workspace, PORT: String(port) },
    stdio: ["ignore", "pipe", "ignore"]
  });
  child.stdout.resume();
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try { ready = (await fetch(`${base}/health`, { signal: AbortSignal.timeout(100) })).ok; } catch {}
      if (ready || child.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(ready, true);
    const token = readFileSync(path.join(directory, "decision-token"), "utf8");
    const response = await fetch(`${base}/v1/evaluate-tool`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ tool: "write", arguments: { path: path.join(workspace, "hooks/new.js") } }), signal: AbortSignal.timeout(1000) });
    const result = await response.json();
    assert.equal(result.reason_code, "PROTECTED_PROJECT_METADATA");
    assert.equal(result.executable, false);
  } finally {
    if (child.exitCode === null && child.signalCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
    rmSync(scratch, { recursive: true, force: true });
  }
});
