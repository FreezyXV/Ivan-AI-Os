# Workflow — Finance Engine (Finance Manager)

Owner: Claude (contract, skills `finance-engine` and `veille-investissements`). Schedule and delivery: Codex.
Status: v1 public watch (this file). Personal DCA/drift module: next, Claude-only, private data.

## Public watch (0 LLM token by default)

| # | Step | Who | Tokens |
|---|---|---|---|
| 1 | Collect ECB (deposit rate, HICP, core HICP, EUR/USD), FRED (US 10y), Kraken (BTC, ETH) | `veille.mjs collecter` (code) | 0 |
| 2 | Private dated snapshot `~/.ivan-ai-os/finance/snapshots/` (0700/0600) | code | 0 |
| 3 | Alerts by fixed thresholds vs previous snapshot | `veille.mjs alertes` (code) | 0 |
| 4 | **Jev importance gate** (live): routine moves downgraded to notes; Jev outage keeps the alert | `rapport --jev` → Jev `alerte.importante` | cents |
| 5 | Short explanation with primary sources, only if step 4 says yes | worker LLM | premium, rare |
| 6 | Brief to Telegram (one info per message) + journal note | `rapport-telegram`, `memoire-obsidian` | 0 |

Thresholds (code): ECB deposit rate changed; BTC/ETH ±10 % over 7 days; EUR/USD ±2 % since last
snapshot. Info: new inflation print, stale data (daily > 7 days, monthly > 70 days), source outage.

Known limitation (2026-09-29): the ECB HICP series for the euro area stops at 2025-12 (probably a
change of euro-area composition code in 2026); flagged as stale until the new series key is found.
CoinGecko answered with an HTML challenge from this network; Kraken public OHLC is used instead.

## Private module (v1, `scripts/dca.mjs`)
Target and actual weights in `~/.ivan-ai-os/finance/allocation.json` (0600; never Git, OpenClaw or Jev).
`derive`: drift in points (±5-point band). `repartir <amount>`: buy-only split of the next contribution
(fill gaps first, then target weights); the contribution needed to reach target without selling.
Next: concentration and cost checks once ISIN and fees are provided.
Buy/sell/transfer/broker connection: Ivan only. No agent ever holds a transaction-capable key.

## Requests to Codex (runtime perimeter)
1. Daily schedule (e.g. 07:30 Europe/Paris) running `collecter` then `alertes`; Telegram only on "important".
2. Registered Jev question `alerte.importante` (noul) — input: indicator id, old/new value, threshold;
   public data only.
3. Since managers cannot `exec`, expose the latest brief to the Finance manager as a read-only tool.
