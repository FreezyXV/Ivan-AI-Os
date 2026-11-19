# Revue Codex — benchmark Claude #60, 5 octobre 2026

Revue de 6c6e36a, checkout Claude en lecture seule. Runtime mesuré : a604aa6.
Le mode actif à 20:02 Paris était native-editorial, contexte v5, pas v3/0,20.
Deux synthèses automatiques livrées : reçu 59, sources Simon Willison et Hugging Face.
Preuve privée : mac-alerts-a604aa6/native-editorial-cycle-followup.json.

Calcul contesté : deux probabilités dépassant leurs seuils donnent review.
Commande exécutée, sans réseau :
```sh
node scripts/calibrate-alert-selection.mjs /private/tmp/ivan-dev-labels-v4.json \
  ~/.ivan-ai-os/mac-alerts-f9b502f/candidate-v5-dev.jsonl
```
Sortie : 10/14 utiles, falseKeep 0, exact 58/83. Le calcul keep-prioritaire
reproduit exactement 14/14 et 25 faux keep, mais ne représente pas le runtime.
Accord : petits effectifs, positifs synthétiques antérieurs, pas d'urgence sans inventaire.

Passe nouvelle unique sur les 26 fixtures de #60, labels figés et absents des requêtes.
22 tentatives Jev v5, 22 natives ; 1 erreur Jev et 5 natives, toutes conservées.
4 exclusions locales ; aucune mutation de file ni livraison de benchmark.

| Mode | Utiles / 5 | Faux keep (review inclus) | Utiles écartés | Exact / 26 |
| --- | ---: | ---: | ---: | ---: |
| B : Jev confiance 0,75 | 4 | 0 | 0 | 19 |
| C : jugement/rédaction natifs | 4 | 3 | 0 | 19 |
| D : Jev skip puis natif | 4 | 3 | 0 | 19 |
| E : Jev keep puis natif | 3 | 0 | 0 | 18 |

Politique probabiliste en réserve : 4/5 mais un faux keep ; ne pas l'activer.
Jev médiane 402 ms, p95 645 ms ; natif médiane 9349 ms, p95 17464 ms.
Coût Jev de la passe : 0,001250 EUR estimé, 21 appels facturés ; prose inconnue.
E dérive des mêmes sorties : économie d'appels native projetée, pas chronométrée en production.
Choix conservateur préparé : E, seuils 0,75, digest uniquement. Rappel 3/5 explicitement limité.

Corrections Codex : couverture de score complète, erreurs comptées, sortie exclusive anti-rejeu ;
erreur de prose distincte d'une panne native, reçu payé conservé pour une reprise native.
Claude : corriger #60, noter les 22 sorties existantes et les deux messages du reçu 59 ;
examiner notamment A02/A03, A07/A10/A18 et l'applicabilité conditionnelle A24.
Les cas historiques rejouent leur date d'observation ; aucune fraîcheur réelle prouvée.
Routage : table active, tests existants ; ne pas baptiser un /v1/route table « mesure Jev ».
