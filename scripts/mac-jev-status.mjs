import { readPrivateSettings, readRuntimeStatus } from "../services/mac-runtime/src/service.js";

try {
  if (process.argv.length !== 3) throw new Error();
  const settings = readPrivateSettings(process.argv[2]);
  const status = readRuntimeStatus(settings);
  let processAlive = false, gatewayReady = false;
  if (status) try { process.kill(status.pid, 0); processAlive = true; } catch {}
  try {
    const response = await fetch(`http://127.0.0.1:${settings.port}/health`, { signal: AbortSignal.timeout(2000) });
    const health = await response.json();
    gatewayReady = response.ok && health.ok === true && health.service === "jev-gateway";
  } catch {}
  console.log(JSON.stringify({ status, processAlive, gatewayReady }));
  if (!gatewayReady) process.exitCode = 1;
} catch { console.error("BACKGROUND_STATUS_UNAVAILABLE"); process.exitCode = 1; }
