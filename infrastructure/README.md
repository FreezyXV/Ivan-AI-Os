# Local control-plane skeleton

From the repository root, Compose interpolation can use a private local env file:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml config --quiet
```

This command validates without printing expanded credentials. Do not paste expanded Compose configuration into chat or logs. The env file supplies interpolation values; it is not injected wholesale into the gateway. That service receives only its six explicitly listed variables, has no Postgres/Redis dependency and publishes its port on host loopback.

Docker was unavailable during the 2026-09-29 review. The YAML was parsed, but no containers were launched. This skeleton still runs the advisory legacy endpoints; it does not provision private auth/audit/policy mounts or implement a provider quota. Complete the migration described in `docs/RESPONSE-TO-CLAUDE-2026-09-29.md` before deployment.
