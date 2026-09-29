# Jev Linux runtime (OVH candidate)

This package runs the authenticated Jev gateway as a systemd service. It does
not move Telegram, OpenClaw, Obsidian or the Mac budget state. Nothing is
installed on a VPS yet.

`ivan-jev-gateway.service` expects Node.js 22+, a checked-out release at
`/opt/ivan-ai-os/current`, a dedicated `ivan-ai-os` system user, and two
systemd credentials named `typesafe.key` and `decision-token`. The source
credential files live outside the repository under `/etc/ivan-ai-os/` and
must be provisioned privately on the target. The token is stable across
restarts; do not generate a new one during each deployment. The service
creates a private persistent state directory through `StateDirectory=`. The
budget and audit files stay there when the code release changes.

The launcher reads both credentials from `$CREDENTIALS_DIRECTORY`, runs the
existing gateway on `127.0.0.1:4311`, and passes no secret through command
arguments. The `ExecStartPost` probe waits for both the configured provider
and authenticated `/v1/usage` with the 10 EUR/month budget. A failed startup
is restarted by systemd. The listener is local; remote Mac access requires a
private connection that is not part of this package. Do not publish port 4311.

Before installing the unit on a Linux host, verify its paths and directives
with `systemd-analyze verify`. After installation, check `systemctl is-active
ivan-jev-gateway` and the journal's `JEV_GATEWAY_READY` marker. Keep the
previous release and unit for rollback; never remove or reset the state
directory during a rollback. A Mac-to-VPS routing cutover requires a separate
canary and coordinated OpenClaw configuration change. The Mac and VPS cannot
run against independent 10 EUR budget files as if they were one allowance:
before a real cutover, stop new Mac Jev requests, transfer the exact budget
state, verify it on Linux, then redirect OpenClaw. Keep the Mac fallback
stopped until rollback is deliberately chosen.

`npm test` runs a local mock daemon, authenticated health probe, denied
unauthenticated request, and credential/port invariants without TypeSafe or
OVH calls. No live Linux/systemd verification or OVH provisioning has been
claimed.
