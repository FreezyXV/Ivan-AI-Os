# Exploitation et reprise de la file d'alertes sur Mac

Le planning `com.ivan-ai-os.alerts` lance un passage toutes les cinq minutes.
Il est normalement inactif entre deux passages. Jev écoute sur 4311 ;
OpenClaw sur 18789. Le workflow Sentinelle distant reste désactivé.
Les réglages et les reçus sont privés, les releases sont épinglées.

Diagnostic depuis le dépôt :
`/Users/yoanpetrov/.openclaw/tools/node-v24.19.0/bin/node scripts/inspect-mac-pilot.mjs`.
Lire la santé **et** `alerts.diagnosis`, les raisons de revue, les dernières
collectes et la dernière livraison. Un service sain sans nouvelle alerte retenue
n'est pas une panne. Ne pas réactiver le planning Sentinelle en parallèle.

Mode courant `native-editorial` : une complétion isolée décide l’utilité et rédige
si utile, sans dépendance Jev. Deux complétions maximum par passage, même si elles
écartent les articles. Une page illisible reste non lue ; un jugement incertain reste en revue.
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
Un tombstone terminal suffit au collecteur même si son archive manque : le flux
n'est pas arrêté et aucun envoi n'est rouvert. Le dédoublonnage inclut une empreinte
normalisée de preuves longues, avec séparation des routes différées ; ce n'est
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
fixer explicitement les permissions des dossiers à 0700 et des fichiers à 0600
(une copie récursive dépend de la plateforme), vérifier les données puis préparer
des settings qui désignent ce dossier.
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

Une migration opérateur de contexte peut remettre huit reviews récentes au plus
en attente, avec ancienne preuve/avis archivés. Elle exige un nouvel examen ;
un reçu Jev ancien n’est pas réutilisé comme décision du contexte actuel. Ni
les envois tentés ni les sources périmées ne sont ainsi réouverts. Les pannes
transitoires natives autorisent un seul nouvel essai après quinze minutes.

Mode conservateur préparé `jev-native-editorial` : sélection à 0,75 puis jugement
et rédaction natifs uniquement pour keep. Le reçu Jev est conservé pour une
reprise native sans nouvelle sélection payante. Une sortie non étayée/mal formée
reste en revue comme erreur de contenu, sans être réessayée comme panne réseau.
Les tests de ces deux défauts échouaient avant correction, puis passent.
