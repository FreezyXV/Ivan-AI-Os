# File commune des alertes — sélection active, raccordement pilote

`services/alerts-runtime/` prépare une file SQLite locale partagée entre les
producteurs Sentinelle et Secrétaire. La sélection Jev est maintenant active
sur 4311 ; l'export Sentinelle et son consommateur Mac sont vérifiés en passage
unique. Une synthèse manuelle d'essai est reçue sur Secrétaire Ivan, avec reçu
natif 57 et contrôle visuel. La génération, le digest et les producteurs
planifiés ne sont pas encore raccordés. Le contrat éditorial définitif est
attendu de Claude ; aucune chaîne automatique complète n'est revendiquée.

Le client Jev est maintenant implémenté : voir « Sélection authentifiée ».

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
Une entrée RSS non lue peut acquérir une preuve de page lors d'une ingestion
ultérieure : seules les entrées pending ou review/SOURCE_NOT_READ sont remises
en pending. Un travail réservé, une source déjà évaluée et toute tentative
d'envoi restent intacts. La régression a été reproduite avant correction.
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
`createTelegramDelivery` appelle le CLI natif OpenClaw pour le seul chat privé
d'Ivan configuré par l'opérateur ; le CLI résout ses propres SecretRefs. Reçu
plugin ou core, action/canal, dry-run, statut, identifiant et destinataire sont
contrôlés. Un timeout ou échec partiel reste inconnu et n'est jamais relancé.
Le vrai plugin Telegram est vérifié ; le contrat core est testé sur fixture.
La réconciliation d'un envoi sans reçu reste à implémenter.
Cela évite un renvoi aveugle ; ce n'est pas une garantie distribuée d'exactement
une livraison ni un système de digest déjà actif.

Chaque étape a un délai de 30 secondes par défaut et reçoit un AbortSignal.
Un fournisseur qui ignore ce signal ne bloque plus la file ; sa requête peut
cependant continuer chez lui, donc l'adaptateur doit réellement l'annuler.
Un worker qui a perdu son bail ne commence pas une nouvelle synthèse et
ne remplace pas le résultat du propriétaire suivant. Les reçus de sélection
Jev restent attachés au résultat, même en cas de timeout de synthèse.

## Sélection authentifiée — active sur le Mac

`POST /v1/alerts/select` accepte exactement `scope: public`, `topic`, `title`
(200 caractères), `excerpt` (20–500 caractères) et `context_version`.
Le gateway fournit le contexte public fixe, la question et les critères ;
les objectifs, profils et instructions proposés par l'appelant sont refusés.
Question distincte `alerts.pertinence.mac-v1`, réponses keep/review/skip.
Les dix questions `/v1/classify` du client Claude ne sont pas modifiées.

Career, Knowledge en production de contenu et OVH sont écartés par code,
sans appel fournisseur. Pour les autres, Jev examine une utilité concrète pour
une priorité active ; ni des mots-clés ni une promesse promotionnelle ne suffisent.
Ce catalogue doit encore être évalué sur le corpus indépendant Claude.

Même bearer, budget durable et audit de métadonnées que les autres endpoints.
Authentification avant parsing ; aucune entrée brute dans l'audit. Audit en
échec ou réponse invalide : 503. Aucun pouvoir d'exécution accordé.

`createJevSelector` utilise le jeton runtime existant, appelle seulement le
gateway loopback, refuse les redirects et borne le délai réseau. Il transmet
un extrait public de 500 caractères au maximum ; une source non lue reste en
review localement, sans requête Jev. Appel réel et reçu d'audit vérifiés.

Release privée préparée `~/.ivan-ai-os/releases/alerts-59fbd7e` : gateway
59fbd7e + runner Mac cc1d2a5, deux provenances consignées dans le manifeste.
La copie figée démarre sur un port temporaire avec des credentials synthétiques :
health 200, entrée sans bearer 401, Career écarté, zéro appel fournisseur.
Candidate privée `~/.ivan-ai-os/background-alerts-59fbd7e/settings.json` validée,
préservant les chemins du jeton, du compteur et du Trousseau existants.
La bascule est réalisée : LaunchAgent épinglé, ancien plist sauvegardé,
jeton conservé et budget identique au démarrage. Preuves privées `activation.json`,
`live-probe.json` et `finance-probe.json` dans background-alerts-59fbd7e.
Le vrai client Finance atteint maintenant Jev pour ses deux valeurs formatées.

## Producteur réel, lecture et consommateur

Lire `SENTINELLE-INTEGRATION.md`. Sentinelle tourne sur GitHub Actions dans
un dépôt distinct, MODE=ombre. Sa PR #1 exporte les candidats publics sans
profil, appel Jev, message ou mutation de ses états. Passage réel : 40 candidats
récents, 139 anciens écartés, huit flux lus sans échec. Pas de nouveau planning.

`scripts/read-public-alert.py` supporte uniquement les permaliens datés du
blog Simon Willison : page effectivement téléchargée, publication vérifiée,
date précise au jour, empreinte de réponse et texte extrait sans navigation.
Limites : 400000 octets, délai global 15 s, refus d'un site non supporté,
redirect ou contenu/date incomplet. Il ne produit aucune synthèse.

`scripts/ingest-alert-candidates.mjs <export.json> <file.sqlite> [--select]`
importe les entrées et lit trois pages supportées au maximum par passage.
Il refuse qu'un export RSS affirme que l'article a déjà été lu. Sans --select,
aucune requête Jev ; avec, les exclusions locales précèdent la sélection.
Cette commande n'a ni générateur de texte ni expéditeur. Les erreurs de lecture
et les autres sites restent visibles sans résumé inventé. Ne pas l'installer
comme second collecteur tant que la bascule du planning n'est pas coordonnée.

## Preuves

`node --test services/alerts-runtime/test/*.test.js` : 29 tests passent.
Ils incluent deux connexions SQLite, un processus tué par SIGKILL, reprise de
bail, concurrence d'envoi, doublon entre producteurs, sources non lues,
faits avec chiffres inventés et panne d'envoi. Sources et reçus synthétiques,
aucun appel TypeSafe payant, aucune donnée personnelle et aucun message réel.
Gateway : 58 tests, dont cinq pour la sélection et un appel HTTP du vrai client.
Managers : pause et refus de réactivation vérifiés par régressions ciblées.

Correctif Finance associé : le test du vrai `judge` du moteur prouvait zéro
appel valide au lieu de deux. `alerte.importante` accepte désormais les valeurs
numériques ou publiques formatées du client, notamment « 12 % » et
« ±10 % sur 7 jours ». Les dix questions et leurs champs restent identiques ;
les limites de taille et le refus des identifiants sont conservés. Source
corrigée et vrai client vérifié contre le runtime désormais remplacé.
Lecteur Python : quatre tests, dont la régression de date des notes courtes ;
exporter Sentinelle distinct : cinq tests.

La suite est suivie dans `PROJECT-CHECKLISTS.md`, C04–C10 : raccordement des
producteurs, contrat Claude, sélection Jev, synthèse, digest, adaptateur Telegram
et test réel avec reçu.
