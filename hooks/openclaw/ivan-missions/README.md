# Suivi durable des missions

Le suivi montre où en est une mission : routée, manager en cours, worker en cours/revenu,
manager revenu, livraison en file, livrée ou échouée. L'outil `ivan_mission_status` donne
les dix dernières missions et leur durée. Les missions dépassant cinq minutes sont signalées,
sans interrompre leur travail. Il n'évalue pas la qualité du contenu livré.

Deux hooks locaux seulement : after_tool_call pour ivan_route/sessions_spawn/message,
et subagent_ended pour les retours. Aucune attente HTTP, aucun appel Jev/LLM ajouté.
Les identifiants natifs de runs et de sessions enfants relient les événements ; la reprise
privée doit contenir le run ou l'enfant du manager. Un envoi sans corrélation est ignoré.
Un ok:true accompagné de delivery_queued ou delivered:false reste en attente. Le plugin
n'envoie rien et ne tente aucun retry : le transport OpenClaw conserve cette responsabilité.

État privé borné à 200 missions, remplacé atomiquement. Les missions actives ne sont pas
évincées pour une nouvelle arrivée. Aucun texte de demande, note, message, destinataire,
clé ou résultat complet n'est stocké. Les lectures de statut restent dans main/System.
Une perte de hooks ou un autre format de reprise peut laisser une mission incomplète :
le compteur ne devine pas une complétion. Les missions antérieures ne sont pas reconstituées.

Cinq tests couvrent livraisons en file, retours distincts, missions concurrentes, redémarrage,
absence de contenu dans l'état et dépassement de durée. La vérification native isolée est
`scripts/verify-mission-plugin.mjs /chemin/installation/openclaw` ; aucune configuration live.

Plugin désactivé par défaut. Après revue, épingler la source hors checkout, préparer un dossier
privé pour statePath, enregistrer le plugin enabled et ajouter ivan_mission_status aux outils
optionnels de main/System. Aucun élargissement des outils fichiers ou des permissions shell.
L'installation isolée ne vaut ni activation ni preuve d'une capture réelle.
