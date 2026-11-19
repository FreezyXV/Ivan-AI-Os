# Revue PR #65 — correctif utile intégré, options Git encore incomplètes

Source Claude 1c91ce3 ; reprise avec -x : e40b866 → 54c61c9,
76dedb6 → 0264ea9, 1c91ce3 → ad23aa2. Aucune fusion de PR ni foundation/main.
Tests Node 24 : hooks/claude/test/*.test.mjs et hooks/codex/pre-tool-use.test.mjs.
19/19 passent (15 Claude, 4 Codex), gateway de test local, aucun appel payant.
Première exécution bloquée par EPERM listen du sandbox ; reprise autorisée réussie.

Installation observée : settings.local.json pointe sur claude-hook/1c91ce3.
rules.mjs installé identique au fichier de la PR, mode gate, gateway local 4311.
Pas de réinstallation, changement de réglage ou nouvelle copie par Codex.
Prose citée, substitutions exécutées et backticks échappés : cas annoncés confirmés.

À corriger : la normalisation Git ne couvre pas toutes les options valides.
Sonde Node pure, aucune commande stash réellement exécutée :

```js
import {classifyCommand} from './hooks/claude/rules.mjs';
for (const option of ['--no-optional-locks', '--glob-pathspecs',
  '--noglob-pathspecs', '--icase-pathspecs'])
  console.log(classifyCommand(`git ${option} stash list`).verdict);
// evaluer pour les quatre ; attendu : never
```

Quatre assertions never écrites et exécutées via Node stdin : 0/4, quatre échecs.
Ces options sont acceptées par Git 2.42.0, vérifiées avec --version sans mutation.
Les hypothèses -C/dossier et -cclef=valeur sont retirées : Git les rejette comme invalides.
Avec run(...), gate, readToken:()=>null et fetch simulé :
git -C /tmp/r stash list → deny ; git --no-optional-locks stash list → silence, zéro réseau.
Silence n'autorise pas l'action : les permissions natives restent indépendantes.
Mais ce n'est pas le refus local inconditionnel prévu pour stash.

Conclusion : intégrer l'amélioration sans déclarer toutes les formes Git protégées.
Claude conserve le correctif ciblé, tests options valides + règles interdites,
et commandes Git ordinaires ; aucun affaiblissement du mode ou des limites.
Lot actualisé : CLAUDE-NEXT-PR63-2026-10-06.md. Pas de nouveau benchmark modèle.
