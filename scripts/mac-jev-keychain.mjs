import { execFileSync } from "node:child_process";
import { readPrivateSettings } from "../services/mac-runtime/src/service.js";

// Explicit provisioning only. Neither preparation nor service startup writes credentials.
let value = "";
try {
  if (process.platform !== "darwin" || process.argv.length !== 3 || !process.stdin.isTTY) throw new Error();
  const settings = readPrivateSettings(process.argv[2]);
  process.stdout.write("Clé TypeSafe → Trousseau local (saisie masquée) : ");
  process.stdin.setRawMode(true); process.stdin.resume();
  value = await new Promise((resolve, reject) => {
    let input = "";
    const handler = buffer => {
      for (const char of buffer.toString("utf8")) {
        if (char === "\u0003") { cleanup(); return reject(new Error()); }
        if (char === "\r" || char === "\n") { cleanup(); return resolve(input); }
        if (char === "\u007f") input = input.slice(0, -1); else input += char;
        if (input.length > 4000) { cleanup(); return reject(new Error()); }
      }
    };
    function cleanup() { process.stdin.off("data", handler); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n"); }
    process.stdin.on("data", handler);
  });
  const result = execFileSync(settings.keychainHelper, ["store", settings.keychainAccount], { input: value, encoding: "utf8", maxBuffer: 4096, timeout: 10000, stdio: ["pipe", "pipe", "pipe"], env: {} });
  if (result.trim() !== "KEYCHAIN_STORED") throw new Error();
  console.log("KEYCHAIN_STORED");
} catch {
  if (process.stdin.isTTY && process.stdin.isRaw) process.stdin.setRawMode(false);
  process.stdin.pause(); console.error("KEYCHAIN_PROVISIONING_REFUSED"); process.exitCode = 1;
} finally { value = ""; }
