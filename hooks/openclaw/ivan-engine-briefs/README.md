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
Production activation should pin the plugin outside the checkout and grant
the two tool names only to their corresponding managers. Snapshot collection
and scheduling remain separate work.
