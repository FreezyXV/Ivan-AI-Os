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
