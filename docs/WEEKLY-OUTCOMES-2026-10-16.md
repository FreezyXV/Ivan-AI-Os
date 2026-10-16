# Résultats du pilote Mac — 16 octobre 2026

Fenêtre observée : 9 octobre 21:00 UTC au 16 octobre 12:42 UTC. Source :
SQLite de production et registre de décisions, lus sans modification par
`scripts/audit-mac-outcomes.mjs`. Preuve privée initiale :
`/private/tmp/ivan-weekly-baseline-2026-10-16.json` (à conserver dans la livraison).
Le Mac est bien l'hôte Darwin ; branche précédente propre, fetch sans écrasement.

| Résultat | Observé |
| --- | --- |
| Nouveaux candidats | 111 : Engineering 83, Business 19, Finance 5, System 4 |
| Digests tentés / confirmés / incertains | 3 / 1 / 2 |
| Sources effectivement livrées | 2, toutes deux avec objectif Engineering |
| Fiches Business automatiques | 0 |
| Dossiers et choix réels | 1 dossier préparé par Codex, 1 choix tester d'Ivan |
| Complétions natives enregistrées | 52 au minimum ; interruptions non comptabilisées possibles |
| Coût natif / utilité notée / temps gagné | non mesurés |

Le ratio de confirmation 1/3 concerne ces trois tentatives seulement. Il ne
prouve pas une fiabilité générale de 33 %, ni la non-réception de tous les envois
incertains. Ceux-ci restent isolés et ne seront pas renvoyés automatiquement.
727 cycles process réussis ne constituent pas 727 résultats utiles.
Jev : 761 appels, 0,029489 € estimé pour le mois, inchangé ; il ne trie pas ces alertes.
Les abonnements ne prouvent pas un coût API nul. Aucun nouveau service payant.

## Causes prouvées et ajustements

1. Le seul flux Business était la liste Ask HN populaire, avec un seuil de votes.
   Les contenus lus portent souvent sur des discussions générales, pas sur une
   contrainte d'achat. La synthèse livrée sous topic business avait correctement
   choisi goal engineering : il ne faut pas compter ce classement comme une offre.
   Le nouveau collecteur cherche des demandes par quatre requêtes fixes, sans
   seuil de popularité, puis lit au plus quatre nouveaux posts sur l'API officielle.
   Il ne lit pas les commentaires, ne contacte personne et ne déduit aucun paiement.
2. Une proposition Business récente a échoué sur PREUVE_0_TYPE. Le prompt donnait
   une pseudo-valeur « douleur ou demande ou offre-existante ». Il fournit désormais
   une vraie valeur et la liste fermée explicite. Les nombres proposés pour une
   action ne doivent plus faire échouer une citation : le prompt évite les nouveaux
   nombres dans action/utility et réserve la durée au champ du test. Les contrôles
   de fidélité restent inchangés. La priorité est System, Business, Finance, Engineering.
3. Une tentative Telegram dure 20,368 s, ce qui correspond à la limite du wrapper.
   Sans cause native conservée, le lien précis avec une panne réseau n'est pas
   démontré. Le test à blanc actuel prend 3,865 s, IPv4 et IPv6 publics répondent.
   Aucun réglage réseau forcé sur cette seule hypothèse. La marge native passe à
   40 s, la limite globale à 50 s, sous le bail de 120 s ; toujours un seul essai.
   Les phases timeout/exit/reçu invalide et durée sont maintenant conservées sans
   sortie CLI privée. La tentative de 162 s peut avoir été suspendue avec le Mac ;
   une limite logicielle n'empêche pas une suspension système.
4. Le nouveau collecteur mémorise les refus et échecs pour libérer le budget au
   passage suivant. Une archive perdue ne bloque pas une autre source : l'identité
   terminale est consultée sans rouvrir l'archive. Recherche et lectures ont des
   plafonds distincts ; une indisponibilité reste visible, jamais une opportunité.

Documentation technique des sources : [API HN officielle](https://github.com/HackerNews/API),
[recherche Algolia](https://hn.algolia.com/api). L'index sert à découvrir des ID,
jamais à fournir une citation. Les requêtes élargissent les problèmes recherchés,
mais HN demeure un échantillon biaisé ; une demande ne démontre pas un marché.

## Mesures suivantes

Après activation, consigner le commit, le résultat de collecte, les décisions
natives et la première fiche/réception réellement obtenues. Une qualification
déclenchée par Codex n'est pas un digest du soir sans intervention. Ne pas assouplir
la relecture pour remplir artificiellement le catalogue Business.

Recueillir l'avis d'Ivan sur le résultat, puis comparer sur la même fenêtre :
propositions actionnables, raisons de refus, décisions, temps et coût disponible.
La consolidation des PR et la revue Claude restent séparées des preuves runtime.
