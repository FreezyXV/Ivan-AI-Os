export async function routeWithGateway(text, gatewayUrl, fetchImpl = fetch) {
  const base = new URL(gatewayUrl);
  if (base.username || base.password || base.search || base.hash) throw new Error("Invalid gateway URL");
  const url = new URL("/v1/route", base);
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(4000)
  });
  if (!response.ok) throw new Error(`Gateway unavailable (${response.status})`);
  const result = await response.json();
  if (!["REVIEW", "ROUTED"].includes(result?.status) ||
      (result.status === "ROUTED" && !["business", "career", "finance", "knowledge", "engineering", "system"].includes(result.manager))) {
    throw new Error("Invalid gateway response");
  }
  return result;
}
