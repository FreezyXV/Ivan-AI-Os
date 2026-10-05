# Jeu de pertinence v1 — qualification des alertes (K03/K06)

Quinze cas **nouveaux**, disjoints de tous les corpus et articles déjà utilisés (liste dans
`labels.json` → `sourcesDejaUtilisees`, vérifiée par test). Construit le 2026-10-05 par Claude.

- `fixtures.jsonl` — entrées seules : enveloppe `item` (même forme que le runtime, extrait de
  1200 caractères au plus, comme la sélection v3), `lecture` (capture, `textChars`, couverture,
  `sha256Texte`). Q15 est une demande d'Ivan (pas d'`item`).
- `labels.json` — décisions attendues **fixées et argumentées avant toute mesure** : sélection
  keep/review/skip, livraison silence/digest/immédiat, raison codée éventuelle, argument et
  désaccords plausibles. Empreinte des fixtures incluse. Ne jamais le transmettre au modèle.

Couverture : usages clairement actifs (Q01, Q13), finance plausible mais insuffisante (Q02,
Q03, Q04), bruit promotionnel et spéculatif (Q05–Q08), Career en pause (Q09), utile mais
ancien (Q10, Q11), source inaccessible (Q12), urgence justifiée par un inventaire réel (Q13)
et alarme non concernée (Q14), tâches mêlées (Q15). Réels : Q01–Q12 (Q12 = HTTP 403 observé) ;
synthétiques : Q13–Q15, l'inventaire de Q13 (Node v23.9.0 en fin de vie sur le Mac) étant réel.

Protocole (une seule passe payante, par Codex, après correction du classifieur) :
1. Transmettre `item` seul pour Q01–Q14 ; appliquer d'abord les exclusions codées.
2. Une sélection Jev par cas restant, contexte `mac-alerts-20261005-v3` ; enregistrer
   décision, confiance, `request_id`, `provider`.
3. Comparer à `labels.json` avec `evaluer.mjs` (PR #55) ; les seuils se valident sur ce jeu, ils
   ne se baissent pas pour obtenir un KEEP. Relancer seulement si fixtures, contexte ou question
   changent (empreinte différente). Aucune calibration parallèle côté Claude.
