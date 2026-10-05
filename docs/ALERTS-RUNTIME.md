# File commune des alertes — candidat source

`services/alerts-runtime/` prépare une file SQLite locale partagée entre les
producteurs Sentinelle et Secrétaire. Aucun producteur réel n'est raccordé,
aucun nouvel endpoint Jev n'est activé et aucun message Telegram n'a été envoyé
par ce module. Le contrat éditorial définitif est attendu de Claude ; les
fonctions de sélection, synthèse et livraison sont injectées explicitement.

## Contrat technique provisoire

Entrée : `producer`, URL HTTPS publique, `title`, `topic`, `scope: "public"`,
`publishedAt`, `observedAt`, `sourceStatus`, `excerpt`, et `readAt` si lu.
Dates UTC ISO ; extrait borné à 1200 caractères. Le producteur doit récupérer
la source et fournir l'extrait réellement lu. Un champ `sourceStatus: "read"`
seul n'est pas une preuve de collecte. La file ne télécharge pas les sources.

Contexte public fixe `mac-pilot-20261005-v1` : Business, Finance publique,
Engineering et System. Career, Knowledge/Anakalypto et OVH sont reportés
dans cette sélection d'alertes ; la lecture mémoire System reste disponible.
Aucun profil complet ni portefeuille ne fait partie du contexte.

La sélection injectée renvoie `{decision: "keep" | "skip" | "review", confidence}`.
Jev sera l'adaptateur de décision ; le code n'invente pas une question dans
le catalogue actuel. Un LLM distinct synthétisera seulement après sélection.
Pour le prototype, 72 heures de fraîcheur et 0,75 de confiance sont des
paramètres de départ, **pas des seuils calibrés**. Sources futures ou non lues,
décisions douteuses et pannes restent en `review`, sans envoi automatique.

La synthèse contient `goal`, 1–4 `facts: [{summary, quote}]`, `utility`, `action`
et éventuellement `uncertainty`. Chaque citation doit apparaître exactement
dans l'extrait et chaque nombre du fait dans sa citation. Ces contrôles
détectent des inventions grossières ; ils ne prouvent pas l'implication logique
du résumé, l'exactitude de la source ou la pertinence personnelle. L'évaluation
éditoriale Claude et le jeu indépendant restent nécessaires.
Le message porte une date, les faits, l'utilité, l'action, la limite éventuelle
et la source finale ; plafond technique 2500 caractères.

## File, concurrence et livraison

Utiliser `openLedger` sur un chemin absolu dans un dossier privé hors Git.
Le fichier SQLite appartient à l'utilisateur et est privé. Aucun autre service
ni dépendance n'est requis ; Node ≥ 22.13 avec `node:sqlite`.

L'identifiant est le SHA-256 de l'URL canonique. Les paramètres de suivi et le
fragment sont supprimés ; les paramètres de contenu sont conservés. Deux bots
proposant la même URL obtiennent un seul élément. Les URLs alternatives d'un
même article et les mises à jour d'un article ne sont pas encore rapprochées.
Le fichier est borné à 10000 éléments ; politique de rétention à construire
avant usage durable, sans purger les états d'envoi incertain.

SQLite assure les transactions et libère les verrous après un crash. Un travail
réservé peut être repris après expiration du bail ; son ancien worker ne peut
plus remplacer le résultat. Les appels aux fournisseurs restent hors transaction.
Les adaptateurs futurs devront avoir des délais plus courts que le bail.

États : `pending` → `processing` → `skipped`, `review` ou `ready` ; puis
`ready` → `sending` → `delivered` ou `delivery_unknown`.
Le callback d'envoi doit retourner un véritable reçu natif ; un identifiant
fourni arbitrairement par un appelant ne constitue pas une preuve Telegram.
Deux demandes d'envoi simultanées ne lancent qu'un callback. Timeout ou crash
après début d'envoi : `delivery_unknown`, jamais remis automatiquement en file.
La réconciliation réelle du reçu reste à implémenter dans l'adaptateur.
Cela évite un renvoi aveugle ; ce n'est pas une garantie distribuée d'exactement
une livraison ni un système de digest déjà actif.

## Preuves

`node --test services/alerts-runtime/test/*.test.js` : 15 tests passent.
Ils incluent deux connexions SQLite, un processus tué par SIGKILL, reprise de
bail, concurrence d'envoi, doublon entre producteurs, sources non lues,
faits avec chiffres inventés et panne d'envoi. Sources et reçus synthétiques,
aucun appel TypeSafe payant, aucune donnée personnelle et aucun message réel.

Correctif Finance associé : le test du vrai `judge` du moteur prouvait zéro
appel valide au lieu de deux. `alerte.importante` accepte désormais les valeurs
numériques ou publiques formatées du client, notamment « 12 % » et
« ±10 % sur 7 jours ». Les dix questions et leurs champs restent identiques ;
les limites de taille et le refus des identifiants sont conservés. Source
corrigée ; runtime Jev actif non encore remplacé par ce lot.

La suite est suivie dans `PROJECT-CHECKLISTS.md`, C04–C10 : raccordement des
producteurs, contrat Claude, sélection Jev, synthèse, digest, adaptateur Telegram
et test réel avec reçu.
