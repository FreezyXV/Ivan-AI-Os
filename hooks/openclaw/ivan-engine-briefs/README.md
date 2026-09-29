# Prepared Business and Finance briefs for OpenClaw

Two optional, read-only tools give each manager its own prepared results:

- `ivan_business_brief` is available only to `ivan-business`. It reads up to
  three scored opportunities from the private Business registry and returns
  subject slugs, scores, horizon, decision and public evidence links. Private
  profile criteria, customer descriptions and acquisition notes stay local.
- `ivan_finance_brief` is available only to `ivan-finance`. It reads the newest
  public market snapshot, prior values and source links. It never opens
  `allocation.json` or other personal portfolio data.

The plugin does no command execution, provider call, network collection or
write. `businessDir` and `financeDir` in the private OpenClaw plugin config
point to the engine directories. A missing report returns `EMPTY`; a file
that is oversized, linked or malformed returns `UNAVAILABLE`. The output is
prepared evidence for the manager, not a recommendation or permission.

`npm test` uses synthetic registries and no live model or source API.
The Mac pilot pins the plugin outside the checkout. The live gateway returned
`READY` for both manager-scoped RPC calls; `main` could not invoke the Business
tool. A direct `launchctl kickstart -k` restarted the service in 3 seconds,
with TCP available after 12 seconds and authenticated RPC health after 22
seconds. Use `scripts/switch-openclaw-config.mjs` for subsequent private config
changes; it validates, snapshots, restarts through launchd, checks health and
rolls back if needed. Snapshot collection and scheduling remain separate work.
