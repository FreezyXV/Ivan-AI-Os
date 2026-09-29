---
name: verification-affirmations
description: Vérification des faits par règles de preuve codées - registre d'affirmations (chiffres, dates, définitions, relations) liées à leurs sources, niveau de fiabilité des domaines, deux sources indépendantes pour tout chiffre ou date, détection des valeurs divergentes, section Faits clés et Sources générée à partir des seules affirmations confirmées, choix du visuel. Utiliser avant de publier un article Anakalypto, un document ou une recherche contenant des chiffres, dates ou affirmations factuelles, ou quand Ivan dit "vérifie", "fact-check", "c'est sûr ce chiffre ?".
metadata:
  version: "1.0.0"
  famille: knowledge
  manager: knowledge
  risque: lecture
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, roadmap v1 section 13 (Anakalypto Engine : claims, fact-check, evidence confidence, visual router), 2026-09-29"
---
# Vérification des affirmations

Outil : `node skills/verification-affirmations/scripts/affirmations.mjs verifier|faits|visuels <fichier>`.
Le code tranche « établi / à vérifier / contesté » : le LLM n'a pas à relire les sources pour décider.

## Registre (un fichier JSON par article, à côté du brouillon)
```json
{"version":1,"sujet":"slug","sources":[{"id":"insee","url":"https://…","titre":"…","auteur":"INSEE"}],
 "affirmations":[{"id":"pop","type":"chiffre","texte":"68,4 millions d'habitants (2024)",
   "preuves":[{"source":"insee","valeur":68.4},{"source":"wiki","valeur":68.4}],"serie":"population","lieu":"France"}]}
```
Types : `chiffre`, `date`, `definition`, `relation`, `contexte`. `valeur` = valeur lue dans la
source (sert à détecter les divergences) ; `serie` et `lieu` guident le choix du visuel.

## Règles codées
- Fiabilité du domaine : **A** institutions, statistiques officielles, universités, revues ;
  **B** encyclopédies, grande presse ; **C** le reste.
- **Chiffre / date** : 2 domaines indépendants dont au moins un A ou B.
- Autres types : une source A/B, ou deux domaines indépendants.
- Valeurs divergentes (> 2 % pour un nombre, toute différence sinon) → **contesté** : trancher avec
  une source primaire ou retirer l'affirmation.
- `verifier` sort en échec tant qu'une affirmation n'est pas confirmée (utilisable en CI).

## Procédure
1. Pendant la rédaction, noter chaque chiffre/date/définition dans le registre avec ses sources.
2. `verifier` → compléter les « à vérifier » (une recherche ciblée chacune) ou les retirer.
3. `faits` → coller « Faits clés » et « Sources » dans l'article (seulement le confirmé).
4. `visuels` → format recommandé (timeline, chart, chiffres clés, carte, diagramme, illustration),
   puis `design-original` pour le réaliser.
