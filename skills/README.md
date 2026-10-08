# Skills Registry

Skills are reusable procedural knowledge, stored once and adapted to individual runtimes.

Principles:
- provider-neutral core whenever possible;
- explicit inputs/outputs;
- minimal permissions;
- pinned provenance/version;
- tests before promotion;
- no secrets;
- no autonomous installation from the Internet.

## Promotion pipeline
```
external skill
   ↓
quarantine
   ↓
static inspection
   ↓
Claude review + Codex review
   ↓
risk/policy classification
   ↓
sandbox test
   ↓
human approval for privileged skills
   ↓
registry
```

Initial families: research, evidence-validation, opportunity-discovery, market-validation, multilingual-arbitrage, job-discovery, job-scoring, CV-tailoring, ETF/crypto research, product requirements, architecture, code review, testing, design, motion, fact-checking, learning design, interactive visualization, Obsidian write and Telegram report.

## Format (v1, 2026-09-29)

One directory per skill: `skills/<name>/SKILL.md` in the Agent Skills format read by Claude Code,
Codex and OpenClaw. Frontmatter keys: `name` (= directory), `description` (trigger, ≤ 1024 chars),
optional `license`/`compatibility`/`allowed-tools`, and `metadata`:

| Key | Values |
|---|---|
| `version` | semver |
| `famille` | free label (research, career, engineering…) |
| `manager` | `business` `career` `finance` `knowledge` `engineering` `system` — same labels as Jev routing |
| `risque` | `lecture` `brouillon` `ecriture-depot` `action-externe` |
| `profil` | `oui` if the skill reads the private profile `profil.md` |
| `statut` | `actif` `brouillon` |
| `provenance` | origin and adaptation date |

## Private profile

Personal data (clients, experience, languages, investment frame) never enters the repository.
The real profile lives at `~/.ivan-ai-os/profil.md` (mode 600); `skills/_profil/profil.example.md`
shows its sections. Skills with `profil: "oui"` read it at runtime.

## Commands

```bash
node skills/tools/registry.mjs                        # validate every skill
IVAN_PROFILE_PATH=~/.ivan-ai-os/profil.md node skills/tools/registry.mjs   # + private-name leak check
node --test 'skills/test/*.test.mjs' 'agents/test/*.test.mjs'   # registry, packaging, managers, Anakalypto
node skills/tools/package.mjs [--out DIR] [name…]     # claude.ai: ~/.ivan-ai-os/skills-dist (full profile)
node skills/tools/package.mjs --openclaw --out ~/.ivan-ai-os/skills-openclaw   # no clients/finances, no finance skills
node skills/tools/package.mjs --openclaw --manager career --out DIR          # one manager's skills only
```

Packages go to a new or empty directory outside any Git checkout (delete the previous build
first); links in sources or outputs are refused. Upload a packaged folder to claude.ai, or copy it
into an OpenClaw/Codex skills directory, after review.

## Runtimes

- Claude Code and Codex (this repository): `.claude/skills/` and `.agents/skills/` link only
  engineering/system skills that need no private profile (checked by the tests).
- OpenClaw: `--openclaw` packages installed by Codex; the skills watcher refreshes them.

## Trigger evaluations

`skills/<name>/evals.json` (optional, validated): 3 prompts that must trigger the skill, 2 near misses
with the skill that should win instead, 1 verifiable deliverable. Synthetic cases only.
