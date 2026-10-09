# Parcours opportunité, Obsidian et décision

## Source préparée — 9 octobre 2026

Le parcours de veille actuel est conservé : source publique lue, jugement natif,
contrôles déterministes, seconde lecture indépendante, file SQLite puis digest.
Jev ne trie pas ces alertes. Career reste en pause et aucun VPS n'est déployé.

Le dossier Business réutilise `business_fiche` et ses contrôles ; il n'introduit
pas un second score. Une proposition à une source reste exploratoire. Les
signaux faibles ne deviennent pas des marchés ou des revenus promis.

Le worker écrit le dossier avant de réserver l'envoi Business. Une erreur
Obsidian conserve cette proposition en `ready`, compte son code et laisse les
autres synthèses partir. Les faits vérifiés ne sont jamais tronqués pour ajouter
un identifiant : si la page est pleine, `/opportunite` donne la liste des dossiers.

## Usage prévu après activation

Dans le Telegram privé de la Secrétaire :

- `/opportunite` : les dix dossiers les plus récents et leur statut.
- `/opportunite <identifiant>` : synthèse et décision courante d'un dossier.
- `/decision <identifiant> tester <raison>` : préparer le plus petit test.
- `/decision <identifiant> veille <raison>` : attendre de nouvelles preuves.
- `/decision <identifiant> ecarter <raison>` : fermer la proposition.

Ces commandes sont natives, sans modèle. L'identité, l'autorisation de l'expéditeur,
le compte Telegram et la conversation privée sont contrôlés par le code à partir
du contexte fourni par OpenClaw. Aucun outil agent ne permet d'écrire une décision.
Un choix `tester` n'autorise ni paiement, contact, publication ni lancement.

## Mémoire et reprise

Le coffre configuré doit être un vrai coffre local existant. Les seules écritures
sont `Ivan AI OS/inbox/opportunite-<id>-v<revision>.md`. Chaque fiche contient le
problème, public, preuves datées et citations, hypothèse, inconnues, utilité,
objections, abandon, test, effort/coût, statut, prochaine action et choix motivé.
La charge en heures et le coût fournisseur natif sont indiqués inconnus quand
ils ne sont pas mesurés ; la fenêtre du test n'est pas une estimation de travail.

Chaque choix ajoute une nouvelle version reliée aux précédentes. Les fichiers
existants ne sont pas remplacés, même si Ivan les a modifiés ou validés. Les notes
personnelles ne sont jamais parcourues. Les décisions restent dans un SQLite
privé distinct de la file d'alertes ; Obsidian en est une projection récupérable.
Si une décision est enregistrée mais la projection échoue, la réponse le dit.
Répéter le choix et la même raison reprend cette version sans dupliquer la décision.
Un conflit de note exige une résolution ciblée ; le système n'écrase pas la note.

Une note reste une donnée, jamais une instruction ou une permission. Ce module
n'élargit pas les droits de lecture de `ivan-memory` ni les profils Finance privés.

## Preuves et mesures à distinguer

Tests hors ligne : boucle entière avec livraison synthétique explicitement
signalée, redémarrage, idempotence, notes modifiées conservées, écriture interrompue,
refus d'un autre expéditeur/bot/groupe et preuve changée après relecture.
Ce ne sont ni une opportunité réelle livrée ni une décision réelle d'Ivan.

Qualification live : consigner version installée, identifiant du dossier, chemin
de chaque note, reçu Telegram et décision réellement reçue. Ne jamais inventer
la décision d'Ivan pour fermer le test. Mesurer le nombre de dossiers acceptés,
en veille/écartés et les raisons ; demander une estimation du temps gagné. La
valeur quotidienne et le coût natif restent inconnus avant ces observations.
