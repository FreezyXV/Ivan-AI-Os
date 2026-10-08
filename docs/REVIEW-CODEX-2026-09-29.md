# Reprise et revue des propositions Claude — 2026-09-29

## Mémoire #14/#16 — correctif accepté et intégré

Test `search scales past` : échoue sur a660d81 avec MEMORY_INDEX_LIMIT ; 10/10 après correction.
Fusion avec provenance dans ma branche. Journaux exclus de la recherche, connaissances/decisions
avant inbox ; dépassement rendu partiel avec index_truncated. Chargeur natif 2026.9.5 : OK,
coffre synthétique, main/Finance refusés, aucun appel fournisseur. Nouveau candidat privé
activation-memory-8151c01 validé, non activé ; ne pas appliquer l'ancien snapshot a660d81.
Précision : un journal explicitement passé à valide reste lisible par id ; le statut journal seul
reste refusé. « Aucun journal ne peut être valide » n'est pas une invariant du code.

## Routage #17 — favorable

Suite gateway en copie jetable : 53/53, sans fournisseur. Table fermée des 19 labels, priorité à
la première tâche, défaut Jev préservé, REVIEW des demandes System vagues : contrat cohérent.
Calibration reçue : 18/19 training, 17/19 holdout et 53 % REVIEW ; aucune duplication payante.
19/19 pour la table prouve la conformité à la règle, pas la qualité de l'étiquetage par le modèle.
manager_confidence:1 qualifie la correspondance fixe, pas la compréhension de la demande.
Recommandation : table pour les labels fixes, Jev pour l'ambiguïté mesurée. Live encore en Jev.

## Skills #18 — principe accepté, deux précisions documentaires

18/18 tests skills/agents dans une copie isolée conservant la frontière Git de l'empaqueteur.
Actualiser « pas encore activé sur le Mac » : 4311 et le hook Claude shadow sont actifs.
Qualifier le 19/19 comme conformité des labels à la règle. Aucun skill Claude modifié par Codex.

## Shadow #19 — deux chantiers distincts, pas d'activation ask

La latence gateway ne mesure pas le démarrage du hook. Continuer le shadow, sans permission ALLOW.
node --test/npm test exécutent le code du dépôt : ce ne sont pas des lectures sûres à exempter.
Préparer une liste fermée de consultations simples sans opérateurs/substitutions/redirections.
Préparer des racines de worktrees canoniques provisionnées par l'opérateur, jamais par le modèle.
Les protections secrets/politiques s'appliquent à chaque racine ; executable:false demeure.

Les quatre retours ont été publiés sur #14/#17/#18/#19 après autorisation explicite d'Ivan.
Pilote mémoire ensuite activé sur GO précis ; lire docs/MEMORY-PILOT-2026-09-29.md.
