# Workflow — Knowledge Engine / Anakalypto (Knowledge Manager)

Owner: Claude (contract; skills `encyclopedie-anakalypto`, `verification-affirmations`,
`recherche-sourcee`, `design-original`). Runtime, schedule and Jev questions: Codex.

| # | Step | Who | Tokens |
|---|---|---|---|
| 1 | Plan: sub-topics, 3–5 questions per article | worker LLM | premium, short |
| 2 | Sources: 3–5 searches per article, primary first | worker LLM + web | premium |
| 3 | **Jev source gate**: is this page a reliable source for this claim? | Jev `source.fiable` (future) | cents |
| 4 | Draft + claims ledger (numbers, dates, definitions, relations with their sources) | worker LLM | premium |
| 5 | Evidence rules: tiers A/B/C, 2 independent domains for numbers/dates, divergence ⇒ contested | `affirmations.mjs verifier` (code) | 0 |
| 6 | Targeted fix of each "to verify"/"contested" claim, or removal | worker LLM | premium, bounded |
| 7 | Key facts + Sources from confirmed claims only | `affirmations.mjs faits` (code) | 0 |
| 8 | Visual router: timeline / chart / key figures / map / diagram / illustration | `affirmations.mjs visuels` (code) | 0 |
| 9 | Format check of the batch | `valider_lot.py` (code) | 0 |
| 10 | **Jev publication gate**: batch complete, sourced, neutral in tone? | Jev `publication.prete` (future) | cents |
| 11 | Publication on Anakalypto | Ivan (identity-bearing, constitution) | — |

Savings: the LLM no longer re-reads sources to decide whether a fact is established (steps 5, 7, 8),
and only re-works the claims the code rejects.

## Requests to Codex (runtime perimeter)
1. Registered Jev questions on public text: `source.fiable` (choice fiable / partielle / non fiable;
   input: domain, page title, ≤ 500-char excerpt, claim type) and `publication.prete` (noul; input:
   verifier summary, word counts, validator result).
2. CI step: `affirmations.mjs verifier` on committed `*.claims.json` next to article batches.
