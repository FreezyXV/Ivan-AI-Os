# Pilote Mac — diagnostic et pauses vérifiées

## Usage quotidien des alertes (état du 8 octobre 2026)

**Ce qui tourne seul.** Le worker traite la file toutes les cinq minutes : tri natif, rédaction,
puis seconde lecture indépendante (`NATIVE-ALERT-TRIAGE.md`). Rien n'est envoyé hors du digest
de 19:30 (Paris). Jour sans synthèse retenue : **aucun message**, c'est normal. Aucune
confirmation à donner et aucun redémarrage à faire pour qu'un message parte ; les skills ne
demandent pas de redémarrage du service.

**Lire un message.** Titre, date de publication, 1 à 3 faits, « Utilité pour toi », « À faire »,
« Limite », puis la source en dernier. « Lecture sur extrait partiel » veut dire que seule une
partie de la page a été lue : un point absent du message n'est ni confirmé ni démenti.

**Le reçu.** Chaque page de digest envoyée reçoit un numéro de message Telegram (ex. 62), conservé
dans la file. Un envoi au résultat incertain n'est **jamais** renvoyé automatiquement : mieux
vaut un message manquant qu'un doublon. En cas de doute, regarder Telegram, puis le diagnostic.

**Noter un message (la seule mesure d'utilité qui compte).** Répondre à la Secrétaire, ou le
dire à Claude/Codex, sous la forme :

```
62 utile
62 inutile — je n'utilise pas le React Compiler
62 trop vague — il manquait la date de migration
```

Trois valeurs seulement : `utile`, `inutile`, `trop vague`, plus ce qui manquait si tu le sais.
Ce n'est pas encore enregistré automatiquement : l'agent qui reçoit la note la consigne. Deux
semaines de notes sur de vrais messages qualifient le pilote ; aucun test historique ne la remplace.

**Abstentions à étiqueter.** `docs/K10-ABSTENTIONS-A-ETIQUETER.md` liste dix sources réelles que le
système n'a pas envoyées. Pour chacune : `aurait dû venir`, `bien écartée` ou `indifférent`.
Claude ne tranche pas à ta place.

**Diagnostic.** En lecture seule, sans modèle ni envoi :
`/Users/yoanpetrov/.openclaw/tools/node-v24.19.0/bin/node scripts/inspect-mac-pilot.mjs`.
Plusieurs codes peuvent s'afficher en même temps ; chacun est indépendant :

| Code | Sens | Que faire |
|---|---|---|
| `WAIT_DIGEST` | des synthèses relues attendent 19:30 | rien |
| `PROCESS_PENDING` | des sources attendent le prochain passage | rien, sauf si cela dure des heures |
| `CHECK_SOURCE_READS` | une page n'a pas pu être lue (taille, date) ; les autres continuent | signaler à Codex si cela persiste |
| `EXPAND_READERS` | des sources n'ont pas de lecteur | lot Codex |
| `CHECK_EDITORIAL_REJECTIONS` | un brouillon ou le relecteur a refusé un contenu | normal en petit nombre ; aucune relance payante automatique |
| `CHECK_NATIVE_GENERATION` | le service de complétion était indisponible | un seul nouvel essai automatique |
| `CHECK_PROCESS_RECOVERY` | le dernier passage a échoué (veille du Mac, panne) | disparaît au prochain passage réussi |
| `CHECK_COLLECTION` | une collecte de flux est dégradée | vérifier au créneau suivant |

**Reprise après veille ou panne.** Le Mac qui dort interrompt des passages : ils sont fermés
(`CYCLE_INTERRUPTED`) et le passage suivant reprend la file durable, sans rejouer les créneaux
manqués ni rouvrir un envoi déjà tenté. Une panne du fournisseur arrête le passage au premier
échec ; la file attend le créneau suivant. Restaurer un ancien état seulement avec Codex : une
restauration aveugle peut effacer un reçu et créer un doublon (`MAC-NATIVE-RECOVERY.md`).

## Historique (5 octobre 2026)

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

Producteur retrouvé : dépôt privé FreezyXV/sentinelle, GitHub Actions,
quatre passages quotidiens et digest hebdomadaire, MODE=ombre confirmé.
Les dates RSS sont perdues dans l'ancien moteur ; le client Jev est indépendant.
Lire `SENTINELLE-INTEGRATION.md` : preuve, export candidat PR Sentinelle #1,
navigation Telegram au clavier et bascule sans collecteur concurrent.

## Gateway remplacé et première livraison d'essai

Release `alerts-59fbd7e` active sur 4311 : gateway 59fbd7e, runner Mac
cc1d2a5. LaunchAgent épinglé, health/auth et pause Career vérifiés ; jeton et
budget inchangés au démarrage, ancien plist conservé pour retour.
Preuve `~/.ivan-ai-os/background-alerts-59fbd7e/activation.json`.
Sélection réelle Jev et vrai client Finance vérifiés (quatre appels au total
pour ces probes). Compteur commun conservé ; pas de reprovisionnement.

Un article réellement proposé par Sentinelle a été téléchargé, daté et
empreinté. Jev renvoie review, confiance 0,73 ; la file reste en revue.
Un aperçu distinct, rédigé et relu par Codex, a été livré via Secrétaire Ivan :
reçu natif 57 et contrôle visuel Telegram. Ce n'est pas une alerte automatique
ni une modification du seuil Jev. Preuves privées dans
`~/.ivan-ai-os/alert-source-pilot-20261005/`.
