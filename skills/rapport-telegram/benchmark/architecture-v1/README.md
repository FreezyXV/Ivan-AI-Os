# Benchmark d'architecture v1

- `fixtures.jsonl` : 26 enveloppes `item` (21 réelles, lecteur de production @f9b502f ; collecte
  simulée à `publishedAt + 2 h`, documentée ; 5 synthétiques en `example.org`).
- `labels.json` : sélection, livraison, raison codée, argument, désaccords, plus `routage`
  (6 demandes) et `pannes` (3 fautes à injecter). Figés avant toute mesure ; empreinte des
  fixtures incluse. Ne jamais les transmettre au modèle.
- Évaluateur : `skills/rapport-telegram/scripts/benchmark-architecture.mjs` (`rules`, `score`).
- Protocole et résultats : `docs/ARCHITECTURE-BENCHMARK-2026-10-05.md`.
