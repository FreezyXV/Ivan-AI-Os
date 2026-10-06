import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Reproduced by Codex during a restore on a copy: importing a skill module from stdin
// (`node --input-type=module -`, process.argv[1] === "-") threw ENOENT in the CLI guard.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const MODULES = ["jev-decision/scripts/classify.mjs", "business-engine/scripts/signals.mjs", "finance-engine/scripts/veille.mjs",
  "finance-engine/scripts/dca.mjs", "memoire-obsidian/scripts/memoire.mjs", "system-steward/scripts/audit.mjs",
  "system-steward/scripts/jardinier.mjs", "usine-logicielle/scripts/usine.mjs", "verification-affirmations/scripts/affirmations.mjs",
  "encyclopedie-anakalypto/scripts/sujets.mjs", "encyclopedie-anakalypto/scripts/porte_jev.mjs"];

test("every skill module imports from stdin without running its CLI or touching the network", () => {
  for (const m of MODULES) {
    const file = path.join(ROOT, "skills", m);
    const script = `let calls=0;globalThis.fetch=()=>{calls++;throw new Error("NETWORK_FORBIDDEN");};
      await import(${JSON.stringify(file)});console.log(JSON.stringify({ok:true,calls}));`;
    const out = execFileSync(process.execPath, ["--input-type=module", "-"], { input: script, cwd: ROOT, encoding: "utf8", timeout: 20000, env: { ...process.env, NODE_NO_WARNINGS: "1" } });
    assert.deepEqual(JSON.parse(out.trim().split("\n").at(-1)), { ok: true, calls: 0 }, m);
  }
});

test("normal file usage still runs the CLI, also through a symlinked path", t => {
  const direct = execFileSync(process.execPath, [path.join(ROOT, "skills/system-steward/scripts/audit.mjs"), "--json"], { cwd: ROOT, encoding: "utf8", timeout: 20000 });
  assert.ok(direct.trim().startsWith("{") || direct.trim().startsWith("["), "audit CLI ran from its file");
  const dir = mkdtempSync(path.join(tmpdir(), "cli-link-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const link = path.join(dir, "audit.mjs");
  symlinkSync(path.join(ROOT, "skills/system-steward/scripts/audit.mjs"), link);
  const viaLink = execFileSync(process.execPath, [link, "--json"], { cwd: ROOT, encoding: "utf8", timeout: 20000 });
  assert.equal(viaLink.trim().slice(0, 1), direct.trim().slice(0, 1), "symlinked entry still recognised (skills are linked in .claude/skills)");
});
