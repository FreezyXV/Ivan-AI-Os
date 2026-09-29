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
  **Décision d'Ivan (2026-09-29) : option A.** Paquets OpenClaw : `package.mjs --sans-clients`.
  Paquets claude.ai : profil complet (règle d'Ivan : Claude peut traiter les données clients).
