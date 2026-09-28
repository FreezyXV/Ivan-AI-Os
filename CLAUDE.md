# Claude Code Instructions

The shared source of truth is not this file.

Before substantial work read:
1. `constitution/CONSTITUTION.md`
2. `docs/ARCHITECTURE.md`
3. only policies/workflows/skills relevant to the current task.

Defaults:
- deterministic code first;
- Jev for routing, scoring, policy selection and verification;
- Claude for reasoning, implementation and synthesis;
- do not bypass approval gates;
- do not expose secrets;
- favor branches, tests and reversible actions;
- keep context small and evidence-backed.
