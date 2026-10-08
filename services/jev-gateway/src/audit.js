import { constants, openSync, closeSync, fstatSync, writeSync, fsyncSync } from "node:fs";
import path from "node:path";

// Single-process append-only journal. On exhaustion or any write failure the
// evaluator refuses to return a successful response; it never erases old events.
export function createAuditWriter(filename, { maxBytes = 1_000_000 } = {}) {
  if (!path.isAbsolute(filename) || !Number.isSafeInteger(maxBytes) || maxBytes < 1024) throw new Error("INVALID_AUDIT_CONFIG");
  return event => {
    const line = Buffer.from(`${JSON.stringify(event)}\n`);
    if (line.length > 4096) throw new Error("AUDIT_EVENT_TOO_LARGE");
    const fd = openSync(filename, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
    try {
      const stat = fstatSync(fd);
      if (!stat.isFile() || stat.uid !== process.getuid?.() || (stat.mode & 0o077) !== 0 || stat.nlink !== 1) throw new Error("UNSAFE_AUDIT_FILE");
      if (stat.size + line.length > maxBytes) throw new Error("AUDIT_FULL");
      if (writeSync(fd, line) !== line.length) throw new Error("AUDIT_WRITE_FAILED");
      fsyncSync(fd);
    } finally { closeSync(fd); }
  };
}
