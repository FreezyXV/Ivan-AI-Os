# Recherche publique multi-source sur Mac

**Décision plus récente :** Ivan juge maintenant l’intérêt des sujets lui-même.
Le catalogue large `RADAR-USER-FEEDBACK.md` est indépendant du jugement modèle
ci-dessous : ce dernier reste le contrôle des dossiers approfondis, pas la porte
d’entrée de tous les signaux. Les titres non lus sont étiquetés, jamais des preuves.

Ce lot ajoute la recherche qui manquait au tri de liens. Il réutilise le planning
Mac, le moteur de complétion existant, les dossiers Obsidian et Secrétaire Ivan.
Aucun VPS ni abonnement ajouté. Une source préparée, un test et un dossier livré
sont trois preuves différentes ; les résultats réels sont consignés dans le relais.

## Travail réparti

1. Découverte déterministe : demandes publiques WooCommerce, incidents n8n,
   observations macro et demandes Business déjà lues, petit univers crypto tournant.
2. Documentaliste : deux recherches web, lecture de six pages au plus, documentation
   primaire et solutions existantes ; jamais un extrait de moteur pris comme preuve.
3. Calculateur Finance : prix daté, capitalisation, volume, offre et calculs
   reproductibles. Une donnée absente reste absente, jamais zéro par défaut.
4. Analyste temporaire : thèse, intérêt concret, faits cités, inconnues, prochain test.
5. Avocat du diable dans une autre complétion isolée : peut refuser ou demander
   des preuves. Même fournisseur possible : ce n'est pas une indépendance de modèle.
6. Vérificateur déterministe : citations, chiffres/unités, calculs, lien exact entre
   rapport et revue. Deux domaines web ne prouvent pas deux témoignages indépendants.
7. Archiviste et livraison : fiche versionnée avant envoi, reçu Telegram, décision
   native d'Ivan puis nouvelle version de la fiche ; aucun choix deviné.

Une demande de preuves du contradicteur peut créer un seul approfondissement,
avec deux inconnues ciblées. Pas de boucle de sous-agents ni de sessions persistantes.
Jev reste disponible pour ses classifications qualifiées ; il n'est pas une étape
obligatoire du jugement financier ou de cette recherche. Le tri d'alertes reste natif.

## Planning et ressources

Même LaunchAgent toutes les cinq minutes ; un travail de recherche par créneau de
trente minutes, découverte toutes les trois heures, collecte crypto une fois par
jour UTC. Le service répartit les travaux entre domaines. Douze tentatives de
complétion par jour UTC, analyste et contradicteur compris ; échecs comptés avant
appel. Ce plafond d'appels n'est pas un plafond monétaire. Le prix des complétions
natives n'est pas exposé ; ne pas les assimiler à des appels gratuits inclus.

Trois tentatives de livraison de recherche au plus par jour Paris, après 19 h 30,
un dossier par passage. Ces dossiers utilisent la même Secrétaire que le digest.
Une qualification manuelle hors créneau doit être identifiée comme telle.
Les lectures HTTPS publiques utilisent les accès gratuits existants, sans clé.

## Recherche à la demande

Dans le DM privé de la Secrétaire :

- `/recherche actif btc-bitcoin` : identifiant CoinPaprika non ambigu ;
- `/recherche macro inflation France` ;
- `/recherche business problème de sauvegarde des workflows` ;
- `/recherche technique reprise après veille OpenClaw`.

La commande native met en file ; son texte n'est jamais une source. Une même
demande est dédupliquée le même jour UTC et peut être réétudiée un autre jour. L'acquittement
ne signifie pas que les preuves existent. Un dossier insuffisant reste à approfondir.
La réception réelle de cette nouvelle commande doit être distinguée des tests du
handler et de l'envoi sortant. `/opportunite <id>` et `/decision <id> tester <raison>`
réutilisent les commandes existantes. Tester n'autorise ni contact, achat ni déploiement.

## Couverture Finance et limites

[CoinPaprika](https://docs.coinpaprika.com/api-reference/tickers/get-ticker-for-a-specific-coin)
rapporte les cotations et métadonnées. Le connecteur refuse les identités incohérentes,
les dates futures ou trop anciennes, et les nombres invalides. Description et site
« officiel » sont déclarés par l'agrégateur, pas vérifiés par cette seule déclaration.

Bitcoin sert d'ancrage ; deux actifs actifs de rang 5 à 150 tournent quotidiennement,
hors stablecoins et dérivés identifiables. Le résultat est persisté ; si l'univers
échoue, BTC/ETH/SOL servent de repli explicitement dégradé. Ce n'est ni tout le marché,
ni un classement d'investissement. Les actions et obligations n'ont pas encore un
connecteur de valorisation équivalent. La macro utilise des sources publiques lues.

Le calcul de valeur diluée n'est pas une juste valeur. Aucune zone d'achat n'est
qualifiée : le rapport indique « non estimable ». Adoption, capture de valeur,
concentration, émissions futures, liquidité réellement exécutable et scénarios macro
peuvent manquer ; le modèle doit alors demander des preuves ou refuser. Une cotation
de plus d'un jour bloque la livraison et demande un rafraîchissement explicite.

## Reprise et visibilité

État privé `research/research.sqlite` à côté de la file existante. Réservation durable
avant chaque appel/envoi ; travail interrompu visible, envoi incertain jamais rejoué.
Une fiche modifiée par Ivan n'est pas écrasée. Une projection bloquée ne monopolise
pas toutes les livraisons suivantes. La file et les reçus anciens sont préservés.

`inspect-mac-pilot.mjs` expose états, domaines, appels, erreurs de couverture et envois
incertains sans contenu privé. Une recherche partielle ne signifie pas « aucune
opportunité ». DuckDuckGo peut refuser la lecture ; les plafonds et délais des pages
restent bornés. Le Mac doit rester éveillé pour avancer.

## Vérifications

Tests hors ligne : contrat/citations/chiffres, données manquantes, lectures publiques,
répartition, budget, interruption, refus du contradicteur, Obsidian/version/décision,
autorité Telegram et absence de renvoi incertain. Une revue indépendante a reproduit
puis vérifié les correctifs sur calcul avec offre absente, identité actif/macro,
et clôture des envois même lorsque le budget modèle est épuisé.

L'utilité réelle exige ensuite des dossiers notés par Ivan. Le nombre d'agents,
les tests verts et un envoi réussi ne suffisent pas à la prouver.

## Activation et rattrapage du 30 octobre

L'activation du 16 avait été interrompue après déchargement du planning, pendant
la qualification. Au 30 octobre, celui-ci était toujours absent. L'ancien worker
a d'abord été rechargé, puis le lot d47c69b activé avec planning chargé. Ne jamais
laisser le service déchargé en attendant un prochain échange ou une mesure modèle.

`activate-opportunity-release.mjs` regroupe maintenant les étapes, réattend que
le worker soit inactif après le changement de gateway et restaure configuration
et planning ensemble si l'installation échoue. L'installateur refuse un cycle
actif. Les deux chemins d'échec ont été reproduits et contre-vérifiés hors ligne ;
un verrou de maintenance atomique partagé avec le worker reste une amélioration
possible, aucune protection parfaite contre toute course système revendiquée.

Le premier rattrapage a livré le message 71 après seconde lecture. La collecte
s'est enrichie de demandes WooCommerce, incidents n8n, BTC/LTC/Canton et une piste
macro. Ce sont des candidats, pas des opportunités qualifiées. Bitcoin : six
sources, un appel d'analyse, décision à approfondir sans envoi. L'abstention initiale
ne conservait pas encore les questions : défaut corrigé par research-analysis-v2
dans db08a22 (raison, questions, approfondissement lié au parent). Ces corrections
ne transforment pas les essais historiques en dossiers qualifiés ou livrés.
