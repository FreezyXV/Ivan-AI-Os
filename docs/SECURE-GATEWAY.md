# Gateway privé : contrat proposé et budget approuvé

Source sur `agent/codex/secure-gateway`, à relire avant activation coordonnée.
Ivan a choisi les métadonnées autorisées et 10 EUR/mois, sans plafond de 500 appels.
Clients et finances personnelles restent exclus d'OpenClaw/Jev ; la veille financière publique
sur OpenClaw est désormais explicitement choisie par Ivan, avec contextualisation privée Claude.
Le profil professionnel réduit choisi
pour les skills Telegram ne change pas les données autorisées chez Jev.

## API et changement incompatible

`GET /health` est public. Tous les autres endpoints nécessitent le même bearer privé :
`POST /v1/route`, `POST /v1/evaluate-tool`, `POST /v1/decide`, `GET /v1/usage`.
Sans authentification configurée, ils sont désactivés ; l'authentification précède le parsing.

`/v1/route` accepte exclusivement :

```json
{"metadata":{"requested_tasks":["unit_test"],"urgency":"none","details_available":false}}
```

L'outil `ivan_route` reçoit directement les trois champs internes. Pas de `text`, titre libre,
nom de client, contenu de fichier ou champ supplémentaire. Les 19 tâches et trois urgences
sont dans `services/jev-gateway/src/routing-metadata.js` ; le JSON est capturé avant attente.
Le modèle peut choisir une catégorie erronée : le routage demeure consultatif et n'autorise rien.

`/v1/evaluate-tool` et son alias `/v1/decide` acceptent une action concrète :
`{"tool":"read","arguments":{"path":"README.md"}}`. Les anciens flags/politiques déclarés
par le caller sont refusés. Inspection locale, catalogue fixe, audit expurgé, ALLOW → REVIEW.
`/v1/classify` et les adaptateurs Claude/Codex ne sont pas encore implémentés.

## Compteur de consommation

Modèle épinglé `jev-1.13.0` : tarif officiel vérifié le 2026-09-29, 0,042 USD/million de tokens
d'entrée, sortie gratuite ([modèles](https://docs.typesafe.ai/models),
[API et usage](https://docs.typesafe.ai/api)). Les alias/modèles sans tarif connu sont refusés.
Le compteur commun aux trois endpoints utilise `usage.input_tokens`, pas le nombre d'appels.

Avant chaque requête, réserver le contexte maximal 65 536 tokens, soit 0,002753 EUR à conversion 1.
Après réponse métrée, conserver la charge réelle arrondie au micro-euro et restituer l'écart.
Erreur, interruption, usage absent ou invalide : conserver toute la réserve, sans retry automatique.
Au plafond, refuser avant le réseau. Verrou interprocessus, écriture atomique/fsync, mois UTC,
conservation après redémarrage, report d'un appel en vol dans son mois d'origine.

Ce montant est **une estimation locale**, pas un plafond bancaire : conversion de planification
`JEV_USD_TO_EUR_BUDGET_RATE=1` (modifiable de 1 à 2), prix épinglé, hors taxes et autres clients
utilisant la même clé. Le plafond TypeSafe annoncé par Ivan n'a pas été inspecté dans son compte.
`GET /v1/usage` indique explicitement `estimate:true`, modèle, budget, appels et usage inconnu.
Ne pas effacer le compteur pour débloquer des appels. Verrou abandonné : arrêter tous les writers,
vérifier le service, supprimer uniquement le verrou stale ; garder le journal de consommation.

## Provisionnement et bascule

Node 22+. `bash scripts/mac-jev-smoke.sh --stay` crée un dossier privé par défaut
`~/.local/share/ivan-ai-os` (0700), un `decision-token` (0600), audit et compteur privés.
La clé TypeSafe reste dans le processus via saisie masquée ou mécanisme runtime ; jamais argv/Git.
Le plugin et le service lisent le même fichier ; le chemin est configurable via
`IVAN_DECISION_TOKEN_FILE`. Un token environnement existant reste compatible.
Un port occupé est refusé : ne pas arrêter aveuglément l'ancien service.

1. Faire relire/merger les sources et revenir à un checkout stable avant de relancer le plugin lié.
2. Remplacer les credentials précédemment exposés avant d'étendre les outils/connectivité.
3. Provisionner le runtime privé, migrer service et schéma de l'outil ensemble.
4. Vérifier appel natif, budget et nouvelle DM Telegram sur tâche synthétique.
5. Piloter ensuite l'observer, toujours consultatif, avec latence et volume mesurés.

Ne pas redémarrer l'ancien bot alors que son plugin lié pointe vers un checkout en migration.
La preuve Telegram du 28 septembre porte sur l'ancien contrat ; elle n'est pas une preuve
de cette nouvelle API. Le pilote live, son runtime permanent et les approbations exactes restent ouverts.
Docker Compose reste un squelette non déployé : fournir un répertoire runtime privé préprovisionné,
montages limités au service et au catalogue en lecture seule, aucun env_file partagé.
Le workspace du conteneur ne contient que ces sources ; l'évaluation du dépôt entier est locale.

## Vérifications locales sans appels payants

54 tests source ; chargeur natif 2026.9.5 : ivan_route authentifié, état métadonnées uniquement,
un appel fournisseur synthétique, 300 tokens factices comptés. Observer sans jeton : zéro hook,
host non bloqué. Le launcher mock utilise un dossier/port temporaires et préserve l'ancien service.
