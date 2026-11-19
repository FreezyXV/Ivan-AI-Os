// CLI entry guard shared by skill scripts. True only when this module is the script node was
// asked to run (symlinks resolved on both sides, since skills are linked in .claude/skills).
// Importing from stdin (`node --input-type=module -`, argv[1] === "-"), from a REPL or from a
// missing path is never a CLI run: no ENOENT, no input file read, no network, no model.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function isCliEntry(moduleUrl, argv1 = process.argv[1]) {
  if (typeof argv1 !== "string" || !argv1 || argv1 === "-") return false;
  try { return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(argv1); } catch { return false; }
}
