---
name: system-steward
description: Entretien d'Ivan AI OS par le System Manager - jardinier de mémoire (doublons, contradictions possibles, propositions périmées, notes incomplètes, sources récurrentes dans le coffre Obsidian) et auditeur des skills et de la configuration (coût en contexte des descriptions, règles dupliquées, skills trop longs ou peu utilisés, fichiers d'instructions qui grossissent). Utiliser chaque semaine, avant d'ajouter un skill, quand les sessions deviennent lentes ou coûteuses, ou quand Ivan dit "fais le ménage", "audit du système", "état de la mémoire".
compatibility: "claude-code, codex"
metadata:
  version: "1.0.0"
  famille: system
  manager: system
  risque: lecture
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, roadmap v1 sections 7 (Dreams / Memory Gardener) et 15 (System Steward), 2026-09-29"
---
# System Steward

Deux outils en code pur (0 token), en lecture seule :
- `node skills/system-steward/scripts/jardinier.mjs [--proposer]` : jardin de la mémoire.
- `node skills/system-steward/scripts/audit.mjs [--json]` : audit des skills et de la configuration.

## Jardin de la mémoire (hebdomadaire)
Examine `Ivan AI OS/` du coffre : doublons probables (titres proches, sources communes),
contradictions possibles (même sujet, chiffres différents), propositions non validées > 30 j,
journaux > 90 j à résumer, faits validés > 1 an à revérifier, notes incomplètes, sources citées
par 3 notes ou plus (sujet important). `--proposer` écrit **une** note de décision dans `inbox/`.
Jamais de fusion, déplacement ni suppression : Ivan valide, puis `memoire-obsidian` applique.

## Audit (avant d'ajouter un skill, et chaque mois)
Coût permanent des descriptions (chargées à chaque session), descriptions > 600 caractères,
corps > 120 lignes, skills actifs sans `evals.json`, skills avec un seul manager et aucun runtime
lié, règles longues copiées dans plusieurs skills, `AGENTS.md`/`CLAUDE.md` > 60 lignes.
Corriger en PR (`dev-studio`, `revue-croisee`) ; ne jamais modifier la constitution ni `AGENTS.md`
sans accord des deux agents et GO d'Ivan.

## Sortie
Résumé de 5 lignes à Ivan via `rapport-telegram` si quelque chose est « à corriger » ; sinon rien.
