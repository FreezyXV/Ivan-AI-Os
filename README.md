# Ivan AI OS

Private, policy-governed AI operating system coordinating multiple models and specialist agents across business discovery, career, finance, software engineering, and Anakalypto.

## Core principle

```
LLM = perceive / reason / create
Jev = classify / score / decide / verify
Code = execute deterministically
Memory = retain verified knowledge
Human = strategy + irreversible approval
```

The system aims for useful autonomy with minimal premium-token usage and strong controls around irreversible actions.

## Control plane

```
Ivan
  ↓
Telegram / Mac
  ↓
OpenClaw — Chief of Staff
  ↓
Jev Decision Gateway
  ↓
Manager
  ├── Business
  ├── Career
  ├── Finance
  ├── Knowledge / Anakalypto
  ├── Engineering
  └── System
  ↓
Ephemeral workers
  ↓
Jev pre-action gate
  ↓
Tools / MCP / code
  ↓
Jev post-action + final gate
  ↓
Memory + report
```

## Repository structure

- `constitution/` — non-negotiable operating rules.
- `policies/` — machine-readable policy catalog.
- `agents/` — persistent managers and worker contracts.
- `skills/` — reusable capabilities.
- `hooks/` — runtime adapters.
- `services/jev-gateway/` — common decision API.
- `schemas/` — shared contracts.
- `workflows/` — business, career, finance, engineering, Anakalypto.
- `memory/` — memory architecture and Dream consolidation.
- `evals/` — regression and safety evaluations.
- `infrastructure/` — Docker/VPS deployment.
- `docs/` — architecture and roadmap.

## Safety boundary

Agents may research, analyze, write project files, prepare code, maintain memory, and propose actions.

They must not autonomously spend money, execute financial transactions, contact third parties, expose secrets, weaken kernel policies, erase audit history, or make irreversible production changes outside explicit policy.

See `constitution/CONSTITUTION.md`.

## Development model

`main` stays stable. Substantial changes land through reviewed branches and pull requests.

Current milestone: **Foundation v1 — Control Plane + Jev Gateway + Memory + Policy Kernel**.
