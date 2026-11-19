# Sentinelle — producteur retrouvé et raccordement préparé

État vérifié le 5 octobre 2026. Le bot est `@sentinelleenginebot`, confirmé
dans son profil Telegram. Son moteur est le dépôt privé
[FreezyXV/sentinelle](https://github.com/FreezyXV/sentinelle), main
`09bfb4d39241a69f2ad110a385e35f927adfe484` lors de l'inspection.
Il tourne sur GitHub Actions, indépendamment du Mac et d'OpenClaw.

## Causes des messages actuels

- `.github/workflows/sentinelle.yml` : passages à 05, 09, 13 et 17 h UTC,
  plus digest le dimanche à 17 h UTC. La variable distante `MODE=ombre`
  est confirmée ; ce mode envoie délibérément les listes de calibrage.
- `lire_flux` retourne titre, lien et résumé RSS seulement. Une reproduction
  avec une publication du 23 septembre renvoie ces trois champs, sans date.
  Le champ candidat `date` devient ensuite le jour de collecte. Le lecteur
  de l'article lui-même n'est jamais appelé.
- Le digest reprend les candidats conservés et peut remettre en avant des
  publications anciennes. Les scores de mots-clés ne mesurent pas une
  utilité concrète pour les priorités actuelles.
- `jev_client.py` appelle directement TypeSafe ou une autre passerelle selon
  l'environnement. Son compteur, son budget et son contexte sont indépendants
  du gateway authentifié du Mac. Ne pas copier ce contexte dans Ivan AI OS.
- Les liens sont marqués vus avant la livraison ; aucun reçu durable n'est
  conservé par ce moteur. Une panne d'envoi n'a donc pas la même sémantique
  que la file commune construite dans `services/alerts-runtime/`.

Trois dernières exécutions examinées : succès, événement schedule, le
4 octobre. Cette preuve confirme le producteur réel ; aucun log avec secrets
n'a été consulté. L'ancien workflow et son mode n'ont pas été modifiés.

## Livraison candidate dans le dépôt Sentinelle

[PR Sentinelle #1](https://github.com/FreezyXV/sentinelle/pull/1), branche
`codex/collector-export` : export de candidats publics, publication RSS/Atom
vérifiée, refus des dates inconnues/futures, filtre de fraîcheur et doublons,
échecs visibles. Aucun profil, appel Jev, message Telegram ou état « vu ».
Le workflow d'export est manuel et produit un artifact temporaire ; pas de
permission d'écriture ni de secret fournisseur ou canal. Cinq tests passent.
Un extrait RSS reste `sourceStatus: title-only` jusqu'à lecture de la page.
Un passage réel de l'export a conservé 40 candidats récents et écarté 139
publications anciennes ; huit flux accessibles, zéro appel Jev ou Telegram.
Le consommateur Mac a ingéré les 40 : une première page lue et sélectionnée
par Jev en review, sans génération ou livraison automatique. Deux refus de date
ont révélé la classe HTML mobile-date-eyebrow utilisée par les notes courtes :
régression reproduite puis corrigée, quatre tests lecteur passent. Un passage
sans sélection met à jour ces deux doublons avec leur preuve de lecture ;
trois pages lues au total, 37 sources non supportées laissées non lues.
Aucun appel Jev ni message supplémentaire. Ces essais ne créent pas de second
planning. Les motifs de lecture sont rapportés par code.

## Bascule à réaliser

Le consommateur Mac doit récupérer cet export, lire les sources supportées,
réserver un élément dans la file commune, appeler Jev sur le budget partagé,
produire la synthèse selon K01/K02, puis livrer avec reçu vérifié.
Dédupliquer avec les candidats de la Secrétaire dans la même file.
Un accès incomplet ou une décision incertaine ne produit pas une alerte.

Tester ce parcours avant d'arrêter l'ancien planning. Puis conserver un seul
collecteur planifié et un seul responsable d'envoi. Ne pas exposer le gateway
loopback du Mac à GitHub Actions. Les sources candidates doivent être relues ;
main Sentinelle attend le GO de fusion/cutover d'Ivan. OVH reste reporté.

Le premier lecteur Mac supporte seulement les permaliens datés du blog de
Simon Willison. Il vérifie la date dans la page, borne téléchargement et délai,
exclut navigation/script/pied de page et produit une empreinte de réponse.
Les autres sources attendent leur adaptateur ; aucune lecture complète n'est
déduite d'un titre ou d'un extrait RSS.

## Interface Telegram utilisable

Les clics dans Telegram renvoyaient `AXError.notImplemented` ou
`noWindowsAvailable`. La navigation au clavier fonctionne : Cmd+K, rechercher
le bot, Entrée ; Cmd+flèche droite ouvre son profil. Utiliser ce chemin vérifié
au lieu de répéter les clics défaillants ou de redemander le déverrouillage.
Après chaque navigation, relire l'état de la fenêtre.
