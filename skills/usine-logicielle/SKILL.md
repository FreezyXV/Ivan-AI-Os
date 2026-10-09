---
name: usine-logicielle
description: Usine logicielle d'Ivan AI OS (Engineering Manager) - découper une tâche de code, choisir qui construit entre Claude Code et Codex selon le propriétaire des fichiers puis les résultats mesurés sur les PR relues, faire relire par l'autre agent, classer les constats, repasser en cas de désaccord et enregistrer le résultat pour améliorer le routage. Utiliser pour toute tâche de code qui mérite une PR, "qui doit coder ça ?", "Claude ou Codex ?", "bilan de l'usine", ou après la fusion d'une PR pour enregistrer son issue.
compatibility: "claude-code, codex"
metadata:
  version: "1.0.0"
  famille: engineering
  manager: engineering
  risque: ecriture-depot
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, roadmap v1 section 14 (Claude Code ↔ Codex adversaires constructifs), historique réel des PR #2 à #21, 2026-09-29"
---
# Usine logicielle

Outil : `node skills/usine-logicielle/scripts/usine.mjs recommander|enregistrer|tableau`.
Historique réel : [historique.jsonl](historique.jsonl) ; nouveaux résultats : registre privé.

## Cycle
1. **Découper** (`dev-studio`) : tickets ≤ 1 h, une catégorie chacun (`frontend`, `backend`,
   `securite`, `infra`, `integration`, `tests`, `outillage`, `architecture`, `debug`, `docs`, `data`).
2. **Choisir le constructeur** : `recommander <categorie> [--proprietaire claude|codex]`.
   Ordre : propriétaire des fichiers (périmètres convenus) → taux mesuré (≥ 3 PR relues chacun,
   lissage) → a priori de la roadmap → alternance pour mesurer.
3. **Construire** sur `agent/<nom>/<sujet>`, test qui échoue avant le correctif.
4. **Relire** par l'autre agent : `revue-croisee` + `revue-securite-diff` ; constats classés
   bloquant / à corriger / remarque, chacun prouvé.
5. **Désaccord** : second passage ciblé sur le constat contesté, preuve à l'appui ; le pilote du
   plan tranche, Ivan en dernier.
6. **Fusion** : GO d'Ivan.
7. **Enregistrer** : `echo '{"pr":N,"date":"AAAA-MM-JJ","categorie":"…","constructeur":"…","relecteur":"…","resultat":"accepte|corrige|rejete","bloquants":N,"note":"…"}' | usine.mjs enregistrer`.
   « accepte » = aucun constat bloquant. Honnêteté : un défaut trouvé compte, même s'il est corrigé.

## Lecture des chiffres
Échantillons petits au début : la recommandation dit « a priori » ou « alternance » tant qu'elle
ne mesure pas. Relecture croisée = chaque agent note l'autre : garder les constats prouvés.
