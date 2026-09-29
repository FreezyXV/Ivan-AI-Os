# OVH rollout proposal — prepared, not purchased

As checked on 2026-09-29, OVHcloud France lists VPS-1 at **4.57 EUR TTC/month
from** (2 vCores, 4 GB RAM, 40 GB NVMe) and VPS-2 at **8.65 EUR TTC/month
from** (4 vCores, 8 GB RAM, 75 GB NVMe). Prices and checkout options may
change. Source: https://www.ovhcloud.com/fr/vps/ .

I recommend **VPS-2 in France** for the eventual seven-role OpenClaw runtime:
8 GB leaves room for the gateway, short-lived workers and future scheduled
engines while staying below the 10–15 EUR/month VPS range discussed with
Ivan. VPS-1 is a cheaper Jev-only canary, but buying a smaller machine for
that temporary stage would create an avoidable resize before moving OpenClaw.
No order, payment, account or network change has been made.

## Staged cutover

1. Provision one Linux VPS with a dedicated service user and Node.js 22+.
   Keep the old Mac pilot running while the new host is staged. Do not expose
   Jev or OpenClaw control ports on the public interface.
2. Install an immutable repository release at `/opt/ivan-ai-os/current` and
   the `services/linux-runtime/ivan-jev-gateway.service` unit. Provision the
   TypeSafe key and a stable decision token as systemd credentials outside
   Git. `systemd-analyze verify` and the authenticated startup probe must
   pass on the target host before any client cutover.
3. Establish a private Mac–VPS path, then test Jev health, routing,
   classification and budget from the Mac over that path. The unit binds
   only to `127.0.0.1`, so a private tunnel or local proxy is needed. These
   steps require the target host; they are not proven by the Mac mock test.
4. Stop new Mac Jev requests, transfer the **exact** budget state to Linux,
   verify its month, model, exchange rate and charged total, then point the
   Mac OpenClaw plugin at the VPS candidate. Keep the previous config and
   Mac service for rollback, but do not run independent spend counters in
   parallel.
5. Move OpenClaw and the Telegram bot only after the Jev canary works and
   the Secretary workspace, memory, seven roles, installed plugins and
   credentials are inventoried. Run one Telegram bot instance at a time.
   Prove Telegram → manager → worker → delivered result, plus scoped Business,
   Finance and memory reads, before retiring the Mac gateway.

Postgres, Redis and pgvector remain optional. The current verified workflows
use files and SQLite; adding three services before measured demand increases
cost and operating work without improving the current Telegram path.

Rollback is a release/config pointer reversal and a controlled single-bot
switch. Preserve the budget and audit files. A rollback can resume the Mac
only after reconciling any VPS Jev spend made during the canary.
