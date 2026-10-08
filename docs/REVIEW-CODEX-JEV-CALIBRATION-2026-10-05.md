# Revue et intégration Codex — calibration des alertes

## État courant après mesures réelles

Décision d'Ivan : Jev seulement où sa qualité est démontrée. Le runtime actif
`a604aa6` utilise `selectionMode: native-editorial` : une complétion isolée juge
l'utilité et rédige seulement pour keep. Aucun appel Jev obligatoire pour les
alertes ni pour le tri intermédiaire Business/Finance. Le code conserve les
exclusions, dates, dédoublonnage, preuves, baux et reçus. Jev reste disponible
sur 4311 pour ses autres interfaces consultatives et le benchmark coordonné.
Ce changement ne prouve pas une supériorité universelle du LLM : Claude doit la mesurer.

Toutes les passes ont un résultat privé revendiqué avant l'appel, aucun label
dans les requêtes, aucune répétition automatique, zéro erreur :

| Question / contexte | Passe | Résultat |
| --- | --- | --- |
| mac-v1 / v3, probabilités exposées | 94 cas | Politique probabiliste : 2/14 utiles dev, 0/2 ancien holdout ; insuffisant |
| mac-v2 / v4, utilité informative | 83 dev seulement | 9/14 utiles à confiance 0,75, mais 3 faux keep ; non activée |
| mac-v3 / v5, stack et faits matériels précisés | 83 dev seulement | Politique probabiliste : 10/14 utiles, 0 bruit retenu, 0 utile écarté ; 58/83 exacts |
| mac-v3 / v5, contrôle neuf de Claude | 12 cas, 5 appels Jev | 11/12 stricts ; 7 exclusions locales, 2 keep utiles synthétiques, aucun bruit skip retenu |

La politique v5 diagnostique est `{keepMinConfidence:1,skipMinConfidence:1,
keepMinProbability:0.1,skipMinProbability:0.2}`. Deux seuils satisfaits donnent
review. Elle reste en réserve ; elle ne pilote pas le digest actif.
V12 donne keep au lieu de review : le label initial admettait ce désaccord
pour un digest Telegram conditionnel ; il interdit une urgence sans inventaire.
Ne pas transformer ce désaccord en 12/12 stricts ni cacher `review>keep`.
Les keep synthétiques ne prouvent aucune livraison utile réelle.
Le contrôle est désormais consommé ; ne pas le réutiliser pour ajuster les seuils.

Les labels dev comprennent des articles désormais anciens : huit des quatorze
keep seraient exclus par le filtre au soir du 5 octobre. Distinguer utilité
sémantique et fraîcheur de production. Deux décisions changent entre la première
passe v3 et la nouvelle : la stabilité des deux répétitions de Claude n'est pas
une garantie de stabilité dans le temps. Aucun seuil n'est une probabilité de
qualité de bout en bout.

Budget vérifié après mesures : 715 appels mensuels, 0,026624 EUR estimé,
plafond 10 EUR, usage inconnu 0. Nouvelle activation : aucun appel fournisseur.
212 tests locaux runtime/gateway/scripts passent ; CI `a604aa6`, 11/11.
Node 24.19.0 est utilisé par les services. L'ancien `node` interactif n'est pas
la cause de l'absence de synthèses dans les versions précédentes.

## Relecture historique des propositions Claude

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
