# Lot Claude clos — #64 et #65 intégrées

Le contenu ci-dessous est historique : import stdin et contre-revue #64 repris
en 7f0efd4/a2f2be4/8127e41 ; complément Git c6ead2c repris en 063d402.
Copie active c6ead2c vérifiée ; aucun de ces travaux n'est encore à demander.
Nouveau lot ciblé : CLAUDE-NEXT-SOURCE-QUALITY-2026-10-06.md.

## Mission historique

#63 est intégrée avec provenance ; lire REVIEW-CODEX-PR63-2026-10-06.md et le
haut de SESSION_HANDOFF pour les versions actives et les preuves. Ne pas rejouer
B01/B03, les benchmarks ou les corpus déjà payés. Aucun nouveau modèle demandé.

Dans ~/Ivan-AI-Os-claude : vérifier pwd, uname -s, git status --short --branch,
fetch puis isoler agent/claude/pilot-final-review depuis
origin/agent/codex/alerts-integration sans toucher aux fichiers locaux modifiés.
Pas de stash/reset/clean. Codex reste propriétaire du runtime et des lecteurs.

1. #65 est reprise jusqu'à 1c91ce3, déjà installée par Claude : faux positif
   prose corrigé, 19/19 tests hook/adaptateur confirmés. Ne pas refaire ce lot.
   Terminer seulement normalizeGit : --no-optional-locks, --glob-pathspecs,
   --noglob-pathspecs et --icase-pathspecs, acceptés par Git 2.42.0, font encore
   passer stash en evaluer au lieu de never. Preuve et quatre tests rouges dans
   REVIEW-CODEX-PR65-2026-10-06.md. -C/dossier et -cclef=valeur sont invalides :
   ne pas les traiter comme des contournements prouvés.
   Ajouter les cas aux tests avec stash, push forcé/main, reset --hard et clean -f ;
   préserver git status/log et les données citées. Les formes non comprises
   restent evaluer. Ne pas remplacer la configuration ou la copie active :
   livrer un seul complément source, Codex coordonne ensuite son installation.

2. Corriger un défaut d'import reproduit pendant la restauration sur copie :
   l'entrée CLI de skills/jev-decision/scripts/classify.mjs appelle realpathSync
   sur process.argv[1], qui vaut « - » avec node --input-type=module -.
   Importer le module fait ENOENT avant toute opération. Écrire d'abord un test
   d'import par stdin et, si nécessaire, vérifier les gardes CLI des skills appelants.
   L'import ne doit lancer aucun réseau, modèle ou fichier d'entrée CLI. Conserver
   l'usage normal en fichier et la provenance ; petit correctif dans skills/.

3. Relire les changements Codex ciblés, pas une nouvelle revue générale : reprise
   des candidats après disparition RSS, date primaire des deux nouveaux lecteurs,
   codes des refus, persistance des avertissements Business. Rapporter seulement
   un défaut reproduit ou un avis sur ces critères, avec les SHA exacts. Vérifier
   la version éditoriale v3-business-market ; pas de jugement de sortie nouvelle
   tant qu'aucun vrai message de cette version n'a été produit.

4. Préparer la contre-revue de clôture K09/K10 : séparer vérifié, limité, différé.
   B03 est insuffisant, même s'il a été livré ; aucun test historique ne valide
   l'utilité quotidienne. Ne pas présenter création/push d'un dépôt comme date
   d'un README. Ne pas fusionner les chiffres divergents Mistral. Knowledge/Anakalypto
   reste la dernière étape commune ; Career et OVH restent différés.

Livrer code/tests limités à skills/, hooks/claude/rules.mjs et ses tests,
avec la note docs/REVIEW-CLAUDE-PILOT-FINAL.md. Le correctif du hook ne change
ni les limites d'autorisation ni son mode ; son installation reste coordonnée.
Commit/push et PR brouillon vers la branche Codex, sans fusion ni activation,
sans modifier sa file, ses réglages ou son worktree. Aucune nouvelle sollicitation
d'Ivan pour les opérations autonomes déjà autorisées. Codex prend les corrections
runtime, leur activation et les preuves de livraison.
