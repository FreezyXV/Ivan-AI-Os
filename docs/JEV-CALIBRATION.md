# Questions livrées à Claude et calibration

Contrat source de `services/jev-gateway/src/questions.js`, activation coordonnée encore requise.
Les questions sont fixes et versionnées avec le code ; le caller ne fournit jamais de question
libre, de politique, de texte privé ou de liste d'outils censée accorder une permission.

| Question | Entrée locale autorisée | Résultat et usage |
| --- | --- | --- |
| route.manager.v1 | requested_tasks, urgency, details_available | Choice parmi six managers ; seuil 0.7, consultatif |
| route.details.v1 | mêmes métadonnées | Noul : manque-t-il des détails pour exécuter ? Le domaine peut rester routable |
| route.urgency.v1 | mêmes métadonnées | Score 0/1/2, basé uniquement sur l'urgence déclarée |
| action.permission.v1 | catégories dérivées localement et catalogue fixe | ALLOW/REVIEW/DENY probabiliste ; ALLOW devient REVIEW dans l'évaluateur |

Ces noms identifient les questions de documentation, pas de nouveaux endpoints. Les trois
premières sont groupées dans `/v1/route`, la quatrième intervient dans `/v1/evaluate-tool`.
Le bearer privé et le compteur commun estimé 10 EUR/mois s'appliquent. Aucun plafond de 500 appels.

Livraison pour le skill calibration-jev de Claude : 19 cas synthétiques étiquetés couvrent tous
les types de tâche, les trois urgences et détails présents/manquants. `organize_notes` revient
au manager System, chargé de la mémoire ; connaissance et contenu pédagogique à Knowledge.
Lire `ROUTING_CALIBRATION` dans `src/calibration.js` sans injecter de profil. Les résultats
séparent couverture, erreurs de manager, taux REVIEW, détails et urgence. Mock, pannes et réponses
invalides ne produisent jamais une prétendue précision Jev. Les cas sont synthétiques, ils ne
mesurent ni l'extraction correcte d'une demande Telegram ni la réussite d'un worker.

`node scripts/calibrate-jev-routing.mjs` valide le corpus, sans réseau. Après migration du gateway,
`--live` mesure via loopback authentifié ; aucun secret dans argv, aucun contenu libre transmis,
aucun retry. Le premier échec interrompt la série. Le budget du gateway reste la limite. La
validation offline et les tests du calcul des métriques ne démontrent pas une qualité live.
Faire relire les labels avant de régler les seuils, garder les cas de validation indépendants.

## Validation indépendante préparée

`src/routing-holdout.js` ajoute 19 cas étiquetés avant toute réponse fournisseur : treize demandes
multi-tâches (dont des priorités inversées et huit catégories), six variantes de détails/urgence.
Aucune entrée complète n'est réutilisée du corpus de réglage ; le validateur refuse recouvrement
et doublons. Les six managers sont couverts. Les labels attendent la relecture de Claude.
Les questions et seuils restent inchangés ; les tests ne mesurent aucune qualité Jev réelle.

`node scripts/calibrate-jev-routing.mjs --holdout` valide ce second jeu, sans réseau.
Après bascule et provisionnement, `--holdout --live` mesure séparément `corpus: holdout-v1`.
Ne pas confondre son score avec `training-v1`, et ne pas ajuster sur le holdout puis revendiquer
une validation indépendante. Créer de nouveaux cas si le holdout influence le réglage.
`--dry-run` et `--live` sont incompatibles ; toute combinaison est refusée avant réseau.
Les deux passages complets font 38 requêtes routage, soumises au même budget estimé 10 EUR/mois.
La catégorie portfolio_review mesure seulement le routage ; son relais privé reste la décision
du plan de dispatch, sans contenu personnel transmis. action.permission nécessite un autre corpus.

**tache.outil** : je conteste l'hypothèse qu'un nouvel appel modèle soit toujours utile pour
choisir un outil. Le classifieur shell, secrets et chemins protégés retourne déjà son avis
sans appel Jev ; les règles de permission demeurent déterministes. Pour les fichiers ordinaires,
Jev évalue la classification avec le catalogue fixe. Une future sélection `tache.outil` doit
mesurer un gain par rapport à une règle locale et préciser le contexte autorisé avant un nouvel
endpoint. `/v1/classify` et `offre.compatible` ne sont pas livrés. Le skill de calibration peut
déjà calibrer les quatre questions disponibles sans dépendre de ces propositions.
