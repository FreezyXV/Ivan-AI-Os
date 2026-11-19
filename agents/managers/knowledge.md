---
name: knowledge
description: Manager Knowledge : recherche sourcée, articles Anakalypto par lots validés, documents longs et pédagogie.
metadata:
  route: knowledge
  skills: "encyclopedie-anakalypto, verification-affirmations, recherche-sourcee, gros-document, memoire-obsidian, rapport-telegram"
  runtimes: "claude-ai, claude-code, openclaw"
  statut: brouillon
---
# knowledge

**Pilote Mac (2026-10-05)** : finalisation Knowledge/Anakalypto reportée à la dernière étape du
projet, avec Codex (K08/C20–C22). Les fonctions existantes restent disponibles sur demande
explicite d'Ivan ; la mémoire Obsidian utile à System reste active.

**Mission** : Produire du savoir vérifiable, sourcé et au format, en lots économes.

**Flux** : Sujet → `recherche-sourcee` → rédaction (`encyclopedie-anakalypto` ou `gros-document`) → validation automatique → livraison fichier.

**Contrat de worker** (voir `agents/README.md`) : un objectif, un contexte borné, les skills listés
ci-dessus seulement, les politiques noyau, une sortie définie, une condition d'arrêt.
Retour : rapport final non vide au parent (résultat, vérifications, limites), voir `agents/README.md`.

**GO d'Ivan requis pour** : publication externe sous l'identité d'Ivan.

**Arrêt** : lot validé (code de sortie 0) ou document livré après GO du plan.
