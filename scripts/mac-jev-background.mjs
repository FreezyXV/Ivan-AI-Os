import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readPrivateSettings, waitForKey, startGateway, writeRuntimeStatus } from "../services/mac-runtime/src/service.js";

let server, settings;
const controller = new AbortController();
const report = state => {
  if (settings) writeRuntimeStatus(settings, { state, attempts: 0, retryAfterSeconds: 0 });
};
const stop = () => {
  controller.abort();
  try { report("BACKGROUND_GATEWAY_STOPPED"); } catch { /* no raw error output */ }
  if (server) {
    server.close(); server.closeAllConnections();
    const timer = setTimeout(() => process.exit(0), 5000); timer.unref();
  }
};
process.once("SIGTERM", stop); process.once("SIGINT", stop);
try {
  if (process.platform !== "darwin" || process.argv.length !== 3) throw new Error();
  settings = readPrivateSettings(process.argv[2]);
  // Executable code must come from the exact release declared by the private config.
  if (realpathSync(fileURLToPath(new URL("../", import.meta.url))) !== realpathSync(settings.releaseRoot)) throw new Error();
  const key = await waitForKey(settings, { signal: controller.signal });
  controller.signal.throwIfAborted();
  server = await startGateway(settings, key);
  if (controller.signal.aborted) stop();
  else { report("BACKGROUND_GATEWAY_READY"); console.log("BACKGROUND_GATEWAY_READY"); }
} catch {
  if (server) server.close();
  if (!controller.signal.aborted) {
    try { report("BACKGROUND_GATEWAY_UNAVAILABLE"); } catch { /* no raw error output */ }
    console.error("BACKGROUND_GATEWAY_UNAVAILABLE"); process.exitCode = 1;
  }
}
