# Runtime Hooks

Thin adapters normalize runtime events into the shared policy/decision plane.

```
runtime event
   ↓
ActionEnvelope
   ↓
deterministic kernel
   ↓
policy retrieval
   ↓
Jev Gateway
   ↓
ALLOW / DENY / REQUIRE_HUMAN / ESCALATE
```

Provider-specific adapters must not duplicate the constitution.

Current OpenClaw adapters:
- `hooks/openclaw/ivan-route/` — advisory routing, verified through Telegram and live Jev.
- `hooks/openclaw/ivan-observer/` — inactive before/after observer with keyed correlation; tested against the installed native runner in isolation. It does not grant or block permission.

Planned enforcement adapters:
- `hooks/claude/`
- `hooks/codex/`
- `hooks/openclaw/`
