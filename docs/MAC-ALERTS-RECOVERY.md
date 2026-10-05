# Exploitation et reprise de la file d'alertes sur Mac

Le planning `com.ivan-ai-os.alerts` lance un passage toutes les cinq minutes.
Il est normalement inactif entre deux passages. Jev écoute sur 4311 ;
OpenClaw sur 18789. Le workflow Sentinelle distant reste désactivé.
Les réglages et les reçus sont privés, les releases sont épinglées.

Diagnostic depuis le dépôt : `node scripts/inspect-mac-pilot.mjs`.
Lire la santé **et** `alerts.diagnosis`, les raisons de revue, les dernières
collectes et la dernière livraison. Un service sain sans nouvelle alerte retenue
n'est pas une panne. Ne pas réactiver le planning Sentinelle en parallèle.

Une page illisible reste non lue ; une sélection incertaine reste en revue.
Les revues devenues anciennes quittent la file active sans perdre l'avis Jev.
Le digest possède trois pages au maximum par jour : le surplus reste en attente,
puis une expiration non envoyée est comptée. Un reçu perdu ne relance pas l'envoi.
La reprise exécute seulement le créneau présent, jamais tous les créneaux manqués.

La capacité de 10 000 concerne les tâches actives, pas l'historique terminé.
Après trente jours, cent éléments terminés au maximum sont archivés par passage.
Chaque archive gzip contient la source, la synthèse et les révisions ; SQLite
conserve l'identité, le motif, le reçu et les empreintes de dédoublonnage.
Les envois incertains ne sont jamais archivés automatiquement.
Ce stockage reste croissant : les archives et les identités ne sont pas purgées.
Le dédoublonnage de contenu est exact sur sujet/date/titre/extrait lu ; ce n'est
pas une détection sémantique universelle des articles qui racontent le même sujet.

Sauvegarde en ligne dans un dossier **neuf**, hors Git :

```sh
python3 scripts/backup-alert-state.py --source /chemin/prive/state --output /chemin/prive/sauvegarde-neuve
python3 scripts/backup-alert-state.py --verify /chemin/prive/sauvegarde-neuve
```

L'API SQLite inclut les écritures WAL validées et copie uniquement les archives
référencées par ce snapshot. Empreintes et intégrité sont vérifiées. L'ancien
dossier n'est jamais écrasé. Une sauvegarde incomplète n'a pas de statut VERIFIED.
Preuve réelle du 5 octobre : `~/.ivan-ai-os/mac-alerts-23cf0be/state-backup-20261005`.
Copie restaurée sous `/private/tmp/ivan-alert-state-restored-20261005` : 14 revues,
3 exclusions, aucune tâche réouverte ; la production n'a pas été modifiée.
Le test automatisé inclut aussi une archive et un crash pendant l'envoi :
la citation/le reçu sont restitués et l'envoi devient incertain sans être rejoué.

Pour restaurer, copier `alerts.sqlite` et `archive/` dans un nouveau dossier privé,
vérifier ses données puis préparer des settings qui désignent ce dossier.
Ne pas ouvrir la sauvegarde immuable avec le worker : travailler sur une copie.
Ne jamais remplacer directement la base active. Une migration de production
reste une activation distincte après contrôle du snapshot et arrêt du worker.
Le budget Jev, le Trousseau, les profils et Obsidian restent à leurs emplacements
actuels ; cette sauvegarde est celle de la **file**, pas de tout le Mac.

Mise à jour du worker : release immuable → préparation → `--update` avec les
anciens settings. Les backups du plist sont uniques ; une réexécution identique
est idempotente ; un échec de démarrage restaure l'ancien service. Une rollback
vers un lecteur antérieur à l'archivage ne sait pas restituer les blobs : conserver
une release qui comprend le schéma, ou restaurer une copie compatible.

La reprise après arrêt/redémarrage et la restauration sont testées. Un véritable
cycle sommeil/réveil du Mac et une période quotidienne de qualification restent
à mesurer ; ce guide ne promet pas une disponibilité pendant le sommeil.
