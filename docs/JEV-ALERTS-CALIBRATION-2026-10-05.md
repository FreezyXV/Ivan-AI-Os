# Calibration de Jev pour la sélection des alertes (Claude, 2026-10-05)

Question mesurée : `alerts.pertinence.mac-v1`, contexte `mac-alerts-20261005-v3`, gateway Mac
actif sur 4311. Code de sélection relu au SHA `23cf0be`. **Une seule passe payante** : 94 cas
× 2 répétitions = 188 appels, environ 0,004 € (budget du mois : 0,005 € consommés sur 10 € avant
la passe). Sortie écrite une seule fois (`wx`) : une commande répétée ne peut pas payer deux fois.

## Jeu de données (`skills/rapport-telegram/corpus/calibration-jev-v1/`)

- `inputs.jsonl` (empreinte `0b0b71b4…`) : enveloppes `item` produites par le **lecteur de
  production de Codex** (`read-public-alert.py`, extraits par passages, ≤ 1200 caractères) sur
  les flux réels du pilote (Simon Willison, BCE, HN, Ask HN), plus les cas lus des corpus #50.
- `labels.json` : **labels fixés avant la mesure**, avec la grille et la raison des cas
  non-skip. Jeu `dev` (83 : 14 keep, 11 review, 58 skip) pour choisir les seuils ;
  `holdout` = jeu neuf #58 (11 cas), jamais utilisé pour régler.
- `jev-run-1-mac-alerts-v3.jsonl` : réponses brutes (décision, confiance, `request_id`, durée).
  Aucun secret.

## Mesures

- **Stabilité** : décision identique entre les deux répétitions pour 94/94 cas ; écart de
  confiance moyen 0,025 (maximum 0,11). Jev est déterministe en pratique : une répétition suffit
  pour les prochaines passes.
- **`skip` est fiable** : 22/22 corrects sur dev, 2/2 sur holdout. Jamais un cas keep ou review
  n'a reçu `skip`.
- **`keep` est rare mais juste** : 2/2 sur dev, 1/1 sur holdout. Aucun bruit n'a reçu `keep`.
- **`review` absorbe presque tout** : 12 des 14 keep et 36 des 58 skip de dev. La confiance ne
  discrimine pas : médiane de `review` à 0,64 pour les vrais keep, 0,63 pour les vrais review,
  0,57 pour les vrais skip.
- **La règle actuelle (0,75) ne retient rien** : 0 keep sur dev comme sur holdout ; 88 % des cas
  restent en revue (d'où la saturation de file vue en K07).

| Politique | Jeu | Exact | En revue | Keep retrouvés | Faux keep | Keep écartés |
|---|---|---|---|---|---|---|
| Actuelle (keep ≥ 0,75 ; skip ≥ 0,75) | dev | 25 % | 88 % | 0/14 | 0 | 0 |
| Actuelle | holdout | 18 % | 100 % | 0/2 | 0 | 0 |
| **Calibrée (keep ≥ 0,20 ; skip ≥ 0,25)** | dev | **42 %** | 71 % | 2/14 | **0** | **0** |
| **Calibrée** | holdout | **45 %** | 73 % | 1/2 | **0** | **0** |

Méthode (`scripts/calibrate-alert-selection.mjs`, PR #59) : n'admettre que les politiques
sans faux keep ni keep écarté sur dev ; maximiser les keep retrouvés, puis minimiser la revue ;
entre politiques équivalentes, prendre le milieu de l'intervalle sûr (marge maximale). Résultat
rapporté ensuite sur holdout. Petits effectifs : ce sont des seuils de pilote, pas une garantie.

## Diagnostic

Le problème n'est pas le seuil, c'est la forme de la question. `review` est défini comme « il
peut y avoir un lien » : presque tout article technique y entre. La confiance renvoyée est celle
de l'option choisie, donc elle ne dit rien de la probabilité d'un keep. TypeSafe renvoie pourtant
les **probabilités de chaque option**, que le gateway jetait.

## Ce qui est livré (PR #59, source uniquement, rien d'activé)

1. Le gateway expose `probabilities` {keep, review, skip}, validées (complètes, somme ≈ 1),
   omises sinon ; le sélecteur les transmet ; elles sont conservées dans la trace.
2. `selectionOutcome()` : politique configurable (planchers de confiance et seuils optionnels
   P(keep)/P(skip)). Par défaut, la règle historique de 0,75 : aucun changement tant que
   l'opérateur ne passe pas une politique.
3. Le script de calibration hors ligne et ses tests.

## Étapes pour rendre Jev fiable (activation : Codex ou Ivan)

1. **Tout de suite, sans redéployer le gateway** : passer
   `{keepMinConfidence: 0.20, skipMinConfidence: 0.25}` au pipeline. Gain mesuré : décisions
   exactes ×1,7, aucun faux keep, un tiers des abstentions en moins, ce qui limite aussi la
   croissance de la file.
2. **Redéployer le gateway avec les probabilités**, puis rejouer **la même** passe
   (`inputs.jsonl`, une seule répétition, < 0,002 €) et lancer
   `calibrate-alert-selection.mjs` : il choisira P(keep)/P(skip) sur dev et les vérifiera sur
   holdout.
3. Si P(keep) ne sépare toujours pas les classes, réécrire les critères (question `mac-v4`, après
   accord) : keep = fait nouveau qui change une décision, un coût ou un risque d'un objectif
   actif ; review **seulement** si le sujet est actif et qu'un fait essentiel manque ;
   commentaires, opinions et actualités sans conséquence = skip. À mesurer sur les mêmes jeux.
4. **Entretien** : rejouer le jeu figé à chaque changement de question, de contexte ou de
   modèle Jev, et une fois par mois (moins d'un centime). Ajouter au jeu les cas de production
   mal classés relevés par Ivan, toujours étiquetés avant mesure. Ne jamais baisser un seuil
   pour forcer un reçu.
