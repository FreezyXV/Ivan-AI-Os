import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readPrivateSettings, readKey, startGateway } from "../services/mac-runtime/src/service.js";

let server;
try {
  if (process.platform !== "darwin" || process.argv.length !== 3) throw new Error();
  const settings = readPrivateSettings(process.argv[2]);
  // Executable code must come from the exact release declared by the private config.
  if (realpathSync(fileURLToPath(new URL("../", import.meta.url))) !== realpathSync(settings.releaseRoot)) throw new Error();
  server = await startGateway(settings, readKey(settings));
  const stop = () => {
    server.close(); server.closeAllConnections();
    const timer = setTimeout(() => process.exit(0), 5000); timer.unref();
  };
  process.once("SIGTERM", stop); process.once("SIGINT", stop);
  console.log("BACKGROUND_GATEWAY_READY");
} catch {
  if (server) server.close();
  console.error("BACKGROUND_GATEWAY_UNAVAILABLE"); process.exitCode = 1;
}
