import test from "node:test";
import assert from "node:assert/strict";
import { checkManagers, loadManagers, skillsForRoute } from "../tools/managers.mjs";

const skill = (name, manager) => ({ name, manager });
const manager = (name, route, skills, runtimes = ["claude-code"]) => ({ file: `${name}.md`, name, description: "d", route, statut: "brouillon", skills, runtimes });

test("repository managers cover every skill and respect the OpenClaw data rule", () => {
  const managers = loadManagers();
  assert.equal(managers.length, 7);
  assert.deepEqual(checkManagers(managers), []);
  assert.ok(skillsForRoute("career").includes("job-application-optimizer"));
  assert.throws(() => skillsForRoute("sales"), /UNKNOWN_ROUTE/);
});

test("inconsistent managers are reported", () => {
  const skills = [skill("a", "career"), skill("f", "finance"), skill("orphan", "system")];
  const errors = checkManagers([
    manager("career", "career", ["a", "f", "ghost"], ["openclaw"]),
    manager("finance", "finance", ["f"], ["openclaw"]),
    manager("dup", "career", []),
    manager("wrong", "sales", [], ["telegram"]),
    { ...manager("renamed", "knowledge", []), file: "other.md" }
  ], skills);
  for (const expected of [/unknown skill ghost/, /f is excluded from OpenClaw/, /finance manager cannot run on OpenClaw/,
    /duplicate route career/, /name must equal file name/, /route must be one of/, /runtimes must be among/, /orphan: no manager/]) {
    assert.ok(errors.some(e => expected.test(e)), `${expected}\n${errors.join("\n")}`);
  }
});
