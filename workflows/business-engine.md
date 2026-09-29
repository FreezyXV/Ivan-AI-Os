# Workflow — Business Engine (Opportunity Manager)

Owner: Claude (contract, skill `business-engine`). Runtime, schedule and Jev questions: Codex.
Status: v1, run manually or by Claude Code; OpenClaw schedule pending (see "Requests to Codex").

## Steps

| # | Step | Who | Tokens |
|---|---|---|---|
| 1 | Collect 15–40 public signals (one search per source class) | worker (LLM + web) | premium, bounded |
| 2 | Clean: validate, canonical URL, dedupe by URL and by (subject, title) | `signals.mjs ajouter` (code) | 0 |
| 3 | Prioritise subjects by number of distinct sources | `signals.mjs sujets` (code) | 0 |
| 4 | **Jev relevance gate**: keep signals that are real, monetisable pains | Jev `signal.pertinent` (future) | cents |
| 5 | Research the top 3–5 subjects, gather evidence URLs | worker (LLM + web) | premium, bounded |
| 6 | Score /30, eliminators, Cash/Venture, decision | `signals.mjs noter` (code) | 0 |
| 7 | **Jev quality gate**: is each criterion supported by its link? | Jev `preuve.suffisante` (future) | cents |
| 8 | Report top 3 → Obsidian decision note + Telegram brief | `signals.mjs rapport`, `memoire-obsidian`, `rapport-telegram` | 0 |
| 9 | Human gate: contact, purchase, publication | Ivan | — |

Private data: `~/.ivan-ai-os/business/` (0700; `signals.jsonl`, `opportunites.jsonl`), never Git.
Signals contain public web data only. No client names, no personal finances.

## Decision rules (code, `signals.mjs`)
- Six criteria 0–5; a note above 1 requires an evidence URL.
- No payment evidence ⇒ eliminated. Also eliminators: single-platform dependency, heavy regulation.
- ≥ 22/30 launch, ≥ 16 dig, otherwise drop. First euro ≤ 30 days ⇒ Cash, else Venture.

## Requests to Codex (runtime perimeter)
1. Registered Jev questions for `/v1/classify` (public text allowed, never private data):
   - `signal.pertinent` (noul): « Ce signal public décrit-il un problème réel pour lequel des gens paient
     ou paieraient ? » — input: `titre`, `extrait` (≤ 500 chars), `type`. Replaces step-4 LLM reading.
   - `preuve.suffisante` (choice: suffisante / partielle / absente) per criterion — input: criterion
     name, note, evidence page title + ≤ 500-char excerpt.
   Expected savings: the LLM reads only subjects that pass the gate (typically 3–5 of 20–40).
2. Weekly schedule for the Business manager on OpenClaw (collect → report), delivery via the chief.
3. Tool access for the Business manager to the ledger (read/append) without `exec`.
