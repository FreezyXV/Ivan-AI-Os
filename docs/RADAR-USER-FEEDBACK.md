# Pistes expliquées et avis d’Ivan

## Correction du 31 octobre — contrat courant

Ivan juge le catalogue brut confus et demande un vrai travail de préparation.
Chaque piste comporte, en français : sujet clair, fait attribué, intérêt expliqué,
utilité possible pour son contexte, usage concret, limite et source datée.
L’avis final reste utile/inutile/creuser. Un grand nombre de titres n’est pas une
preuve de qualité ; aucun titre seul ou page inaccessible ne devient une fiche.

Le lecteur récupère la page originale. Pour les longues documentations, des
passages pertinents sont extraits après lecture, pas seulement l’introduction.
Le code conserve URL, date de lecture, date de publication vérifiable ou inconnue,
empreinte et citation propre au fait. Les institutions, éditeurs et témoignages
sont qualifiés différemment : une promesse fournisseur n’est pas un gain prouvé,
une plainte n’est pas un marché, une contribution GitHub n’est pas une validation
du mainteneur. Les sources non qualifiées restent à examiner, pas recyclées comme
preuves. La liste initiale des éditeurs reconnus est explicite dans le code et
devra s’enrichir sur preuves ; elle ne couvre pas encore tous les sites fiables.

Rédaction puis relecture isolées, par lots de quatre sujets au plus ; la revue
vérifie fidélité, attribution, français et usage concret, jamais NOT_USEFUL.
Les cinq parties d’une fiche doivent apporter des éléments distincts. Pas de
compatibilité, gain de coût, usage existant ou chiffre inventé dans l’explication.
Les devises sont contrôlées dans tous les champs, pas uniquement le fait.
Une fiche refusée ou trop vague reste visible dans les diagnostics de préparation.
Deux sujets au plus par message, sans mélange de listes de titres et paragraphes
techniques. Les sources et les commandes d’avis restent à la fin de chaque sujet.

La cible de vingt sujets/jour demeure un plafond, pas une obligation de remplir
avec du contenu non lu. Le coût de rédaction n’est plus nul : deux tentatives
natives par lot, enregistrées avant appel, partagent les douze appels quotidiens
avec la recherche. La recherche de fond utilise au plus un lot avant de laisser
de la place au radar ; une demande explicite garde la priorité. Les coûts natifs
ne sont pas exposés par le fournisseur. Jev reste hors rédaction/tri de ce radar.

Le 31 octobre, les envois bruts ont été suspendus avec sauvegarde ; les autres
services continuent. Le correctif est chargé avec radar encore désactivé jusqu’à
lecture des vraies fiches de qualification. Cette étape n’est pas un envoi réussi.
Consulter le relais pour le résultat final, la version active et les reçus.

### Résultat vérifié de la correction

Version d9e2b62, contrat radar-explained-v3, radar repris après lecture. Deux fiches
Business/Finance sont livrées dans un message distinct des anciens catalogues.
Codex les a réécrites, une contrelecture native a approuvé le texte exact, puis
une revue séparée a vérifié la clarté et l’absence de nouvelle affirmation.
Ce sont des corrections dirigées, pas deux découvertes automatiques revendiquées.
La piste technique FTS5 n’a pas passé la contrelecture de sa formulation et reste
non livrée. La disponibilité de FTS5 sur le Node local a été vérifiée en mémoire
avec des données fictives ; cela n’est pas une intégration mémoire active.

Sources : Insee/SQLite via HTTPS ; Harvest via une lecture Web Codex de la page
officielle, dont seuls de vrais passages ont été repris. Les notes paraphrasées
du worker ne sont jamais devenues des citations sources. L’accès HTTPS Harvest
avait échoué : la qualification est donc assistée, pas entièrement automatique.

Défaut de raccordement détecté : l’outil était enregistré dans le code sans sa
déclaration de contrat dans le manifeste. Corrigé ; l’activation teste maintenant
une invocation réelle invalide, sans modèle, avant de remplacer le planning.
Si l’outil reste indisponible, configuration/planning sont restaurés ensemble.
Contre-revue : devises des champs d’usage et contributions GitHub mal qualifiées
corrigées ; quota de fond borné pour éviter de vider le budget avant le radar.

282 tests passent. Qualification : une invocation sans outil disponible, puis
trois complétions natives réussies (rédaction/revue et revue de la correction).
Quinze réservations au total ce jour, avec les recherches précédentes ; dérogation
de qualification bornée, plafond de production toujours douze, coûts non exposés.
Les prochaines sorties automatiques v3 et leur utilité restent à observer.

## Historique — catalogue brut du 30 octobre, remplacé

Décision du 30 octobre : Ivan préfère recevoir beaucoup de sujets et juger lui-même
leur intérêt. Cela remplace la proposition précédente d’attendre deux niveaux de
dossiers approuvés. Le radar est un catalogue de pistes, pas une recommandation.

## Fonctionnement

- Jusqu’à vingt sujets nouveaux par jour Paris, cinq par message au maximum.
  Première moitié après 9 h, reste après 18 h ; reprise sur les créneaux actuels.
  Un rattrapage explicite peut présenter le plafond quotidien immédiatement.
- Aucun jugement d’utilité Jev ou LLM requis. Le radar prend les références publiques
  des collecteurs existants, y compris celles mises en revue ou écartées par le modèle.
- Business, Finance, Engineering et System ; Career et Knowledge restent différés.
  Les références de plus de trente jours, dates futures, données malformées ou
  secrets détectés ne sont pas envoyés. La couverture reste celle des collecteurs,
  pas tout le Web ni tous les marchés financiers.
- Titre attribué à sa source, date, court extrait réellement lu ou mention explicite
  « titre seul — contenu non vérifié », lien et identifiant stable. Un titre de source
  n’est pas présenté comme un fait confirmé ni un ordre d’action.
- URL canonique dédupliquée, sources déjà livrées/incertaines exclues. Une page réservée
  reste immuable ; un envoi incertain ne sera jamais relancé automatiquement.
  Un dossier approfondi ultérieur est distinct du premier signal, pas un nouveau sujet.

## Retour simple et mémoire

Dans Secrétaire Ivan : `/avis IDENTIFIANT utile`, `/avis IDENTIFIANT inutile` ou
`/avis IDENTIFIANT creuser`, suivis éventuellement d’une raison courte.
`/radar` relit la dernière page confirmée, `/radar 2` la précédente.
L’entrée réelle de ces commandes doit être distinguée des tests du handler natif.
Un retour reçu dans Codex peut aussi être transcrit avec l’origine explicite
`codex-explicit-user`, jamais inventé par un agent.

Les avis et leurs révisions restent dans SQLite ; nouvelles notes seulement dans
`Ivan AI OS/radar/` du coffre choisi. Une note modifiée n’est pas écrasée. Les raisons
sont conservées pour la compréhension et la relecture, pas exécutées comme instructions.

Le classement utilise les derniers avis par sujet : domaines et mots des titres
appréciés remontent ; les sujets jugés inutiles pèsent négativement. Un sujet par
domaine représenté et au moins un quart d’exploration préservent la découverte.
C’est une personnalisation explicite et inspectable, pas un réentraînement du modèle
ni une preuve d’utilité avant réception des premiers avis.

`creuser` met le sujet en file prioritaire de recherche publique, avec déduplication.
Même un titre seul reste une demande : la page originale doit être lue. La recherche
conserve son budget actuel, les preuves et la contrelecture. L’avis ne valide ni les
faits, ni un investissement, ni un achat/contact. Aucun appel de modèle n’est ajouté
pour constituer ou classer le catalogue ; les coûts natifs des approfondissements
restent inconnus et distincts des abonnements ChatGPT/Claude.

## Vérification

Tests : admission large, titres non lus signalés, domaines différés et reçus
incertains exclus, plafond quotidien/reprise, commande propriétaire uniquement,
avis dédupliqué avec historique, recherche sans faux texte-source, classement
avec exploration, projection Obsidian sans écrasement. Les compteurs distinguent
nombre de sujets, pages Telegram confirmées et avis ; ils ne mesurent pas la lecture.

À mesurer ensuite : fraction utile selon Ivan, sujets à creuser, qualité des dossiers
issus de ces choix, erreurs/doublons, charge de lecture. Ne pas réduire arbitrairement
le radar avant d’avoir ces retours ; ne pas remplir un quota avec de fausses occasions.

## Activation et preuve du premier catalogue

Le 30 octobre, f2268d3 est actif avec planning chargé et gateway sain. Vingt sujets
confirmés par Telegram : messages73–76, cinq sujets chacun ; six Business, six
Finance, six Engineering et deux System. Dix sujets issus du planning et dix du
rattrapage opérateur demandé. Aucun appel modèle pour le catalogue, aucun avis
d’Ivan inventé. Quatre notes nouvelles dans le coffre. Les tests concernés sont
272/272 ; la commande entrante réelle reste à distinguer des tests du handler.
