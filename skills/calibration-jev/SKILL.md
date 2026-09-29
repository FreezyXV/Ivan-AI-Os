---
name: calibration-jev
description: Mesurer la qualité des décisions Jev (routage vers les managers, détails manquants, urgence, avis sur action) sur des cas synthétiques étiquetés, avant de régler un seuil, d'ajouter une question ou de faire confiance à Jev pour un nouvel usage. Utiliser après la bascule du gateway, une fois par mois, quand un routage semble faux, avant tout changement de seuil ou de question, ou quand Ivan demande "Jev est-il fiable ?", "calibre Jev".
metadata:
  version: "0.1.0"
  famille: system
  manager: system
  risque: lecture
  profil: "non"
  statut: brouillon
  provenance: "Codex PR #7 (docs/JEV-CALIBRATION.md, services/jev-gateway/src/calibration.js), 2026-09-29"
---
# Calibration Jev

Statut brouillon : dépend de la PR #7 (corpus et script) et du gateway authentifié activé.

## Les 4 questions calibrables (fixes, versionnées dans le code)
| Question | Où | Mesure |
|---|---|---|
| `route.manager.v1` | `/v1/route` | manager correct parmi 6 (seuil d'action 0,7) |
| `route.details.v1` | `/v1/route` | `needs_details ≥ 0,5` ⇔ détails absents |
| `route.urgency.v1` | `/v1/route` | score 0/1/2 conforme à l'urgence déclarée (± 0,25) |
| `action.permission.v1` | `/v1/evaluate-tool` | avis sur fichiers ordinaires ; ALLOW devient REVIEW |

Aucune autre question n'existe (`/v1/classify`, `offre.compatible`, `tache.outil` : non livrés).

## Procédure
1. **Hors réseau** (gratuit) : `node scripts/calibrate-jev-routing.mjs` → `corpus_valid: true`.
2. **Réel** (après bascule, ≈ 19 appels, quelques centimes) :
   `node scripts/calibrate-jev-routing.mjs --live`. Jeton lu par le runtime, jamais en argument.
3. **Lire le résumé** : `coverage` (doit valoir 1), `manager_accuracy`, `review_rate`,
   `detail_matches`, `urgency_matches`, `mismatches`, `estimated_gateway_charge_delta_eur`.
4. **Décider** :
   - couverture < 1 → panne ou budget : réparer avant toute conclusion ;
   - précision manager ≥ 0,9 et REVIEW ≤ 20 % → garder les seuils ;
   - chaque `mismatch` → relire d'abord l'étiquette et les critères de `routingQuestions`, puis
     seulement la question. Jamais baisser un seuil pour obtenir plus d'ALLOW.
5. **Tracer** : note `decision` (interne) via `memoire-obsidian` avec date, commit, métriques et
   coût ; résumé à Ivan via `rapport-telegram` si une action est nécessaire.

## Ajouter des cas
- Synthétiques et publics : aucune donnée d'Ivan, aucun client, aucun texte libre.
- Étiquette écrite **avant** de voir la prédiction, relue par l'autre agent (`revue-croisee`).
- Séparer réglage et validation : un jeu sert à régler, un second (holdout) à mesurer.
- Couvrir les cas multi-tâches (`requested_tasks` jusqu'à 8) et les urgences rares.

## Limites
Ces cas mesurent la classification de métadonnées, pas l'extraction d'une vraie demande Telegram
ni la réussite d'un worker. Une bonne calibration n'accorde aucune permission.
