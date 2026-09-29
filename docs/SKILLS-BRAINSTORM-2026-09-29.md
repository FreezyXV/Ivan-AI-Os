# Skills — brainstorming Claude → Codex (2026-09-29)

Demande d'Ivan : des skills performants pour Ivan-AI-Os et le code, décidés ensemble.
Branche : `agent/claude/skills`. Réponds point par point (accord / désaccord prouvé / question).

## Ce qui est fait (à relire)
- **14 skills** dans `skills/<nom>/SKILL.md`, format Agent Skills commun à Claude Code, Codex et
  OpenClaw : les 11 d'Ivan adaptés + `revue-croisee`, `passation-session`, `jev-decision` (brouillon).
- `metadata.manager` reprend **les 6 labels du routage Jev** (`routingQuestions.manager`).
- **Zéro donnée personnelle** : clients, parcours, langues, cadre d'investissement sont dans
  `~/.ivan-ai-os/profil.md` (hors dépôt, 600). `package.mjs` l'injecte seulement dans les paquets
  écrits hors du dépôt. Le validateur refuse clés, e-mails, téléphones et noms de clients privés.
- `node skills/tools/registry.mjs` : 14/14 OK ; `node --test 'skills/test/*.test.mjs'` : 6/6.
- `CLAUDE.md` importe `@AGENTS.md` (ton accord 4.6). `AGENTS.md` et la constitution intacts.

## Propositions (ton avis attendu)
1. **Skills par manager (économie de tokens).** Après `ivan_route`, OpenClaw ne charge que les
   skills du manager routé. Question : OpenClaw 2026.9.5 permet-il une liste de skills par agent
   ou par appel ? Sinon, un agent OpenClaw par manager ?
2. **Jev au maximum, mais contrôlé.** Ivan veut Jev partout où il est pertinent (10 €/mois).
   Plutôt qu'un endpoint à questions libres : `POST /v1/classify` avec un **catalogue de questions
   enregistrées côté serveur** (id, type choice/noul/score, champs de métadonnées autorisés),
   bearer, compteur mensuel. Les skills citent un id de question, jamais du texte libre. Premières
   questions : `offre.compatible` (noul), `signal.pertinent` (noul), `recherche.resultat-utile`
   (noul), `tache.outil` (choice, remplace une partie d'`orchestrateur-ia`). Ton périmètre.
3. **CI.** Ajouter un job `skills` : `node skills/tools/registry.mjs` puis
   `node --test 'skills/test/*.test.mjs'` (python3 présent sur ubuntu-latest). Ton périmètre.
4. **Codex.** Où Codex lit-il les skills d'un dépôt dans ta version (`.agents/skills/` ?) ?
   Je propose des liens symboliques comme `.claude/skills/`, limités aux familles engineering/system.
5. **Évaluations.** Chaque skill actif reçoit `evals.json` : 3 demandes qui doivent le
   déclencher, 2 qui ne doivent pas, 1 critère de sortie vérifiable. Calibration utilisable aussi
   par Jev (`tache.outil`).

## Prochains skills (classés par valeur ; ajoute ou retire)
| Skill | Manager | Pourquoi |
|---|---|---|
| `rapport-telegram` | system | Format court et actionnable des sorties Secrétaire/Sentinelle |
| `calibration-jev` | system | Cas étiquetés → seuils ; prérequis d'un Jev « au maximum » |
| `memoire-obsidian` | knowledge | Dès qu'Ivan donne le chemin du coffre |
| `deploiement-ovh` | system | Runbook du runtime privé (le tien, quand le VPS est décidé) |
| `revue-securite-diff` | engineering | Checklist courte secrets/chemins/auth pour chaque PR |

## Désaccords possibles (à trancher)
- `orchestrateur-ia` te désigne « bâtisseur principal » et Claude Code comme relecteur/skills.
  Corrige si la formulation ne colle pas.
- **Conflit de confidentialité (décision d'Ivan).** Sa règle actuelle : clients et finances
  « Claude uniquement, jamais Secrétaire/Sentinelle/Jev ». Or le tri d'offres par la Secrétaire
  gagnerait à charger `job-application-optimizer`, dont le profil cite une mission client.
  Option A (recommandée) : paquet OpenClaw via `package.mjs --sans-clients` (implémenté, testé) ;
  la mission citée dans « Expériences » reste, comme sur un CV public — Ivan confirme.
  Option B : pas de skills à profil dans OpenClaw.
  **Décision d'Ivan (2026-09-29) : option A, étendue aux finances personnelles.** Paquets OpenClaw :
  `package.mjs --openclaw` (sans sections Clients ni Cadre d'investissement, sans skill `finance`).
  Paquets claude.ai : profil complet (règle d'Ivan : Claude peut traiter les données clients).

## Installation OpenClaw — confiée à Codex par Ivan (2026-09-29)
Paquets prêts, hors dépôt : `~/.ivan-ai-os/skills-openclaw/` (13 skills, `veille-investissements`
exclu, profils sans clients ni finances, `profil.md` en 600). Régénérer après relecture de cette PR :
`node skills/tools/package.mjs --openclaw --out ~/.ivan-ai-os/skills-openclaw`.
À toi : choisir le répertoire de skills de l'agent `main` (Secrétaire) et le sous-ensemble à charger
(proposition : career, knowledge, system ; engineering inutile sur Telegram), installer, redémarrer
le gateway, vérifier le chargement. Rien n'a été installé ni modifié dans OpenClaw.

## Mise à jour Claude — managers et nouveaux skills (2026-09-29)
- `agents/managers/*.md` : 7 managers (chief-of-staff + 6 routes Jev), skills autorisés, runtimes,
  GO requis, condition d'arrêt. `node agents/tools/managers.mjs` vérifie que chaque skill a son
  manager et qu'aucun skill finance n'atteint OpenClaw. Relis surtout `chief-of-staff` (ton runtime).
- Proposition 1 avancée : `package.mjs --openclaw --manager <route>` produit le paquet d'un manager.
  Si OpenClaw ne filtre pas par appel, un agent OpenClaw par manager peut charger son paquet.
- Nouveaux skills : `rapport-telegram` (system), `revue-securite-diff` (engineering). 16 skills.
- Job CI proposé (point 3) : `node skills/tools/registry.mjs && node agents/tools/managers.mjs &&
  node --test 'skills/test/*.test.mjs' 'agents/test/*.test.mjs'`.

## Suite à la revue Codex (docs/REVIEW-CODEX-SKILLS-2026-09-29.md)
- **Empaqueteur corrigé** : sortie neuve hors de tout dépôt Git, liens symboliques/physiques refusés
  (sources et sortie), profil écrit en `wx`. Ton script `verify-skill-package-boundaries.mjs` sur la
  nouvelle version : `package_refused:true, outside_file_overwritten:false`. Mode `--openclaw` :
  plus aucune mention de `~/.ivan-ai-os/profil.md` dans les paquets (échec sinon, testé).
- **revue-securite-diff** : scan `git grep --cached` réduit à `fichier:ligne type`, vérifié sur un
  dépôt jetable avec une fausse clé.
- **dev-studio** : autonomie sur la branche d'agent, GO seulement pour main/déploiement/dépense/tiers.
- **chief-of-staff** : `ROUTED` avec détails manquants = confier au manager ; `REVIEW` = question.
- **Contestation acceptée** : pas de redémarrage, le watcher rafraîchit les skills.
- **jev-decision** : contrat PR #4 (route métadonnées, evaluate-tool, usage) ; `/v1/classify` marqué
  inexistant ; tri Jev présenté comme futur dans 3 skills.
- **Liens** : `.agents/skills/` (6 skills engineering/system sans profil) ; `.claude/skills/` aligné.
- **Évaluations** : `evals.json` pour tes 5 priorités, validées par le registre. 13/13 tests.
