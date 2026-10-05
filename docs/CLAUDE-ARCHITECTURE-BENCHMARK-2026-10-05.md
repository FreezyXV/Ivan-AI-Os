# Mission Claude actuelle — terminer #60 et qualifier les sorties

À donner dans le terminal Claude Code de Cursor, worktree `~/Ivan-AI-Os-claude`.
Continuer la branche `agent/claude/architecture-benchmark` et la PR #60 existantes.
Vérifier pwd, uname -s, git status --short --branch ; récupérer origin sans écraser
les fichiers locaux. Aucun stash/reset/clean/changement forcé, aucune modification
du checkout Codex. Lire AGENTS.md, constitution, architecture et le relais courant
sur origin/agent/codex/alerts-integration ; noter le SHA examiné et l'état live séparément.

Ton corpus de 26 cas est maintenant mesuré une seule fois : ne pas refaire les appels,
les 94 cas, les 83 dev ni les huit anciens exemples. Les labels restent figés.
Priorité Ivan : fiabilité sur Mac, puis Business et Finance ; Jev seulement qualifié.
Career en pause, OVH différé, Knowledge/Anakalypto en dernière étape commune.

## 1. Corriger les constats de #60

Lire REVIEW-CODEX-ARCHITECTURE-BENCHMARK-2026-10-05.md. Deux seuils probabilistes
satisfaits donnent review : utiliser selectionOutcome du runtime, jamais keep prioritaire.
Le calcul correct du dev est 10/14 utiles, zéro bruit, 58/83 exacts. Ton ancien 14/14
avec 25 bruits décrit une autre politique. Le mode actif a604aa6 était native-editorial,
contexte v5, et deux synthèses automatiques ont été livrées avec le reçu 59.
Codex prépare le mode conservateur E : Jev v5 à 0,75 puis jugement/rédaction natifs.
Sur les mêmes sorties E donne 3/5 utiles, zéro faux keep ; rappel limité assumé,
pas de qualification universelle. Lire le relais pour savoir si E est désormais actif.

## 2. Exploiter la passe enregistrée, sans appel supplémentaire

Résultats privés publics-documentaires :
~/.ivan-ai-os/mac-alerts-a604aa6/architecture-benchmark-v1.jsonl.
26 cas, 22 tentatives Jev et 22 natives ; une erreur Jev et cinq natives conservées.
La sortie comprend les briefs keep. Les catégories/labels n'ont pas été envoyés.
B à 0,75 : 4/5 utiles, aucun faux keep ; C et D : 4/5, trois faux keep ; E : 3/5, aucun.
Noter fidélité, utilité, action et lisibilité de toutes les sorties keep, et expliquer
A02/A03, A07/A10/A18, A24. Séparer bruit réellement inutile et désaccord de label,
sans retoucher les réponses attendues de cette passe. L'urgence dépend de l'inventaire.
Les dates rejouées ne prouvent pas la fraîcheur d'une veille réelle quotidienne.
L'erreur Jev A10 porte sur une source contenant une adresse de contact publique :
proposer une adaptation documentée, sans élargir l'accès aux données privées.

Corriger ton scoreur : couverture exacte des IDs, aucun doublon/ID inconnu ignoré,
valeurs énumérées valides, erreurs et absences comptées. Tests avant/après.
Le routage live est une table ; ne pas appeler /v1/route puis présenter le résultat
comme un benchmark Jev. Exploiter les tests existants avant toute nouvelle mesure.

## 3. Relire les deux synthèses de production et améliorer le contrat

Preuve : ~/.ivan-ai-os/mac-alerts-a604aa6/native-editorial-cycle-followup.json.
Relire les messages Simon Willison et ThinkingBox effectivement livrés (reçu 59).
Le message budget se focalise trop sur Jev : son plafond ne couvre que TypeSafe,
pas les autres modèles/services. Proposer une utilité/action claire pour le système
complet, sans inventer une configuration. Éviter les faits répétés, les protocoles
obligatoires issus d'une étude et les actions vagues. Conserver faits/déductions/limites.
Mettre à jour rapport-telegram, jev-decision et calibration-jev dans ton périmètre
avec les versions/modes réels ; préciser les usages Jev encore non qualifiés.

Livrer corrections et verdicts dans la PR #60 ; skills sur une branche séparée si utile.
Tester, committer, pousser et donner les SHA exacts. Codex intègre services/, hooks/openclaw/
et le runtime ; tu ne les modifies ni ne les actives. Aucun fichier partagé AGENTS.md/
constitution changé, aucune fusion ni activation, aucune nouvelle passe payante.

## Historique de la mission initiale

# Mission Claude — architecture et benchmark indépendant

À utiliser dans le terminal Claude Code de Cursor, worktree `~/Ivan-AI-Os-claude`.
Codex garde l'intégration et le runtime ; Claude compare et conteste avec des preuves.

Vérifier `pwd`, `uname -s`, `git status --short --branch`, puis `git fetch origin`.
Préserver les fichiers locaux. Créer `agent/claude/architecture-benchmark` depuis
`origin/agent/codex/alerts-integration`, dans un checkout propre si nécessaire.
Noter le SHA examiné : Codex continue cette branche. Distinguer le code du runtime.

Lire AGENTS.md, constitution/CONSTITUTION.md, docs/ARCHITECTURE.md,
docs/SESSION_HANDOFF.md et docs/PROJECT-CHECKLISTS.md.

## Décisions d'Ivan

- Fiabilité sur Mac d'abord, puis Business et Finance.
- Jev seulement là où sa qualité est démontrée ; aucun passage obligé.
- Career en pause, OVH différé, Knowledge/Anakalypto terminé en dernier ensemble.
- Alertes autonomes : faits, utilité concrète, prochaine étape proportionnée, lien final.
- Workers temporaires privilégiés aux spécialistes permanents.

## 1. Comparer les architectures

Comparer règles seules ; règles + Jev ; règles + une complétion native qui décide
l'utilité et rédige seulement si utile ; combinaison ciblée selon les tâches qualifiées.
Examiner routage, veille, Business/Finance, contrôle des résultats et reprise après panne.
Recommander code/Jev/LLM/humain par tâche ; décrire dépendances, appels évitables et pannes.
La sélection d'une information n'autorise jamais l'exécution de son conseil.

## 2. Benchmark indépendant

Créer un petit corpus nouveau avec labels fixés avant toute mesure. Inclure informations
utiles, bruit, lien plausible insuffisant, extrait incomplet, panne fournisseur, demandes
mixtes et sujets différés. Séparer pertinence sémantique, fraîcheur, urgence et autorisation.
Une information peut être utile au digest sans justifier une alerte immédiate.

Mesurer rappel des informations utiles, bruit retenu, utiles écartées, abstentions,
fidélité, utilité, action, lisibilité, médiane/p95 des temps, appels, erreurs et reprises.
Chiffrer seulement le coût connu ; caractères de prompt ≠ tokens facturés.
« Review » systématique n'est pas une réussite. Un cas synthétique n'est pas une preuve
d'utilité d'une veille réelle. Ne pas reclasser les réponses attendues après les résultats.

Ne pas refaire les passes enregistrées dans `~/.ivan-ai-os/mac-alerts-f9b502f/` :
`probability-measure-v3.jsonl`, `candidate-v4-dev.jsonl`, `candidate-v5-dev.jsonl`,
`candidate-v5-independent.json`. Le contrôle `controle-v2` est désormais consommé.
Il donne 11/12 stricts ; le désaccord V12 concerne un digest informatif conditionnel
sur Telegram, défendable selon le label initial, sans preuve d'urgence locale.

Commencer hors ligne. Livrer fixtures, labels figés et commande exacte avant un nouveau
benchmark réel : Codex coordonne une exécution, aucune mesure payante concurrente.

## 3. Livrables et périmètre

Livrer `docs/ARCHITECTURE-BENCHMARK-2026-10-05.md`, corpus/évaluateur/tests,
tableau des usages Jev qualifiés/non qualifiés/inutiles, changements ordonnés par
bénéfice mesurable et revue de la vraie synthèse de production fournie par Codex.

Modifier documents, évaluations, skills et contrats métier du lot Claude. Pour services/,
shared/, hooks/openclaw/, proposer des diffs ; Codex intègre après relecture. Ne pas
changer les checkouts d'autrui, la configuration live, AGENTS.md ou la constitution.

Tester, committer, pousser, ouvrir une PR brouillon pour relecture. Ne pas fusionner
ni activer. Aucun secret dans les livrables. Conserver les désaccords argumentés.
