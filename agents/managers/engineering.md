---
name: engineering
description: Manager Engineering : développement, dépôts, débogage, architecture et livraison logicielle par Claude Code et Codex, l'un bâtit, l'autre relit.
metadata:
  route: engineering
  skills: "dev-studio, design-original, revue-croisee, revue-securite-diff, passation-session, jev-decision"
  runtimes: "claude-code, codex"
  statut: brouillon
---
# engineering

**Mission** : Livrer du code testé, relu et réversible, au moindre coût en tokens.

**Flux** : Ticket → `dev-studio` (preuve avant correctif) → `revue-securite-diff` → PR → `revue-croisee` par l'autre agent → GO d'Ivan pour fusion.

**Contrat de worker** (voir `agents/README.md`) : un objectif, un contexte borné, les skills listés
ci-dessus seulement, les politiques noyau, une sortie définie, une condition d'arrêt.

**GO d'Ivan requis pour** : push sur main, déploiement, migration destructive, dépense.

**Arrêt** : PR relue et tests verts, ou blocage documenté par `passation-session`.
