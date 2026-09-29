# Workflow — Knowledge Engine / Anakalypto (Knowledge Manager)

Owner: Claude (contract; skills `encyclopedie-anakalypto`, `verification-affirmations`,
`recherche-sourcee`, `design-original`). Runtime, schedule and Jev questions: Codex.

| # | Step | Who | Tokens |
|---|---|---|---|
| 0 | Topic discovery: Wikimedia top pageviews (3 days, 150 candidates), cleanup, covered excluded | `sujets.mjs` (code) | 0 |
| 0b | **Jev topic gate (mandatory)**: `sujet.captivant` then `sujet.domaine` (19 domains), ordered by domain deficit | Jev | < 1 cent / 150 titles |
| 1 | Plan: sub-topics, 3–5 questions per card | worker LLM | premium, short |
| 2 | Sources: 3–5 searches per article, primary first | worker LLM + web | premium |
| 3 | **Jev source gate**: `fiable` / `incertaine` / `non_fiable` for this claim type | Jev `source.fiable` | cents |
| 4 | Draft + claims ledger (numbers, dates, definitions, relations with their sources) | worker LLM | premium |
| 5 | Evidence rules: tiers A/B/C, 2 independent domains for numbers/dates, divergence ⇒ contested | `affirmations.mjs verifier` (code) | 0 |
| 6 | Targeted fix of each "to verify"/"contested" claim, or removal | worker LLM | premium, bounded |
| 7 | Key facts + Sources from confirmed claims only | `affirmations.mjs faits` (code) | 0 |
| 8 | Visual router: timeline / chart / key figures / map / diagram / illustration | `affirmations.mjs visuels` (code) | 0 |
| 9 | Format check of the batch | `valider_lot.py` (code) | 0 |
| 10 | **Jev publication gate (mandatory)**: `porte_jev.mjs` writes `<lot>.jev.json`; `valider_lot.py` refuses a batch without it | Jev `publication.prete` | cents |
| 11 | Publication on Anakalypto | Ivan (identity-bearing, constitution) | — |

Savings: the LLM no longer re-reads sources to decide whether a fact is established (steps 5, 7, 8),
and only re-works the claims the code rejects.

Format v2 (Ivan, 2026-09-29): short cards (150–450 words, ≤ 2 min), one visual or interaction per
card, 19 domains (`domaines.json`), cross-domain series « Après l'apocalypse » (`serie-reconstruction.md`).
Jev is mandatory: without its decisions no topic is retained and no batch is publishable (fail closed).

## Requests to Codex (runtime perimeter)
0. **`POST /v1/classify`** with the registered questions listed in `skills/jev-decision/scripts/classify.mjs`
   (`sujet.captivant`, `sujet.domaine`, `source.fiable`, `publication.prete`, `signal.pertinent`,
   `preuve.suffisante`, `alerte.importante`): bearer, shared budget, public inputs only, response
   `{question, decision, confidence, request_id, provider}`. Anakalypto is blocked on it by design.
1. Registered Jev questions on public text: `source.fiable` (choice fiable / partielle / non fiable;
   input: domain, page title, ≤ 500-char excerpt, claim type) and `publication.prete` (noul; input:
   verifier summary, word counts, validator result).
2. CI step: `affirmations.mjs verifier` on committed `*.claims.json` next to article batches.
