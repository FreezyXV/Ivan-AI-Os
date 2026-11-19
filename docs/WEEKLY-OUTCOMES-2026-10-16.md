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

## Qualification réelle après ajustements

Version `f4346f4` activée avec writer/verifier et worker coordonnés. Collecte
déclenchée par Codex à 12:48 UTC : 4 lectures primaires, 2 demandes nouvelles,
aucun appel modèle pendant la collecte, 2,543 s. Le cycle réel suivant a duré
56,245 s : 4 complétions natives (deux rédactions, deux relectures), 1 fiche
Business approuvée, 1 refus pour UNSUPPORTED_FACT. Les messages Telegram 68
(source System déjà prête avant ce lot) et 69 (nouvelle fiche Unity) sont confirmés.
Le dossier Unity `1e662e4641f1` a été écrit avant l'envoi, sans choix Ivan inventé.
Cela prouve une génération automatique à partir de la collecte, pas encore une
qualification de pertinence sur plusieurs semaines ni un digest du soir sans intervention.

Relecture Codex du résultat : la fiche Unity est fidèle mais encore faible
commercialement ; le premier fait et le problème reprennent un ancien contexte
de prix alors que le blocage actuel porte sur le compte et les actifs. Les
réserves se répètent. Surtout, le [support officiel Unity](https://support.unity.com/hc/en-us/articles/54616227806612-My-Unity-account-was-suspended-after-the-2FA-deadline-How-do-I-get-it-back)
décrit déjà une récupération de compte après la date limite de double authentification.
Ce contre-argument réduit l'intérêt d'une offre de dépannage générique. Aucun
acheteur, revenu ni besoin de construire un produit ne sont prouvés.

Complément `cb2696e` : prompt v5 centré sur le problème actuel en premier fait,
objections distinctes et vérification des solutions existantes ; futurs brouillons
refusés conservés dans l'audit privé, avec leur liaison à la relecture, sans
promotion en ready ni nouvel essai. Le brouillon Proton déjà refusé n'est pas
récupérable rétroactivement : aucun appel n'est refait pour le reconstituer.
194/194 tests runtime/scripts. Le meilleur ordre des faits en v5 reste à mesurer
sur une prochaine source ; le message 69 a été produit avec le prompt v4/contexte v7.

Le complément cb2696e est activé avec worker et plugins coordonnés ; OpenClaw et
l'outil natif sont sains, planning chargé. Sauvegardes SQLite VERIFIED avant les
deux bascules. Les 11 sources livrées et 6 sources incertaines restent dans la même
file ; le registre contient deux dossiers, dont le premier choix tester intact.
Journal Obsidian : `Ivan AI OS/journal/2026-10-16-bilan-hebdomadaire-et-premiere-fiche-business-automatique.md`.
Version OpenClaw réellement installée : 2026.9.5 (ec9c1a1). La nouvelle annonce
2026.10.4 mérite une qualification de compatibilité car elle traite notamment la
reprise après veille ; elle n'a pas été installée sans test des plugins existants.
