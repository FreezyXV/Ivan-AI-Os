# Revue et intégration Codex — calibration des alertes

PR #58 @e48fef5, #59 @b1245d7 : chiffres reproduits hors ligne avec
calibrate-alert-selection.mjs sur les 94 cas enregistrés, sans nouvel appel.
Confidence 0,20/0,25 : dev 35/83 exacts, holdout 5/11 ; zéro faux keep observé.
Trois keep bruts : un discours BCE réel, deux scénarios synthétiques.
94/94 décisions identiques entre deux répétitions n'est pas une stabilité
universelle : la confiance varie et les effectifs keep/holdout restent petits.
Les résultats après changements successifs sur ce corpus sont diagnostiques ;
un nouveau contrôle disjoint est demandé à Claude, labels avant mesure.

Six commits #59 intégrés avec provenance : empreintes, BCE interviews,
consignes éditoriales, probabilités, réglages et calibration hors ligne.
Contrats #50/#54, évaluations #55, managers/compatibilité #51–#53 intégrés.
Pas de fusion foundation/main ; aucun checkout Claude modifié.
Production : current, digest ; compact-v1 reste limité à l'évaluation.

Régressions reproduites puis corrigées :
- Career pouvait masquer System par l'empreinte normalisée ; route différée séparée.
- Deux seuils probabilistes simultanés donnaient keep ; contradiction → review.
- Probabilités présentes invalides omises ; refus aux deux interfaces désormais.
- Retry de synthèse payait deux sélections ; reçu lié au contenu/contexte réutilisé.
- Cent reviews immuables masquaient la suivante ; révision examinée mémorisée.
- Deux retraits Kraken donnaient 130 au lieu de 131 ; adaptation doublonnée retirée.
- Échec de décision moteur apparaissait comme succès silencieux ; métriques dégradées.
- Limite de lecture globale favorisait Engineering ; catégories actives représentées.
- Business triait quatre anciens éléments avant filtrage ; non traités prioritaires.

Tests : 128 alertes/scripts/hook natif, 62 gateway, 60 skills/managers,
21 runtime managers et 17 Python ; CI du HEAD à vérifier après push.
Décisions enregistrées réévaluées sans nouvelle requête ; sources périmées,
contextes anciens et tentatives de livraison ne sont jamais réouverts ainsi.
Une seule passe de 94 cas prévue après exposition des probabilités ; fichier
privé revendiqué avant lecture du jeton, labels absents des requêtes.
Reste : preuve de livraison réellement retenue, contrôle neuf indépendant,
usage quotidien et sommeil/réveil, verdict final d'Ivan sur les synthèses.
