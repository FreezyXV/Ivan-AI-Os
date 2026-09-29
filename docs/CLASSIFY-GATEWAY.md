# Jev questions enregistrées — `/v1/classify`

Le gateway possède un catalogue fixe de dix questions. Le client existant
`skills/jev-decision/scripts/classify.mjs` envoie `{ "question": "…", "input": { … } }`
sur `POST /v1/classify` avec le même jeton bearer que `/v1/route`. Le gateway
répond `{ question, decision, confidence, request_id, provider: "jev" }`.
Une question inconnue renvoie 404, un corps invalide 400, une panne ou un
budget indisponible 503. L'authentification précède l'analyse du corps.

Le serveur, et non le client, choisit les instructions et les critères Jev.
Les entrées autorisées sont des métadonnées publiques courtes, limitées aux
champs déclarés pour chaque question. Les domaines Anakalypto correspondent
exactement au catalogue de dix-neuf domaines. Une décision `noul` est un
nombre entre 0 et 1 ; une décision `choice` appartient aux choix enregistrés.
La réponse Jev n'autorise aucune publication, transaction ni action outil
à elle seule : les vérifications codées et les frontières d'approbation
restent applicables.

Tous les appels TypeSafe passent par `askTypeSafe` et le compteur mensuel
durable déjà partagé avec `/v1/route` et `/v1/evaluate-tool`. Le même journal
privé borné conserve seulement l'identifiant de la question, la décision,
la confiance, le statut, la latence et `request_id` ; il ne conserve ni les
valeurs d'entrée ni le texte des sources. Les erreurs d'audit empêchent une
réponse positive. Le mode mock refuse la classification.

La passation Claude du 29 septembre parle de **onze** questions mais en
énumère dix ; le client `QUESTIONS` et le catalogue serveur comptent tous
deux dix identifiants. Une onzième question demanderait un contrat explicite
avant ajout, plutôt qu'un identifiant inventé.

Vérification source : `cd services/jev-gateway && npm test` (52/52 le
29 septembre, serveur loopback local et fournisseur synthétique). Ce commit
ne modifie pas le service Mac sur 4311 : déployer une copie versionnée du
gateway, puis vérifier le chemin client → endpoint → Jev sur un cas public
avant de publier la fiche Anakalypto en attente.
