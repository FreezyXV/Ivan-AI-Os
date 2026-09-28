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

Planned:
- `hooks/claude/`
- `hooks/codex/`
- `hooks/openclaw/`
