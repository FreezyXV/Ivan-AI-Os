import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createJevBudget } from "../src/budget.js";

export function testBudget(t, options = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), "ivan-budget-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, "usage.json");
  return { filename, directory, budget: createJevBudget({ filename, ...options }) };
}
