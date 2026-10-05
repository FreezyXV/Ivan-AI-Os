---
name: jev-decision
description: Utiliser Jev (TypeSafe System One, via le Jev Gateway d'Ivan-AI-Os) pour les décisions bon marché - routage vers un manager, tri oui/non, notation, choix parmi des options, pré-contrôle d'une action - et concevoir de nouvelles questions Jev. Utiliser dès qu'une tâche demande de classer, trier, noter, filtrer ou router en volume, avant d'appeler un modèle premium pour ça, ou quand Ivan dit "passe par Jev", "fais trier", "note ces éléments".
compatibility: "claude-code, codex"
metadata:
  version: "0.5.1"
  famille: system
  manager: system
  risque: lecture
  profil: "non"
  statut: brouillon
  provenance: "services/jev-gateway, docs/CLASSIFY-GATEWAY.md, docs/ALERTS-RUNTIME.md (Codex) ; budget fixé par Ivan le 2026-09-29 ; état revu le 2026-10-05"
---
# Jev : décisions rapides et bon marché

Gateway authentifié actif sur le Mac (`http://127.0.0.1:4311`, LaunchAgent Codex). L'ancien
service de test 4310 n'a ni budget ni authentification : ne jamais l'utiliser. En cas de doute sur
l'état réel, lire `docs/CLASSIFY-GATEWAY.md` et le dernier relais Codex avant un appel.

## Points d'entrée (bearer privé, lu par le runtime ; jamais dans une config ni dans Git)
| Endpoint | Entrée | Usage |
|---|---|---|
| `POST /v1/route` | `{"metadata":{"requested_tasks":[…],"urgency":"none","details_available":bool}}` | Choisir le manager |
| `POST /v1/evaluate-tool` | `{"tool":"write","arguments":{"path":"…"}}` | Avis shadow sur une action concrète |
| `POST /v1/classify` | `{"question":"…","input":{…}}` | Une des 10 questions enregistrées (ci-dessous) |
| `POST /v1/alerts/select` | `{scope,topic,title,excerpt,context_version}` | Pertinence d'une alerte (`alerts.pertinence.mac-v3`), réservé au runtime des alertes |
| `GET /v1/usage` | — | Budget estimé du mois (`estimate:true`) |

`requested_tasks` : 1 à 8 labels parmi les 19 de `services/jev-gateway/src/routing-metadata.js`
(`unit_test`, `bug_fix`, `job_search`, `market_research`, `topic_research`, `configure_skill`,
`other`…) ; `urgency` : `none`, `soon` ou `immediate`. Aucun texte libre.

`/v1/classify` : catalogue fixe côté serveur, client `scripts/classify.mjs` (`QUESTIONS`) :
`sujet.captivant`, `sujet.domaine`, `source.fiable`, `publication.prete`, `signal.pertinent`,
`preuve.suffisante`, `alerte.importante`, `memoire.contradiction`, `tache.categorie`,
`constat.severite`. Le serveur fixe instructions et critères ; une question inconnue → 404.
Ne pas inventer de question ni d'endpoint : une nouvelle question demande un contrat avec Codex.
`/v1/alerts/select` refuse objectifs, profils et consignes fournis par l'appelant ; Career,
Knowledge et OVH y sont écartés par code sans appel fournisseur.
Le compteur mesure les tokens d'entrée (`jev-1.13.0`) et refuse avant le réseau au plafond de 10 €.

## Usage réel des alertes (2026-10-06, runtime Codex `bf2d2e1`)
- Question `alerts.pertinence.mac-v3`, contexte public **`mac-alerts-20261006-v6`** (v5 = historique), politique
  `keep ≥ 0,75 / skip ≥ 0,75` sur la confiance ; deux seuils contradictoires → review
  (`selectionOutcome`). Mode actif **E** : Jev keep, puis jugement et rédaction natifs, digest
  seulement. Jev ne rédige rien et n'autorise aucune action.
- Mesuré **en v5** (labels figés, historique, ne qualifie pas v6) : 6/14 utiles sur dev et 4/5 sur le benchmark, **0 bruit** ; rappel
  limité (rate les incidents de sécurité d'agents génériques). Politique P(keep) ≥ 0,10 /
  P(skip) ≥ 0,20 en réserve (1 faux keep sur le benchmark).
- **Non qualifiés** (jamais mesurés sur jeu figé) : routage (la table active fait mieux),
  `signal.pertinent`, `preuve.suffisante`, `alerte.importante`, `source.fiable`, `sujet.*`,
  `publication.prete`. Ne pas en dépendre pour décider seul ; mesurer d'abord.
- Une adresse de contact dans un extrait fait refuser l'entrée par le gateway (A10) : c'est voulu.
  Ne pas contourner ; la correction proposée remplace l'adresse côté client avant l'appel.

## Cascade (du moins cher au plus cher)
1. Code déterministe (regex, règle, liste) si la règle s'écrit en 10 lignes.
2. **Jev** : classer, trier, noter, choisir quand l'entrée est **ambiguë** (texte autorisé, contenu à
   juger). Budget Ivan : **10 €/mois** ; l'utiliser partout où il remplace un appel premium.
3. Modèle local, puis premium : seulement pour produire du texte ou raisonner.
4. Humain : paiement, contact externe, publication, action irréversible. Jev ne l'évite jamais.

## Leçon de la calibration réelle (2026-09-29)
Si l'entrée est déjà une **étiquette énumérée** (liste fermée, ordre de priorité déclaré), la
décision est une table : 19/19 pour la table contre 17/19 et 53 % de REVIEW pour Jev sur les cas
multi-tâches. Avant d'ajouter une question Jev, se demander : « une table ou une règle de 10 lignes
donnerait-elle la même réponse ? ». Si oui, pas de Jev. Voir la PR #17 (`JEV_ROUTING_MODE=table`).

## Ce que Jev reçoit
- Des **métadonnées** construites par le code : intention, outil, risque, catégorie, champs
  énumérés. Jamais de texte libre privé, d'identifiants, de contenu de fichier ni de donnée client.
- Au doute sur un champ : ne pas l'envoyer.

## Les trois types de question (contrat actuel du gateway)
| Type | Réponse | Usage |
|---|---|---|
| `choice` | une option + probabilités + confiance | router, choisir, ALLOW/REVIEW/DENY |
| `noul` | probabilité 0–1 | oui/non : pertinent ? manque-t-il une info ? |
| `score` | valeur sur une échelle ordonnée | urgence, qualité, priorité |

Exemples réels : `routingQuestions` (manager, needs_details, urgency) et `permissionQuestion`
dans `services/jev-gateway/src/questions.js`.

## Écrire une bonne question Jev
- `instructions` : une phrase, la décision exacte, "à partir des seules preuves fournies".
- `criteria` : options mutuellement exclusives, chacune décrite par un critère observable.
- Prévoir une option de repli (`REVIEW`, `system`, "incertain") plutôt que forcer un choix.
- Fixer le seuil d'action **avant** (ex. confiance ≥ 0,8), sinon le résultat va en revue.
- Tester sur 10 cas étiquetés avant usage réel ; garder les cas comme tests de calibration.

## Lire la réponse
- Valider type, bornes et somme des probabilités ; sinon traiter comme indisponible.
- ALLOW de Jev = avis, jamais une autorisation. Le noyau déterministe reste prioritaire.
- Indisponible, hors délai ou budget dépassé → repli déterministe ou REVIEW, jamais ALLOW.
