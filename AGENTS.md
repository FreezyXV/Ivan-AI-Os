# Codex / Agent Instructions

Read before substantial work:
1. `constitution/CONSTITUTION.md`
2. `docs/ARCHITECTURE.md`
3. relevant workflow and policies
4. only skills needed for the task

Rules:
- minimize injected context;
- prefer deterministic code before model calls;
- use Jev for classification/selection/decision, not prose generation;
- never bypass human approval boundaries;
- never place secrets in repository files;
- make reversible changes on branches;
- preserve provenance and auditability;
- prefer ephemeral workers over persistent specialist agents.
