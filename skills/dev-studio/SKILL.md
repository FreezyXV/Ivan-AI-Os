---
name: dev-studio
description: Méthode de développement rapide, testée et économe pour Ivan (Next.js/TypeScript/Prisma par défaut, Node pur pour les services) - cadrage, architecture, découpage en tickets, preuve avant correctif, tests minimaux utiles, CI gratuite, branches par agent. Utiliser pour toute tâche de code : nouveau projet, MVP, fonctionnalité, bug, refactor, intégration API, "prépare ce repo", tests, même si Ivan ne demande pas de méthode.
metadata:
  version: "2.0.0"
  famille: engineering
  manager: engineering
  risque: ecriture-depot
  profil: "non"
  statut: actif
  provenance: "skill claude.ai d'Ivan dev-studio v1, adapté Ivan-AI-Os 2026-09-29"
---
# Dev studio

## Selon la tâche
| Tâche | Chemin |
|---|---|
| Triviale (< 20 lignes, 1 fichier) | diff direct → GO d'Ivan → appliquer |
| Nouvelle fonctionnalité / projet | Cadrage → Architecture → GO → tickets |
| Bug | Reproduire + prouver la cause (log, test qui échoue) AVANT tout correctif |
| Travail d'un autre agent à relire | skill `revue-croisee` |

## Nouveau projet
1. **Cadrage** (une seule fois) : objectif, utilisateurs, 5 fonctionnalités MVP, contraintes
   (budget 0 €, hébergement), critère de succès.
2. **Architecture** : Next.js App Router + TypeScript strict + Prisma + PostgreSQL (Neon) + Vercel,
   Vitest + Playwright, ESLint + Prettier. Service ou outil sans UI : Node ≥ 22 pur, `node --test`,
   zéro dépendance si possible. Produire depuis `modeles/` : `CLAUDE.md` (< 80 lignes, qui importe
   `@AGENTS.md` si le dépôt en a un), `docs/ARCHITECTURE.md`, `docs/TICKETS.md`. **GO d'Ivan.**
3. **Direction artistique avant le premier composant** : skill `design-original`, tokens dans
   `src/styles/tokens.css`.
4. **Exécution ticket par ticket** : modification minimale → tests → cocher le ticket.

## Tests (minimum utile)
- Logique métier : cas nominal + 2 cas limites par fonction.
- Parcours critiques : Playwright, 3 à 5 tests pour un MVP.
- Correctif : le test doit échouer sans le correctif (le vérifier une fois).
- Pas de tests d'implémentation ni de snapshots de composants.
- CI gratuite : copier `modeles/ci.yml` dans `.github/workflows/`.

## Dépôt partagé entre agents
- Une branche par agent et par sujet : `agent/<nom>/<sujet>` ; worktree séparé si un autre agent
  travaille dans le même dépôt.
- Jamais de `stash`, `reset`, `checkout` dans le répertoire d'un autre agent.
- PR relue par l'autre agent avant fusion ; rien sur `main` sans GO d'Ivan.

## Règles d'Ivan
- Écriture, commit, push, migration, déploiement : présenter le diff, attendre "GO", journaliser,
  sauf autonomie déclarée dans le `CLAUDE.md` du projet.
- Pas de refactor hors périmètre.
- Réponses : fichiers modifiés + commande de test ; pas de code recopié inutilement dans le chat.
- Pour les gros chantiers : Claude Code ou Codex (agents, hooks, worktrees) plutôt que le chat.
