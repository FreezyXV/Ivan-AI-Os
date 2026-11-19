# Parcours opportunité, Obsidian et décision

## Source et activation — 9 octobre 2026

Code `b846907` activé sur le Mac : plugin natif chargé avec `opportunite` et
`decision`, worker du même commit, services sains après bascule sauvegardée.
187/187 tests runtime/scripts passent, dont huit cas du parcours opportunité.
Les commandes n'ont pas encore été exercées par une vraie entrée Telegram :
le contrôle graphique renvoie `noWindowsAvailable` malgré la fenêtre visible.
Le chargement natif et les contrôles d'identité sont vérifiés séparément.

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

## Usage des commandes activées

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
Dans le périmètre local Codex, une réponse explicite d'Ivan peut aussi être
transcrite avec l'origine `codex-explicit-user`. Cette origine n'est pas accessible
aux arguments du plugin Telegram ; elle ne prouve pas une entrée Telegram réelle.

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

## Premier parcours réel observé

Le dossier `6ab5272ce301` concerne une hypothèse exploratoire de qualification
des mises à jour OpenClaw. Codex l'a recherché et préparé à partir d'un ticket
public frais ; ce n'est pas une découverte automatique du catalogue Business.
Une seconde lecture native a approuvé le contenu lié à sa source en 15,561 s,
avec une complétion. La projection v0 a précédé l'envoi confirmé du message 66
depuis une file de qualification séparée ; la file de production est intacte.

Ivan a répondu dans Codex : « Tester — chercher des témoignages indépendants
avant de construire une offre ». La décision est persistée avec l'origine
`codex-explicit-user`, et la fiche v1 conserve son choix, sa raison et le lien
vers v0. La relecture et la reprojection depuis le registre ont réussi après
activation. Latence observée livraison–décision : 209264 ms, pas un temps gagné.

Une recherche publique supplémentaire, sans modèle ni contact, a trouvé trois
comptes auteurs distincts rapportant des difficultés. L'incident initial est
désormais fermé et l'éditeur propose déjà une reprise après mise à jour :
friction technique plausible, demande commerciale et volonté de payer inconnues.
Le compte rendu est dans `Ivan AI OS/journal/2026-10-09-test-public-du-dossier-6ab5272ce301.md`.
Les fiches sont `Ivan AI OS/inbox/opportunite-6ab5272ce301-v0.md` et `-v1.md`.
Le choix reste tester ; une recommandation ultérieure n'est pas une décision Ivan.

Preuves privées : `~/.ivan-ai-os/mac-opportunity-ffd71b3/research-qualification/`
(source, brief, relecture, reçu, décision) et `mac-opportunity-b846907/`
(candidat, empreinte, sauvegarde, contrôle final). Ne pas les committer.
Le coût fournisseur natif n'est pas exposé ; aucun coût nul n'est revendiqué.
Le catalogue Business automatique reste à zéro. L'échantillon d'un dossier ne
mesure pas la fiabilité générale, la pertinence quotidienne ou le temps gagné.
