// Authenticated startup probe used by systemd ExecStartPost. No model call.
import { pathToFileURL } from "node:url";
import { readCredential } from "./runtime.mjs";

export async function checkGateway({ credentials = process.env.CREDENTIALS_DIRECTORY,
  port = Number(process.env.PORT ?? "4311"), provider = process.env.JEV_PROVIDER ?? "jev",
  fetcher = fetch, attempts = 30, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const token = readCredential(credentials, "decision-token");
  if (token.length < 32 || /\s/.test(token) || !Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("INVALID_HEALTH_CONFIG");
  for (let i = 0; i < attempts; i++) {
    try {
      const base = `http://127.0.0.1:${port}`;
      const [health, usage] = await Promise.all([
        fetcher(`${base}/health`, { signal: AbortSignal.timeout(1000) }),
        fetcher(`${base}/v1/usage`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(1000) })
      ]);
      if (health.ok && usage.ok && (await health.json()).provider === provider &&
          (await usage.json()).monthly_budget_eur === 10) return true;
    } catch { /* service may still be starting */ }
    if (i + 1 < attempts) await pause(1000);
  }
  return false;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const ready = await checkGateway();
    console.log(ready ? "JEV_GATEWAY_READY" : "JEV_GATEWAY_UNAVAILABLE");
    if (!ready) process.exitCode = 1;
  } catch { console.error("JEV_GATEWAY_UNAVAILABLE"); process.exitCode = 1; }
}
