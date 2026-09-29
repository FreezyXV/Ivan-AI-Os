import { constants, openSync, closeSync, fstatSync, statSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const defaultRuntimeDirectory = path.join(homedir(), ".local", "share", "ivan-ai-os");

// Runtime-only credential: never returned as tool output or put in config/Git.
export function readDecisionToken(env = process.env) {
  function validate(token) {
    if (typeof token !== "string" || token.length < 32 || token.length > 4000 || /\s/.test(token)) throw new Error("RUNTIME_SECRET_UNAVAILABLE");
    return token;
  }
  if (env.IVAN_DECISION_TOKEN !== undefined) return validate(env.IVAN_DECISION_TOKEN);
  const filename = env.IVAN_DECISION_TOKEN_FILE ?? path.join(defaultRuntimeDirectory, "decision-token");
  let fd;
  try {
    if (!path.isAbsolute(filename)) throw new Error();
    const directory = statSync(path.dirname(filename));
    if (!directory.isDirectory() || directory.uid !== process.getuid?.() || (directory.mode & 0o077)) throw new Error();
    fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.uid !== process.getuid?.() || (stat.mode & 0o077) || stat.nlink !== 1 || stat.size > 4000) throw new Error();
    return validate(readFileSync(fd, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw new Error("RUNTIME_SECRET_UNAVAILABLE");
  } finally { if (fd !== undefined) closeSync(fd); }
}
