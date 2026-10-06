# Business au runtime, sources non lues, refus Finance — revue Claude (2026-10-06)

Code relu : `agent/codex/alerts-integration` @`7d37952` ; runtime actif d'après le relais :
`33480ee`, contexte v6, mode E 0,75. Lectures privées faites une seule fois, sans recopier ni
réglage ni jeton. Aucun modèle, aucun appel payant, aucune mutation de la file (SQLite ouvert en
`mode=ro`), aucun envoi.

## 1. Fiche native Business B03 (runtime 33480ee, reçu Telegram de test 61)

Trois niveaux à ne pas confondre :
- **Mécanique** : `VERIFIED`. La citation est exacte et `verifierFiche` ne remonte aucune erreur.
- **Éditorial** : insuffisant.
  - Fait : **fidèle** (prix au contact, sollicitation commerciale, engagement annuel, essai supprimé :
    tout est dans la citation).
  - Acheteur : bien marqué hypothétique, mais vague (« équipes utilisant un SaaS… »).
  - **Utilité et action hors sujet Business** : « si un projet utilise customer.io… vérifier si Ivan
    l'utilise ; sinon, rien à faire ». La fiche décrit des clients mécontents d'un outil payant,
    c'est-à-dire un marché possible ; qu'Ivan utilise l'outil ou non n'a pas d'importance.
  - **L'hypothèse n'est pas une hypothèse de marché** (« un prototype local peut comparer deux
    parcours »).
  - **Le test ne mesure aucune demande** (« comparer localement deux parcours fictifs »). Codex
    le dit aussi : un prototype fictif ne prouve pas une demande solvable.
  - Une seule objection ; la limite est répétée trois fois (« Limites Business », la mention
    d'extrait partiel du code, « Limite »).
- **Livraison** : reçu 61 = essai Telegram d'une capture historique (26 août), marqué comme tel ;
  ce n'est ni une alerte fraîche ni une sélection Jev.

**Deux contre-exemples réellement utiles, ajoutés au vérificateur** (`qualiteFiche`, **non
bloquants**) :
- `TEST_SANS_RECHERCHE_DE_PREUVE` : avec moins de deux sources distinctes, le prochain test doit
  chercher d'autres preuves (sources, témoignages, discussions) ;
- `HYPOTHESE_SANS_MARCHE` : l'hypothèse doit parler d'un besoin, d'un acheteur ou d'un paiement.

La sortie réelle B03 est conservée en fixture (`sortie-native-B03.json`) : elle déclenche les deux
avertissements, et la même fiche corrigée n'en déclenche aucun. **Choix non bloquant, et pourquoi** :
les rendre bloquants dans `verifierFiche` cassait deux tests runtime de Codex (sa fixture
synthétique a exactement ces deux défauts) et aurait mis en revue des fiches aujourd'hui livrées.
Proposition à Codex :
1. journaliser `qualiteFiche` dans `validation_checks` ;
2. ajouter ces deux règles au prompt Business ;
3. les rendre bloquantes après une mesure sur de vraies sorties.

Prompt Business proposé (même contrat) : « L'utilité Business parle du marché (qui souffre, qui
paierait), jamais de l'usage d'Ivan. Avec une seule source, le test cherche d'autres sources
distinctes de la même douleur, en lecture seule. L'hypothèse nomme un acheteur et un besoin. »

## 2. Sources non lues de la file live (16) — lecteurs proposés (code réservé à Codex)

| Source | URL canonique | Date dans la page | Passage substantiel | Décision proposée |
|---|---|---|---|---|
| Cloudflare « Introducing Web Search API » | `https://developers.cloudflare.com/changelog/post/2026-10-02-introducing-web-search-api/` | `datePublished` 2026-10-02 (JSON-LD et `<time>`) | « Web Search API is now available in beta… search requests appear in your gateway logs and are billed to your AI Gateway credits at each provider's list API price » | **review** : capacité réelle et datée ; usage concret pour le pilote non établi (OpenClaw a déjà une recherche web) |
| Mistral « Introducing Mistral Large 4 » | `https://mistral.ai/news/mistral-large-4/` | `datePublished` 2026-10-06T12:00:27Z | « a public preview of Mistral Large 4… 1 trillion-parameter natively multimodal model with 49 billion active parameters… Weights drop end of this month » | **keep (digest)**, Engineering ou coûts : nouveau modèle à poids ouverts, API en préversion |
| Mistral, documentation | `https://docs.mistral.ai/models/mistral-large-4-0` | texte visible « October 6, 2026 », pas de JSON-LD | « 52B active parameters and 1.05T total parameters… Context 1M » ; deux grilles de prix (« $1.36 / $0.68 » en entrée par million de tokens) sans libellé | **doublon de l'annonce** : fusionner en un seul élément (même événement) ; garder la documentation comme seconde preuve |
| RemoveMacAI (README GitHub) | `https://github.com/omlahore/RemoveMacAI` | pas de date dans le README ; dépôt créé le 2026-09-29 (API) | « macOS 27 no longer has a single switch for Apple Intelligence, and its models stay on disk… All changes can be reverted » | **review / exclu de l'action** : le Mac du pilote est sous macOS 27 (Darwin 27), mais l'installation passe par `curl … \| bash`, interdit par nos règles ; gain de disque non mesuré dans le README |
| Strata (README GitHub) | `https://github.com/Niko1221/Strata` | pas de date ; dépôt créé le 2026-09-24 | « Windows or Linux · NVIDIA or AMD graphics card (12 GB or more) » ; RTX 5070 : 94 tokens/s (Q2_0) | **skip** : inapplicable au Mac ; le titre en file (« RTX 4090 à 100 T/s ») **n'est pas étayé** par le README |

Les 11 autres pages non lues n'ont pas été traitées : Google Data Center, Nolan Lawson, fuite CPR
au Danemark, VB6, Schnabel (PDF), Anthropic/police, ChatGPT/caricatures, Reflection Beam, Vals
(semi-conducteurs), JetBrains, Nobel.

**Incohérence Mistral à signaler** : 49B actifs et 1T au total dans l'annonce, contre 52B actifs et
1,05T au total dans la documentation. Une synthèse doit citer chaque chiffre avec sa source, sans
les fusionner ; les prix sans libellé ne doivent pas être interprétés.

Lecteurs proposés à Codex :
1. `developers.cloudflare.com/changelog` : date JSON-LD et conteneur d'article ; hôte autorisé.
2. `mistral.ai/news` : date JSON-LD. `docs.mistral.ai` : pas de JSON-LD, donc lire la date visible
   ou refuser ; **clé d'événement** commune (famille d'hôtes `mistral.ai` et identifiant du modèle)
   pour le dédoublonnage annonce/documentation.
3. README GitHub : texte via l'API publique `/repos/{o}/{r}/readme` (brut), date = création ou
   dernier push du dépôt, avec une précision « dépôt » explicite. Ne jamais suivre ni exécuter
   les commandes d'installation ; classer « outil tiers non vérifié ».

Empreintes des captures (SHA-256, 12 premiers caractères) : Cloudflare `8d637429b0df`,
annonce Mistral `8c2f9484e2a5`, documentation Mistral `4bea9f296897`, README RemoveMacAI
`115205408630`, README Strata `b4cb8b284a7f`.

## 3. Refus Finance live (`ALERT_FACT_UNSUPPORTED`, phase `VALIDATE`, sans brouillon)

Preuves publiques lues : FRED DGS10 (« Taux US à 10 ans : 5.24 % → 5.28 % (2026-10-02) ») et
l'entretien BCE avec Ansa (6 octobre). Sonde sans modèle :
`<node 24 géré> skills/rapport-telegram/scripts/sonde-finance-v6.mjs`

| Formulation | Résultat |
|---|---|
| « Le taux US à 10 ans est passé de 5,24 % à 5,28 % (observation du 2026-10-02). » | **accepté** |
| « …a gagné 4 points de base… » (écart calculé) | refusé, voulu : aucun nombre dérivé |
| « Selon l'entretien, l'inflation italienne a atteint 4,1 % lors du dernier relevé. » | **accepté** |
| « L'interviewé estime qu'un soutien budgétaire large ajoute à la demande et freine le retour de l'inflation à 2 %. » | **accepté** |
| « Selon la BCE, l'inflation italienne a atteint 4,1 %. » | **refusé** : « BCE » n'est pas dans la citation, alors que la source est la BCE |
| « Philip Lane note… » (le nom est absent de l'extrait tronqué) | **accepté** : angle mort, les noms propres ne sont pas contrôlés |

Je ne peux pas dire pourquoi les deux refus réels ont eu lieu : aucun brouillon n'a été conservé.
La sonde montre deux défauts codés reproductibles, qui pourraient expliquer ce type de refus sans
le prouver.
- **Attribution à l'éditeur** : pour une source `ecb.europa.eu`, accepter `BCE`/`ECB` dans un fait
  au titre de l'éditeur (métadonnée de la source), sans exiger le sigle dans la citation.
- **Points de base** : le prompt Finance doit interdire la conversion en points de base, et
  donner les deux valeurs citées.

Angle mort à garder en tête : un nom propre absent de l'extrait passe le contrôle ; la relecture
humaine reste nécessaire.
