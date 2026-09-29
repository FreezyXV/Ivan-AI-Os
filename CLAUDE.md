@AGENTS.md

# Claude Code specifics

The shared rules above (`AGENTS.md`, then `constitution/CONSTITUTION.md` and
`docs/ARCHITECTURE.md`) are authoritative; this file only adds what is specific to Claude Code.

## Role
- Codex is the primary builder of the decision plane (`services/`, `hooks/openclaw/`, `shared/`,
  `policies/`, CI and infrastructure). Claude Code owns `skills/`, `agents/`, `CLAUDE.md`,
  `.claude/` and `hooks/claude/`, and independently reviews Codex's pull requests.
- `AGENTS.md` and `constitution/` change only after agreement of both agents and Ivan's GO.

## Working alongside Codex
- Work in a separate worktree on `agent/claude/<topic>`; never stash, reset, checkout or edit
  files in Codex's checkout, and never touch its uncommitted files.
- Follow the `revue-croisee` skill for reviews and `passation-session` for handoffs.
- Push, PR creation and public comments need Ivan's GO unless he granted it for the task.

## Skills
- Project skills are linked in `.claude/skills/` (system and engineering only). Validate any
  change with `node skills/tools/registry.mjs` and `node --test 'skills/test/*.test.mjs'`.
- Personal data stays in `~/.ivan-ai-os/profil.md`, never in the repository.

## Defaults
- Jev for routing, scoring, policy selection and verification (`jev-decision` skill);
  Claude for reasoning, implementation and synthesis.
- Keep context small and evidence-backed; prove a bug with a failing test before fixing it.
