# Reprise du tri natif après veille

Le 7 octobre, l'observation en lecture seule a trouvé deux cycles natifs
encore `running` avec réservation expirée (00:35 et 07:39 UTC), et une source
Business en `processing` depuis 00:35. Les journaux `pmset` confirment de
nombreuses périodes de sommeil et de réveil partiel pendant cette nuit.
La collecte et Finance ont repris le matin ; une nouvelle synthèse a passé
le rédacteur et le relecteur indépendants. Cela ne prouve pas un service
continu pendant la veille, ni une reprise entièrement correcte sans réparation.

## Correctif

- Les anciennes abstentions Jev ne sont rouvertes que pour remplir la capacité
  libre : deux moins les sources `pending` et `processing`. Les nouvelles
  preuves et le travail interrompu gardent ainsi leurs places. Une décision
  native déjà rendue et un envoi déjà tenté ne sont jamais rouverts.
- `reconcile()` ferme les cycles dont la réservation a expiré, avec
  `CYCLE_INTERRUPTED`. Une réservation encore valide est préservée ; un ancien
  propriétaire ne peut plus écrire un résultat. Les deux essais maximum et le
  délai de reprise restent applicables aux cycles réutilisables.
- Le traitement natif utilise uniquement le créneau courant de cinq minutes,
  sans rejouer tous ceux manqués pendant la nuit. Les sources dont le bail a
  expiré restent récupérables dans la même file durable.
- Le diagnostic expose `CHECK_PROCESS_RECOVERY` si le dernier cycle de
  traitement a échoué ; le prochain succès efface cette action. Les synthèses
  prêtes et les autres codes restent visibles simultanément.

## Preuves et limites

Tests rouges avant chaque correctif : migration avec une et deux nouvelles
sources, cycles expirés et diagnostic. Tests supplémentaires : une source
interrompue est reprise avant migration, aucun envoi incertain rouvert,
réservation vivante préservée, essais bornés. Aucun appel modèle dans ces tests.

Le coût d'une complétion interrompue pendant la veille n'est pas connu, et le
SDK natif ne fournit pas de facture dans ce parcours. Quatre complétions
maximum sont réservées par cycle actuel, rédacteur et relecteur compris ;
ne pas les présenter comme gratuites. La fermeture des cycles ne récupère
ni ne fabrique les résultats éventuellement perdus pendant la suspension.

La preuve après activation et les reçus sont conservés hors Git. Un nouveau
sommeil réel sous cette version reste à observer ; aucun réglage d'énergie
du Mac n'est modifié pour fabriquer cette qualification.
