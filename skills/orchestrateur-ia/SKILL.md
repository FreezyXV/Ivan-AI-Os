---
name: orchestrateur-ia
description: Choisir le bon outil de l'écosystème IA d'Ivan pour chaque tâche et économiser les quotas (Claude, Claude Code, Codex/ChatGPT, Secrétaire OpenClaw sur Telegram, Sentinelle, Jev). Utiliser quand Ivan demande "qui fait quoi", "comment automatiser", "quel outil", "ça coûte trop de tokens", ou avant de lancer une tâche longue ou récurrente.
metadata:
  version: "2.0.0"
  famille: system
  manager: system
  risque: lecture
  profil: "oui"
  statut: actif
  provenance: "skill claude.ai d'Ivan orchestrateur-ia v1, adapté Ivan-AI-Os 2026-09-29"
---
# Orchestrateur IA

## Qui fait quoi
| Besoin | Outil | Pourquoi |
|---|---|---|
| Classer, trier oui/non, noter, router, pré-contrôler une action | **Jev** (skill `jev-decision`) | Quelques centimes ; budget 10 €/mois à utiliser |
| Plan global, services, OpenClaw, infrastructure du dépôt | **Codex** | Bâtisseur principal d'Ivan-AI-Os |
| Skills, agents, relecture croisée, gros refactor, lots Anakalypto | **Claude Code** | Agents, hooks, worktrees, skills |
| Livrable important, stratégie, document long, analyse | Claude (chat) | Qualité, skills |
| Premier jet, reformulation, image, second avis | ChatGPT | Préserve le quota Claude |
| Offres d'emploi, relances, question rapide en mobilité | Secrétaire (@secretaireivanbot) | Automatisé |
| Veille actualité IA/tech/finance/business | Sentinelle (automatique) | Gratuit, filtré par Jev |

## Règles d'économie
1. Cascade : code déterministe → Jev → modèle standard → modèle le plus puissant (architecture ou
   décision à fort enjeu seulement) → Ivan pour l'irréversible.
2. Une tâche = une conversation ; nouvelle conversation dès que le sujet change.
3. Livrables dans des fichiers, pas recopiés dans le chat ; modifications par remplacement ciblé.
4. Répétitif ou planifié → Secrétaire, Sentinelle ou Jev, pas un modèle premium.
5. Reprise d'un chantier → skill `passation-session` au lieu de relire l'historique.
6. Deux agents sur un dépôt → skill `revue-croisee` : un bâtit, l'autre relit.

## Confidentialité
Lire la section « Clients et données confidentielles » de `profil.md` (profil privé : à côté
de ce fichier une fois empaqueté, sinon `~/.ivan-ai-os/profil.md` ; jamais dans le dépôt) et appliquer sa règle de routage. À défaut de profil :
aucune donnée client ni finance personnelle hors de la conversation en cours.

## Sortie attendue
Pour une tâche donnée : l'outil recommandé, le prompt ou la commande prête à coller, et
l'estimation de coût (quota ou €).
