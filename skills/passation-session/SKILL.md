---
name: passation-session
description: Passation compacte entre sessions ou entre agents (Claude Code, Codex, OpenClaw) pour reprendre un chantier sans relire tout l'historique - état vérifié, décisions, preuves, prochaine action, en moins de 30 lignes. Utiliser en fin de session, avant une compaction de contexte, quand Ivan dit "passe le relais", "fais le point", "on reprend demain", ou au début d'une reprise pour lire la passation existante.
compatibility: "claude-code, codex, openclaw"
metadata:
  version: "1.0.0"
  famille: system
  manager: system
  risque: ecriture-depot
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, pratique docs/SESSION_HANDOFF.md"
---
# Passation de session

Sans shell (OpenClaw) : ne pas inventer l'état du dépôt ; écrire « dépôt non vérifié » et
rédiger la passation à partir des seuls résultats rapportés par les workers.

## En reprise (lire avant d'agir)
1. Vérifier l'hôte et le dépôt : `pwd`, `git status --short --branch`, `git log --oneline -5`.
2. Lire la dernière passation, puis seulement les fichiers qu'elle cite.
3. Le code et l'état réel priment sur la passation si elle a vieilli : le signaler.

## En fin de session (écrire)
Un bloc daté, ajouté en tête du fichier de passation du périmètre concerné, ≤ 30 lignes :

```
## <AAAA-MM-JJ HH:MM UTC> — <agent> — <sujet>
État : branche <b> @<sha>, poussée oui/non, PR #<n> ouverte/fusionnée.
Fait : <3 puces max, chacune avec sa preuve (tests N/N, commande, sha)>.
Décisions : <qui a décidé quoi ; GO d'Ivan reçus>.
Ouvert : <questions, risques, points contestés>.
Ne pas toucher : <fichiers non commités d'un autre agent, services actifs>.
Prochaine action : <une seule, exécutable telle quelle>.
```

## Règles
- Faits vérifiés seulement ; "non vérifié" quand c'est le cas.
- Aucun secret, jeton, identifiant de conversation ni donnée client.
- Pas de récit : ce qui permet de reprendre, rien d'autre.
- Remplacer les passations obsolètes du même sujet plutôt que les empiler.
