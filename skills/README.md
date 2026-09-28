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
