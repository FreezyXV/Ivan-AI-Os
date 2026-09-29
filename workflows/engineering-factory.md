# Workflow — Engineering factory (Engineering Manager)

Owner: Claude (skill `usine-logicielle`). Cross-review is mutual; merges need Ivan's GO.

| # | Step | Who | Tokens |
|---|---|---|---|
| 1 | Decompose into ≤ 1 h tickets with a category | `dev-studio` (LLM) | premium, short |
| 2 | **Jev category gate** when the ticket text is ambiguous | Jev `tache.categorie` (future) | cents |
| 3 | Builder choice: files' owner → measured success (≥ 3 reviewed PRs each) → roadmap prior → alternation | `usine.mjs recommander` (code) | 0 |
| 4 | Build on `agent/<name>/<topic>`, failing test first; hook `gate` enforces level-0 rules | builder | premium |
| 5 | Review by the other agent with proven findings | `revue-croisee`, `revue-securite-diff` | premium |
| 6 | **Jev severity gate** per finding: blocking / to fix / remark | Jev `constat.severite` (future) | cents |
| 7 | Disagreement → focused second pass; plan pilot decides, Ivan last | both | premium, rare |
| 8 | Merge on Ivan's GO; record the outcome | `usine.mjs enregistrer` (code) | 0 |

Seed: 14 reviewed PRs of 2026-09-29 (`skills/usine-logicielle/historique.jsonl`).

## Requests to Codex
Registered Jev questions `tache.categorie` (choice over the 11 categories; input: ticket title ≤ 200
chars, file extensions touched) and `constat.severite` (choice; input: finding summary ≤ 300 chars,
evidence type). Public text only — no source code, no secrets.
