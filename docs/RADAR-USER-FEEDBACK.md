# Radar large piloté par les avis d’Ivan

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
