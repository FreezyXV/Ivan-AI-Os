// Prepare a reversible instruction addition; never mutate the active workspace.
import { readFileSync, writeFileSync, mkdirSync, lstatSync, realpathSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import os from "node:os";
import { addChiefDeliveryGuidance } from "../services/manager-runtime/src/chief-delivery.js";

try {
  const [output] = process.argv.slice(2);
  if (!output || !path.isAbsolute(output)) throw new Error();
  const parent = realpathSync(path.dirname(output)), stat = lstatSync(parent);
  if (stat.uid !== process.getuid() || (stat.mode & 0o077)) throw new Error();
  for (let p = parent;; p = path.dirname(p)) {
    if (existsSync(path.join(p, ".git"))) throw new Error();
    if (path.dirname(p) === p) break;
  }
  const config = JSON.parse(readFileSync(path.join(os.homedir(), ".openclaw/openclaw.json"), "utf8"));
  const workspace = realpathSync(config.agents.entries.main.workspace);
  const file = path.join(workspace, "AGENTS.md"), info = lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.uid !== process.getuid()) throw new Error();
  const original = readFileSync(file), text = original.toString("utf8");
  if (!original.equals(Buffer.from(text))) throw new Error();
  const proposed = Buffer.from(addChiefDeliveryGuidance(text));
  const digest = value => createHash("sha256").update(value).digest("hex");
  mkdirSync(output, { mode: 0o700 });
  writeFileSync(path.join(output, "AGENTS.original.md"), original, { flag: "wx", mode: 0o600 });
  writeFileSync(path.join(output, "AGENTS.proposed.md"), proposed, { flag: "wx", mode: 0o600 });
  writeFileSync(path.join(output, "preparation.json"), JSON.stringify({ file, original_sha256: digest(original), proposed_sha256: digest(proposed), original_mode: info.mode & 0o777, original_bytes: original.length, appended_bytes: proposed.length - original.length }), { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ status: "CHIEF_DELIVERY_PREPARED_NOT_APPLIED", existing_bytes_preserved: true, appended_bytes: proposed.length - original.length, runtime_modified: false }));
} catch {
  console.error("CHIEF_DELIVERY_PREPARATION_REFUSED"); process.exitCode = 1;
}
