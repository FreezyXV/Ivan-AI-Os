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
| 6 | Synthesis per `docs/ALERT-EDITORIAL-CONTRACT.md` (immediate only if coded urgency, else evening digest) + journal note | `rapport-telegram` form A, `memoire-obsidian` | 0 |

Thresholds (code): ECB deposit rate changed; BTC/ETH ±10 % over 7 days; EUR/USD ±2 % since last
snapshot. Info: new inflation print, stale data (daily > 7 days, monthly > 70 days), source outage.

Resolved 2026-10-05: the ECB retired the `ICP` dataset in February 2026; the skill now reads
`HICP/M.U2.N.000000.4D0.ANR` and `HICP/M.U2.N.XEF000.4D0.ANR` (same fix as Codex's runtime
`modernFinanceUrl`). Live check 2026-10-05: 3.8 % and 2.5 % for 2026-09, 7/7 indicators after one
transient ECB timeout (network retries are bounded in the Codex runtime). Kraken's last OHLC row
is the current, still-forming day and is no longer read as a close.
CoinGecko answered with an HTML challenge from this network; Kraken public OHLC is used instead.

## Synthesis example (manual, live data of 2026-10-05; not a pipeline output)

```
Inflation zone euro — relevé public
Relevé le 2026-10-05.
• L'inflation de la zone euro est de 3,8 % sur un an en septembre 2026 (IPCH, BCE).
• L'inflation sous-jacente, hors énergie et alimentation, est de 2,5 % sur la même période.
• Le taux de dépôt de la BCE est de 2,5 % depuis le 16 septembre 2026.

Utilité pour toi : l'inflation totale est nettement au-dessus de la sous-jacente. Ce relevé ne dit
pas quelle composante (énergie, alimentation…) explique l'écart : il faudrait la décomposition par
poste. Le chiffre à suivre pour voir si la hausse s'installe hors énergie et alimentation reste la
sous-jacente, au prochain relevé.

À faire : Rien à faire maintenant. Si tu veux confronter ces chiffres à ta propre allocation, le
faire en local dans Claude (veille-investissements). Aucune transaction.

Limite : séries mensuelles publiées avec retard ; un seul relevé, sans comparaison au précédent
dans cet exemple. Information, pas un conseil en investissement.

Source : https://data.ecb.europa.eu/data/datasets/HICP/HICP.M.U2.N.000000.4D0.ANR
```

## Private module (v1, `scripts/dca.mjs`)
Target and actual weights in `~/.ivan-ai-os/finance/allocation.json` (0600; never Git, OpenClaw or Jev).
`derive`: drift in points (±5-point band). `repartir <amount>`: buy-only split of the next contribution
(fill gaps first, then target weights); the contribution needed to reach target without selling.
Next: concentration and cost checks once ISIN and fees are provided.
Buy/sell/transfer/broker connection: Ivan only. No agent ever holds a transaction-capable key.

## Requests to Codex (runtime perimeter) — status 2026-10-05
1. Daily schedule after 07:30 Europe/Paris — done in the Mac orchestrator (Codex, not yet merged).
2. Jev `alerte.importante` (noul) — live; the real client is accepted for formatted values.
3. Read-only tool for the Finance manager — `ivan_finance_brief`.
4. New: once this branch is merged, drop the runtime ICP/Kraken patches in
   `services/alerts-runtime/src/engines.js` so one source of truth remains.
