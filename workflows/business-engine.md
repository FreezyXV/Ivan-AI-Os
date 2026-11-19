# Workflow — Business Engine (Opportunity Manager)

Owner: Claude (contract, skill `business-engine`). Runtime, schedule and Jev questions: Codex.
Status: v1 manual/Claude Code; weekly Mac cycle (Ask HN demand → `signal.pertinent`, max 4) built by
Codex on `agent/codex/alerts-integration`, not yet merged. A watch cycle never replaces scoring.

## Steps

| # | Step | Who | Tokens |
|---|---|---|---|
| 1 | Collect 15–40 public signals (one search per source class) | worker (LLM + web) | premium, bounded |
| 2 | Clean: validate, canonical URL, dedupe by URL and by (subject, title) | `signals.mjs ajouter` (code) | 0 |
| 3 | Prioritise subjects by number of distinct sources | `signals.mjs sujets` (code) | 0 |
| 4 | **Jev relevance gate** (live): demand signals only; < 0.4 dropped, 0.4–0.6 flagged; offers counted apart as payment evidence | `signals.mjs trier` → Jev `signal.pertinent` | cents |
| 5 | Research the top 3–5 subjects, gather evidence URLs | worker (LLM + web) | premium, bounded |
| 6 | Score /30, eliminators, Cash/Venture, decision | `signals.mjs noter` (code) | 0 |
| 7 | **Jev quality gate**: is each criterion supported by its link? (`suffisante` / `incertaine` / `insuffisante`) | Jev `preuve.suffisante` | cents |
| 8 | Report top 3 → Obsidian decision note + Telegram synthesis (proof / hypothesis / coded recommendation) | `signals.mjs rapport`, `memoire-obsidian`, `rapport-telegram` form A | 0 |
| 9 | Human gate: contact, purchase, publication | Ivan | — |

Private data: `~/.ivan-ai-os/business/` (0700; `signals.jsonl`, `opportunites.jsonl`), never Git.
Signals contain public web data only. No client names, no personal finances.

## Decision rules (code, `signals.mjs`)
- Six criteria 0–5; a note above 1 requires an evidence URL.
- No payment evidence ⇒ eliminated. Also eliminators: single-platform dependency, heavy regulation.
- ≥ 22/30 launch, ≥ 16 dig, otherwise drop. First euro ≤ 30 days ⇒ Cash, else Venture.

## Synthesis example (manual, real Ask HN read 2026-10-05; not a pipeline output)

Exploratory demand signal: one source, no payment evidence, no score — the message says so.

```
Ask HN: Is anybody producing good code with coding agents?
Publié le 2026-10-02.
• Un développeur demande sur Hacker News qui a résolu la mauvaise qualité du code produit par les
  agents de code ; il dit entendre ce problème chez des ingénieurs seniors.
• Il affirme que relire les demandes de fusion produites par Claude lui prend 5 fois plus de temps
  et qu'il comprend mal ce qu'il approuve.

Utilité pour toi : hypothèse, pas preuve — la relecture du code écrit par des agents pourrait être
un problème monétisable (outil ou service de relecture), un terrain que l'usine logicielle d'Ivan
AI OS pratique déjà avec la relecture croisée Claude/Codex.

À faire : rien à lancer. Chercher deux autres sources distinctes de cette douleur, dont une preuve
que des équipes paient déjà pour ce type de relecture, avant toute notation.

Limite : un seul message au ton émotionnel ; aucune preuve de paiement ni taille de marché ;
commentaires non lus. Recommandation codée : aucune (signal non noté).

Source : https://news.ycombinator.com/item?id=49934037
```

Quotes behind the two facts (exact): « This is a genuine problem that I hear from senior engineers.
I'm looking for a solution. » and « It takes 5x longer to review Claude merge requests and I barely
understand what I approve. »

## Requests to Codex (runtime perimeter)
1. Registered Jev questions for `/v1/classify` (public text allowed, never private data):
   - `signal.pertinent` (noul): « Ce signal public décrit-il un problème réel pour lequel des gens paient
     ou paieraient ? » — input: `titre`, `extrait` (≤ 500 chars), `type`. Replaces step-4 LLM reading.
   - `preuve.suffisante` (choice: suffisante / partielle / absente) per criterion — input: criterion
     name, note, evidence page title + ≤ 500-char excerpt.
   Expected savings: the LLM reads only subjects that pass the gate (typically 3–5 of 20–40).
2. Weekly schedule for the Business manager on OpenClaw (collect → report), delivery via the chief.
3. Tool access for the Business manager to the ledger (read/append) without `exec`.
