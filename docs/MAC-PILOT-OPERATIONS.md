# Pilote Mac — diagnostic et pauses vérifiées

État du 5 octobre 2026 : Jev 4311 et OpenClaw 18789 sains. Career est retiré
du registre **actif**, des délégations et des tâches planifiées. Sa définition
complète et son workspace sont conservés ; les sept rôles restent définis dans
le projet, dont six configurés actuellement sur OpenClaw.

## Pause persistante

Retirer Career seulement des `allowAgents` du chef ne suspendait pas sa revue
Workshop hebdomadaire. La commande native `cron disable` a renvoyé :
`system-owned monitor jobs cannot be edited by cron clients`.
Le correctif utilise la configuration source du registre ; la tâche système
disparaît ensuite à la convergence native. Pas de modification de la base
interne OpenClaw ni de contournement du refus de son API.

Preuve privée : `~/.ivan-ai-os/pause-career-complete-20261005/result.json` :
ACTIVE, Career absent du registre actif, zéro tâche Career active, workspace
préservé et définition de la Secrétaire identique. Définition Career et rollback
privés à côté. La restauration devra suivre une demande de reprise d'Ivan.

`shared/pilot-state.mjs` consigne le périmètre public du pilote. Le préparateur
`prepare-manager-workspaces.mjs` utilise sa liste de pauses par défaut.
Le cinquième argument optionnel permet une liste explicite séparée par virgules.
Les sept espaces peuvent être préparés ; le fragment natif exclut les rôles
PAUSED, et `buildDispatchPlan` ne propose pas de spawn vers eux. Les générateurs
continuent de refuser d'écraser des managers déjà configurés.
Deux tests échouaient avant la correction : Career restait PREPARED au lieu de
PAUSED et réapparaissait dans le candidat. Ils passent après le correctif.

## Revues automatiques incompatibles

L'inventaire **natif**, `openclaw cron list --all --json`, révélait neuf tâches
avant la pause, huit ensuite. Chercher uniquement un ancien `cron/jobs.json`
ne révélait pas ce registre. Ce fichier n'est plus la référence de diagnostic.

Six revues Workshop partageaient une erreur exacte retrouvée dans le code
installé `execution-root-runtime-Cn0UlMtn.mjs:2` :
`collection review requires a runtime that enforces the Workshop root through OpenClaw tools`.
Le runtime sélectionné ne prend pas en charge cette exécution ; aucune nouvelle
permission, aucun nouveau modèle et aucun contournement n'ont été ajoutés.

`skills.workshop.autonomous.mode` est passé à `propose`, par configuration
privée validée et restart contrôlé. Les six revues deviennent inactives ; les
managers, leurs modèles, les outils et les canaux restent inchangés. La capture
de propositions reste disponible ; la revue des skills relève du lot Claude.
Preuve : `~/.ivan-ai-os/workshop-propose-20261005/result.json`.
Le heartbeat et la consolidation mémoire existants sont toujours activés.
Une revue autonome future exigera un runtime compatible, puis un test isolé.

## Diagnostic utilisable

Depuis le dépôt : `node scripts/inspect-mac-pilot.mjs`.
Le script interroge les APIs natives avec délais bornés et le bearer Jev privé.
Il rapporte santé, coût estimé et nombre d'appels, tâches actives/inactives,
erreurs historiques et `activeErrors` par rôle. Il ne rapporte pas les prompts,
destinataires, corps de sources, credentials ou exceptions brutes.
Un inventaire incomplet reste une erreur ; il ne signifie pas zéro tâche.
Le diagnostic ne lance aucun modèle et n'envoie aucun message.

Au dernier contrôle : services sains, Career 0 tâche active, six revues
désactivées, zéro erreur historique appartenant encore à une tâche active.
Cela ne prouve pas que les collectes Business/Finance sont planifiées : elles
restent distinctes de la maintenance Workshop et sont encore à raccorder.

## Sentinelle

La lecture Telegram a confirmé un mode calibrage avec liens et scores de
mots-clés. Ce n'est pas une synthèse éditoriale. Son producteur n'est toujours
pas identifié dans le dépôt, les LaunchAgents examinés ou les tâches natives.
Le Mac s'est verrouillé durant l'inspection ; aucune alerte Sentinelle ni son
horaire n'a été modifié. L'identification et le raccordement restent C04/C10.
