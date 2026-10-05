# Mission Claude Code — synthèses Telegram utiles à Ivan

## Actualisation du lot — intégration Codex en cours le 5 octobre

Claude n'a pas encore commencé ce lot (attente de quota confirmée par Ivan).
Le prompt transmis directement à Ivan remplace les états anciens ci-dessous.
Codex a construit les collecteurs locaux, lecteurs BCE/HF/Next/Ask HN, file
durable, cycles, génération native et digest sur `agent/codex/alerts-integration`.
Lire `docs/MAC-ALERT-ORCHESTRATOR.md` sur cette branche lorsqu'elle est publiée.
Le planning Mac est maintenant actif ; l'ancien workflow Sentinelle est arrêté.
Digest technique reçu 58, puis reprise sans doublon. Son tri est explicitement
simulé : les dix sélections réelles initiales/révision sont rejetées ou en revue,
donc pas de génération automatique de production. Ne pas annoncer un parcours
réel KEEP Jev complet. K03 doit analyser cette forte abstention sur un corpus
indépendant ; ne pas calibrer seulement sur les sources qui ont déjà échoué.

K01–K03 restent entièrement à Claude : skill, contrat et évaluation indépendante.
Ne pas reconstruire le runtime, les collecteurs ou l'authentification. Le contrat
`coded-brief-v1-provisional` est volontairement provisoire, à contester/revoir.
Sortie finale : goal, facts[{summary,quote}], utility, action, uncertainty.
Dans la complétion, `evidence_index` référence un passage de source ; le code
insère sa citation exacte et vérifie les chiffres avant READY. Ne pas demander
au modèle de retaper une citation : cette copie a échoué en essai réel.
Une adaptation de schéma/longueur doit être proposée à Codex, sans changer son
runtime ni produire une interface parallèle. Aucun seuil abaissé pour forcer
un résultat. L'extrait est borné à 1200 caractères, un digest à 2500 : signaler
les limites éditoriales sur des exemples réellement lus.
Le runtime Finance corrige les anciens liens ICP, retire la bougie Kraken en
cours et borne les reprises réseau. Les sept indicateurs répondent sur le
dernier probe corrigé ; les sources du skill restent à aligner dans K04/K05.
Diagnostic backlog/cycles/reçus disponible dans scripts/inspect-mac-pilot.mjs.

Le premier lot part de foundation/v1 sur `agent/claude/telegram-syntheses`, dans
le worktree Claude ; les modifications locales existantes restent intactes.
PR brouillon, sans fusion ni activation. K04–K07 suivent sur branches distinctes,
Knowledge/Anakalypto à la fin. AGENTS.md et constitution restent inchangés.

Ivan souhaite que Codex pilote le plan global et que Claude participe sur un
périmètre distinct. Ce document est une passation, pas une autorisation de fusion,
de publication externe, d'achat ou de déploiement. Le périmètre est déjà décidé.

## État à lire avant travail

Sur ton worktree séparé, vérifier pwd, uname -s, git status --short --branch.
Lire AGENTS.md, constitution/CONSTITUTION.md, docs/ARCHITECTURE.md puis le
SESSION_HANDOFF courant. La foundation distante est à 454b21e ; la PR #47
contient le dernier relais et les adaptations natives actives sur Mac.
Lire aussi docs/MAC-PILOT-PRIORITIES.md sur agent/codex/mac-alerts-pilot.
Ne pas confondre les paragraphes historiques du relais avec le dernier état.

Jev authentifié 4311 et OpenClaw 18789 sont actifs ; six rôles configurés,
sept conservés dans les définitions du projet (Career en pause complète).
Les PR #45/#46/#47 restent ouvertes. #46 est une reprise Trousseau active,
#47 active quatre paquets : brief Business, Finance publique, mémoire System
et Knowledge. Les natifs sont vérifiés ; les synthèses Sentinelle ne le sont pas.
Le chef a encore un chantier de fiabilité livraison (#21). Ne pas refaire
provisionnement, calibration ou installations déjà effectués.

## Décisions Ivan

- Career en pause plusieurs mois, conservation des fichiers et capacités pour reprise.
- Finalisation Knowledge/Anakalypto à la toute fin, ensemble Codex et Claude.
- OVH reporté : priorité au test et à l'optimisation sur Mac.
- Les alertes doivent éviter à Ivan d'ouvrir et comprendre chaque article :
  filtrage fort, faits réellement lus, synthèse constructive, utilité personnelle,
  action éventuelle et lien source à la fin. Pas de flot de liens nus.

## Ton périmètre, sans concurrence avec Codex

Utiliser Claude Code dans le terminal Cursor ouvert sur ~/Ivan-AI-Os-claude,
jamais claude.ai ni le checkout actif de Codex. Vérifier que c'est ton worktree.
Récupérer les références distantes sans écraser les fichiers locaux. Créer
agent/claude/telegram-syntheses depuis origin/foundation/v1 si elle n'existe pas ;
si elle existe, l'inspecter et la réutiliser seulement si elle correspond à ce lot.
Si le checkout est modifié, ne pas stash/reset/clean ni forcer le changement :
préserver les fichiers et isoler la nouvelle branche dans un worktree approprié.
Le cadrage courant est disponible avec git show depuis
origin/agent/codex/mac-alerts-pilot:docs/MAC-PILOT-PRIORITIES.md.
Tu modifies seulement skills/rapport-telegram/ et le contrat de synthèse dans
workflows/ ; tu crées docs/ALERT-EDITORIAL-CONTRACT.md et ta note de revue.
Tu peux signaler les adaptations nécessaires aux autres skills, sans les réécrire
ni modifier les sources/runtime possédés par Codex pendant ce premier lot.
Codex possède services/, hooks/openclaw/, shared/, scripts de collectes/envoi,
le filtre codé, les questions Jev et la bascule. Ne modifier ni la config OpenClaw
live, ni les LaunchAgents, ni les envois Sentinelle, ni le worktree Codex.
AGENTS.md et constitution restent inchangés. Aucun secret ou profil privé dans Git.

## Livrables concrets

1. Remplacer le réflexe « 600 caractères puis lien du détail » par un message
   autonome : fait daté, 2–4 points essentiels, utilité contextualisée, action/rien
   à faire, incertitude si nécessaire, source finale. Viser 1000–1800 caractères
   lorsque utiles, moins si cela suffit ; ne pas confondre longueur et valeur.
2. Dans le contrat, proposer un schéma entrée/sortie simple en JSON : id canonique,
   dates publication/collecte, contenu effectivement lu et sources, faits étayés,
   contexte compact et provenance, classification pertinente/incertaine/écartée,
   raison, synthèse, utilité, action, limites, livraison immédiate/digest/silence.
   Les champs inconnus restent inconnus ; aucune personnalité ou objectif inventé.
3. Proposer un contexte minimal pour le pilote : Ivan AI OS sur Mac, qualité et
   coût des agents, automatisation Business/Engineering/System, veille macro
   publique. Career en pause, OVH reporté, Anakalypto à la fin. Si une information
   du profil privé semble utile, proposer son inclusion locale séparément ; ne
   copier ni le profil complet ni les finances personnelles dans les paquets.
4. Définir les critères : nouveauté, fraîcheur, preuve, lien concret avec une
   priorité active, effort/impact probable, action disponible. Un titre séduisant
   ou des mots-clés communs ne prouvent pas la pertinence. Séparer fait et déduction.
5. Créer au moins 8 évaluations synthétiques : évolution technique utile, macro
   pertinente, bruit IA, doublon entre les deux bots, contenu ancien, Career en
   pause, source inaccessible, utilité incertaine. Ajouter des critères vérifiables
   et exemples de bonnes synthèses ; ne pas présenter des tests de format comme
   une preuve de compréhension ou de pertinence réelle.
6. Proposer une livraison sobre : digest ordinaire, alerte immédiate seulement
   pour une urgence/action réelle ; aucun seuil chiffré présenté comme calibré
   sans mesure. Les fréquences restent une proposition pour le pilote.

Lire effectivement la source avant de résumer. Aucun résumé inventé à partir
uniquement d'un titre ; un accès incomplet doit rester visible. Jev classe,
un LLM synthétise après sélection ; ne pas inventer de nouvel endpoint ou de
question Jev. Codex fixe et implémente cette interface à partir du contrat.
Sentinelle est maintenant localisé : dépôt privé FreezyXV/sentinelle,
GitHub Actions quatre fois/jour et digest, MODE=ombre. Lire
`docs/SENTINELLE-INTEGRATION.md` et relire la PR Sentinelle #1 : dates RSS
préservées, candidats publics exportés, aucun profil ni décision distante.
Le client et le compteur historiques sont distincts du gateway Mac ; le futur
tri doit rejoindre ce dernier. Aucun changement de planning live pour l'instant.

## Livraison et coordination

État complémentaire Codex : Career maintenant absent du registre actif,
workspace/définition conservés ; les sept rôles restent définis dans le dépôt.
Les six revues Workshop incompatibles sont en mode propose, sans modifier
les managers ou canaux. Lire docs/MAC-PILOT-OPERATIONS.md.
Interface Jev active sur 4311 : POST /v1/alerts/select, question serveur
alerts.pertinence.mac-v1, extrait public 500 caractères + contexte public fixe,
keep/review/skip et request_id. Même bearer/budget, catalogue classify inchangé.
Release gateway 59fbd7e, runner cc1d2a5 ; preuve native et appels réels OK.
Un aperçu manuel source réelle est reçu sur Secrétaire Ivan (57), mais aucune
synthèse automatique n'est encore branchée. Utilise ce contrat pour K02/K03 ; transmets tout
écart éditorial nécessaire, sans changer services/ ou le runtime live.
K05 : ton skill jev-decision contient encore « classify n'existe pas encore » ;
aligner ses passages historiques sur le contrat réel livré.

Ivan demande aussi la répartition jusqu'à la fin du projet : lire
docs/PROJECT-CHECKLISTS.md sur origin/agent/codex/mac-alerts-pilot.
K01–K03 constituent ton lot immédiat, les autres lots suivent ses dépendances.
La file technique candidate est décrite dans docs/ALERTS-RUNTIME.md :
Codex attend ton contrat avant de figer le schéma et les adaptateurs.

Avancer sans nouvelle demande d'accord sur ce cadrage déjà donné par Ivan.
Tests utiles, commit/push sur ta branche et PR en brouillon vers foundation/v1 ;
relecture Codex avant fusion. Pas de fusion ou activation implicite.
Rapporter fichiers, tests, exemples, points d'intégration et limites réelles.
Lire les PR #46/#47 séparément si nécessaire ; ne pas y intégrer ce lot éditorial.
