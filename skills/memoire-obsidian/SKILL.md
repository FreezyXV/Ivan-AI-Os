---
name: memoire-obsidian
description: Mémoire durable des agents dans le coffre Obsidian d'Ivan - retrouver ce qui est déjà su avant de chercher, enregistrer un fait sourcé, une décision ou un compte rendu, sans jamais modifier les notes personnelles d'Ivan ni dupliquer. Utiliser dès qu'un résultat mérite d'être retenu, qu'Ivan dit "note ça", "retiens", "mets dans Obsidian", "qu'est-ce qu'on sait déjà sur", ou en fin de tâche de recherche, de veille ou de décision.
metadata:
  version: "1.0.0"
  famille: knowledge
  manager: knowledge
  risque: ecriture-depot
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os memory/README.md (couche Obsidian), coffre choisi par Ivan le 2026-09-29"
---
# Mémoire Obsidian

Outil : `node skills/memoire-obsidian/scripts/memoire.mjs <commande>` (dépôt Ivan-AI-Os).
Coffre : `$IVAN_OBSIDIAN_VAULT` ou `obsidian_vault` dans `~/.ivan-ai-os/config.json`.

## Règles
- **Écrire uniquement dans `Ivan AI OS/`** du coffre, et seulement via `ajouter` (jamais d'écrasement,
  jamais de lien). Les autres notes d'Ivan : lecture seulement, et seulement celles qu'il désigne.
- **Chaque note a ses sources** (URL, `[[note]]`, commit, fichier) et une **sensibilité** :
  `public`, `interne` ou `confidentiel` (clients, finances, santé, personnes).
- **Confidentiel** : jamais lu par OpenClaw ni envoyé à Jev. OpenClaw lit via `lister --max interne`.
- Connaissances et décisions arrivent en `inbox/` avec `statut: propose` ; Ivan valide. Un agent ne
  modifie jamais une note `valide` : il propose une nouvelle note qui la cite.
- Aucun identifiant, jeton ni clé (refusé par l'outil).

## Avant de chercher ou d'écrire
1. `lister --max <niveau autorisé>` puis lire les 1 à 3 notes pertinentes : ne pas refaire une
   recherche déjà faite (< 12 mois pour ce qui bouge).
2. Même titre déjà présent → `NOTE_EXISTS` : compléter par une note qui la cite, pas un doublon.

## Enregistrer
```bash
echo "<3 à 15 lignes : le fait, chiffres datés, limites>" | node skills/memoire-obsidian/scripts/memoire.mjs \
  ajouter --type connaissance --titre "<titre précis>" --source "<url ou [[note]]>" \
  --sensibilite interne --agent claude-code --confiance 0.8
```
Types : `connaissance` (fait vérifiable), `decision` (choix + justification + alternative
écartée), `journal` (compte rendu daté de fin de tâche, 10 lignes max).

## Consolidation (supervisée)
`verifier` signale les notes sans source, sensibilité ou statut. Doublons ou contradictions →
une note `decision` proposée qui les cite ; jamais de fusion silencieuse d'une note validée.

## Erreurs utiles
`VAULT_NOT_CONFIGURED` : définir le chemin. `VAULT_ACCESS_DENIED_BY_MACOS` : le coffre est dans un
dossier protégé (Documents, Bureau) → le déplacer (ex. `~/Obsidian/`) ou accorder l'accès au terminal.
