---
name: revue-croisee
description: Protocole de relecture croisée entre agents (Claude Code ↔ Codex) sur un même dépôt, sans se gêner - worktree séparé, lecture seule du travail de l'autre, constats prouvés par une commande, correctifs minimaux sur une branche agent/<nom>/<sujet>, note de revue et PR relue avant fusion. Utiliser dès qu'il faut relire, auditer ou compléter le travail d'un autre agent, reprendre une branche, ou quand Ivan dit "relis", "vérifie ce qu'a fait Codex/Claude", "aide-le sans le gêner".
compatibility: "claude-code, codex"
metadata:
  version: "1.0.0"
  famille: engineering
  manager: engineering
  risque: ecriture-depot
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, revue Claude de d0adb4f et PR #2 (2026-09-28/29)"
---
# Revue croisée

## Règles de coexistence (non négociables)
- Le répertoire de l'autre agent est en **lecture seule** : `git status`, `git diff`, `git log`,
  lecture de fichiers, tests qui n'écrivent rien. Jamais `checkout`, `stash` (partagé entre
  worktrees), `reset`, `clean`, `add`, `commit`, ni installation.
- Travailler dans un worktree séparé :
  `git -C <dépôt> worktree add <dépôt>-<agent> -b agent/<agent>/<sujet> origin/<branche>`.
- Ne jamais modifier un fichier que l'autre a modifié et pas encore commité.
- Aucun push, aucune PR, aucun commentaire public sans le GO d'Ivan (sauf accord durable).

## Étapes
1. **État** : `git status --short`, `git diff --stat`, commit de base. Noter ce qui est non commité.
2. **Tests** de l'autre agent, tels quels. Rapporter OK/KO avec les nombres exacts.
3. **Lecture ciblée** : sécurité, contrats entre modules, cas limites, écarts doc ↔ code.
4. **Chaque constat est prouvé** : commande lancée + sortie, ou test qui échoue. Pas de preuve → le
   classer en question, pas en bug.
5. **Correctif minimal** dans son worktree : test qui échoue d'abord, puis correctif, puis montrer
   que le test échoue sans le correctif. Hors périmètre → le noter, ne pas le corriger.
6. **Note de revue** `docs/REVIEW-<AGENT>-<AAAA-MM-JJ>.md` (≤ 40 lignes) : tests, constats classés,
   diff, points ouverts. Lignes ≤ 110 caractères.
7. **Livrer à Ivan** : résumé, puis attendre le GO avant push/PR/commentaire.

## Classement des constats
| Niveau | Critère |
|---|---|
| Bloquant | Faille, perte de données, test faux, contrat cassé |
| À corriger | Faux positif/négatif gênant, dette qui va coûter |
| Remarque | Style, doc, amélioration facultative |

## Contester, pas complaire
Désaccord = argument + preuve exécutable. Accepter une contestation prouvée de l'autre agent et le
dire explicitement. Le pilote du plan tranche ; Ivan tranche en dernier.
