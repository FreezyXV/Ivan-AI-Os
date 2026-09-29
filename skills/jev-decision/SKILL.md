---
name: jev-decision
description: Utiliser Jev (TypeSafe System One, via le Jev Gateway d'Ivan-AI-Os) pour les décisions bon marché - routage vers un manager, tri oui/non, notation, choix parmi des options, pré-contrôle d'une action - et concevoir de nouvelles questions Jev. Utiliser dès qu'une tâche demande de classer, trier, noter, filtrer ou router en volume, avant d'appeler un modèle premium pour ça, ou quand Ivan dit "passe par Jev", "fais trier", "note ces éléments".
metadata:
  version: "0.1.0"
  famille: system
  manager: system
  risque: lecture
  profil: "non"
  statut: brouillon
  provenance: "services/jev-gateway (questions.js, provider.js) @0ee3363 ; budget fixé par Ivan le 2026-09-29"
---
# Jev : décisions rapides et bon marché

Statut brouillon : le contrat HTTP authentifié et le compteur de budget sont en cours chez Codex
(`services/jev-gateway`). Vérifier `docs/TRUSTED-EVALUATION.md` avant tout appel réel.

## Cascade (du moins cher au plus cher)
1. Code déterministe (regex, règle, liste) si la règle s'écrit en 10 lignes.
2. **Jev** : classer, trier, noter, choisir, router. Budget Ivan : **10 €/mois** ; l'utiliser partout
   où il remplace un appel de modèle premium.
3. Modèle local, puis premium : seulement pour produire du texte ou raisonner.
4. Humain : paiement, contact externe, publication, action irréversible. Jev ne l'évite jamais.

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
