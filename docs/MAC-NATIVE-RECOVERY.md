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
- Une indisponibilité du fournisseur arrête le traitement du passage dès le
  premier échec. Le reste de la file garde son état, au lieu de consommer le
  budget sur la même panne. Un refus de contenu ne coupe pas un fournisseur
  sain. Le prochain créneau courant peut reprendre, avec les essais par source
  toujours bornés.

## Preuves et limites

Tests rouges avant chaque correctif : migration avec une et deux nouvelles
sources, cycles expirés et diagnostic. Tests supplémentaires : une source
interrompue est reprise avant migration, aucun envoi incertain rouvert,
réservation vivante préservée, essais bornés. Aucun appel modèle dans ces tests.

Les six erreurs natives du matin sont corrélées à six erreurs de la passerelle
locale Codex : `CodexAppServerLocalRequestCancellationError`, `model/list timed
out`, après environ 5,3 secondes. Elles précèdent la rédaction ; elles ne
prouvent donc pas six jugements éditoriaux défaillants. Des appels ultérieurs
ont de nouveau réussi sans modifier les modèles ni redémarrer le service.
Le correctif évite d'enchaîner trois échecs identiques dans un même passage ;
il ne prétend pas réparer le transport interne du fournisseur.

Le coût d'une complétion interrompue pendant la veille n'est pas connu, et le
SDK natif ne fournit pas de facture dans ce parcours. Quatre complétions
maximum sont réservées par cycle actuel, rédacteur et relecteur compris ;
ne pas les présenter comme gratuites. La fermeture des cycles ne récupère
ni ne fabrique les résultats éventuellement perdus pendant la suspension.

La preuve après activation et les reçus sont conservés hors Git. Un nouveau
sommeil réel sous cette version reste à observer ; aucun réglage d'énergie
du Mac n'est modifié pour fabriquer cette qualification.

## Digest interrompu — 8 octobre 2026

Ivan confirme que le dernier message reçu est celui du 7 octobre à 00:28 Paris
(reçu 62). La file confirme la même dernière livraison. Le digest suivant a
réservé deux synthèses le 7 octobre vers 21:41 ; aucun reçu n'est confirmé,
`delivery_unknown` à 21:47. Le passage a duré 381 secondes malgré un délai
d'envoi nominal de 25 secondes. `pmset` relève un réveil à 21:40 sur batterie
1 %, une veille `Low Power Sleep` à 21:41 et le réveil à 21:47. La suspension
explique le dépassement du délai mural ; elle ne prouve pas à elle seule si
Telegram a accepté le message. Ces deux tentatives ne sont jamais renvoyées.

Défauts reproduits puis corrigés :

- Une page incertaine bloquait toutes les pages suivantes de la journée. Elle
  reste désormais isolée avec ses sources ; les autres synthèses peuvent
  utiliser la page suivante, dans la limite existante de trois pages. Une page
  encore `sending` empêche toujours un envoi concurrent.
- Un réveil avant 19:30 n'offrait aucun rattrapage. Le worker utilise maintenant
  les clés stables de la veille pour les synthèses déjà prêtes avant le début
  du jour Paris. Les nouvelles synthèses du matin attendent le soir. Aucun
  ancien jour ni envoi tenté n'est rejoué ; la fraîcheur est contrôlée à nouveau.
- Un digest incertain était enregistré comme cycle réussi. Il est désormais
  dégradé. Le diagnostic conserve les trois derniers cycles par activité : les
  nombreux passages de traitement ne masquent plus la dernière livraison.
  `CHECK_DIGEST_DELIVERY` s'ajoute aux autres codes actifs.

Tests de reprise sans modèle ni Telegram : lendemain avec anciennes et nouvelles
synthèses, rejeu idempotent, tentative incertaine préservée, expéditeur vivant,
limites de pages, changements d'heure Paris et changement d'année. Une fixture
historique utilisait l'horloge réelle pour des articles du 5 octobre ; elle est
maintenant fixée au temps du scénario pour ne pas expirer selon le jour du test.

Le Mac ne livre pas pendant une veille profonde ; le rattrapage fonctionne au
réveil. Aucune modification d'énergie, du destinataire, de Jev, d'OpenClaw ou des
réglages Claude n'est nécessaire. L'installation et les nouveaux reçus doivent
être vérifiés séparément ; les tests seuls ne prouvent aucune livraison.
