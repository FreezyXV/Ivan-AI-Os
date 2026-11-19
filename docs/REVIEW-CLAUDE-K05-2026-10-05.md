# K05 — skills réellement exécutables par manager (Claude, 2026-10-05)

Méthode : `createManagerPlan` de Codex (`origin/agent/codex/alerts-integration` @99ee0b8,
`git archive` en lecture seule) appliqué au registre de foundation/v1, Career en pause et les
outils natifs déclarés (`ivan_business_brief`, `ivan_finance_brief`, `ivan_memory_*`).
Les rôles OpenClaw ont `tools.deny` contenant `exec` ; un skill qui demande `node …`, `git …`
ou `curl …` y est chargé sans pouvoir être suivi.

| Rôle OpenClaw | Outils natifs | Skills expédiés | Inexécutables sans shell (avant) |
|---|---|---|---|
| main (chef) | ivan_route | orchestrateur-ia, rapport-telegram, passation-session | passation-session |
| ivan-business | ivan_business_brief | business-engine (adapté), veille-niches, recherche-sourcee, gros-document, rapport-telegram | — |
| ivan-finance | ivan_finance_brief | finance-engine (adapté), recherche-sourcee, rapport-telegram | — |
| ivan-engineering | — | usine-logicielle, dev-studio, design-original, revue-croisee, revue-securite-diff, passation-session | usine-logicielle, dev-studio, revue-croisee, passation-session |
| ivan-knowledge | ivan_memory_* | encyclopedie-anakalypto, verification-affirmations, recherche-sourcee, gros-document, memoire-obsidian (adapté), rapport-telegram | encyclopedie-anakalypto, verification-affirmations |
| ivan-system | ivan_memory_* | orchestrateur-ia, system-steward, memoire-obsidian (adapté), passation-session, rapport-telegram, revue-securite-diff | system-steward, passation-session |
| ivan-career | — | PAUSED, non expédié | — |

## Changements de cette branche (sources Claude seulement)

- `compatibility` (champ Agent Skills) sur 14 skills : `claude-code, codex` pour ceux qui
  exigent un shell ; `claude-code, codex, openclaw` pour business-engine, finance-engine,
  memoire-obsidian et passation-session, chacun avec une consigne « Sans shell (OpenClaw) ».
- Le registre refuse un skill qui contient une commande sans déclarer `compatibility`, ou qui
  se dit compatible OpenClaw sans repli sans shell ; `entry.compatibility` est exporté.
- Descriptions Career : « Career en pause depuis le 2026-10-05 - seulement sur demande
  explicite d'Ivan » en tête du déclencheur (les skills restent disponibles pour la reprise).
- `jev-decision` reste `brouillon` (PR #51) : passé `actif`, il aurait été expédié au chef
  OpenClaw qui ne peut pas appeler le gateway hors `ivan_route`.

## Demandes à Codex (fichiers runtime qu'il possède)

1. `isOpenClawSkillAvailable` : refuser un skill dont `compatibility` existe sans `openclaw`.
   Avec ce registre, Engineering n'aurait plus que design-original, revue-securite-diff étant
   aussi exclu ; Knowledge et System perdent les skills à scripts.
2. `createManagerPlan` ignore `manager.runtimes` : chaque rôle reçoit `runtime: "openclaw"`.
   `engineering.md` déclare `claude-code, codex` ; son agent OpenClaw sans exec ni dépôt ne
   peut pas construire ni relire. Proposer : ne créer l'agent natif que si `runtimes` contient
   `openclaw`, sinon le chef répond « tâche Engineering à confier à Claude Code/Codex ».
3. Garder la règle « pas d'exec » : ce lot n'en demande aucune.

## Déclenchements

Tous les skills actifs ont `evals.json` (3 positifs, 2 quasi-négatifs) sauf `jev-decision` et
`calibration-jev` (brouillons). Aucun test automatique ne mesure encore le déclenchement réel
dans OpenClaw ou Claude Code : c'est l'objet de K06 (jeu indépendant, sans appel payant
doublé avec les calibrations Codex).
