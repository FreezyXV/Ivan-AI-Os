---
name: design-original
description: Direction artistique pour des designs distinctifs, jamais génériques (UI, landing page, site vitrine, dashboard, app, slides, visuels, artefacts HTML/React). Utiliser SYSTÉMATIQUEMENT dès qu'il y a du HTML/CSS/React visuel, une maquette, une page, un composant ou une présentation, même si Ivan ne parle pas de design.
metadata:
  version: "1.1.0"
  famille: design
  manager: engineering
  risque: brouillon
  profil: "non"
  statut: actif
  provenance: "skill claude.ai d'Ivan design-original v1, métadonnées Ivan-AI-Os 2026-09-29"
---
# Design original

## Processus
1. **Ancrer dans le sujet** : lister 10 éléments concrets de l'univers du sujet (matériaux, outils,
   gestes, lieux, jargon, objets). Ex. quincaillerie : métal brossé, étiquettes de rayon, calibres,
   quadrillage de catalogue. C'est la seule source légitime des choix visuels.
2. **Trois directions contrastées**, chacune nommée et décrite en 2 lignes (palette, typo, structure,
   geste signature). Au moins une tirée de [directions.md](directions.md). En choisir une et
   justifier en une phrase.
3. **Tokens avant le code** : 4–6 couleurs tirées du sujet (hex), 1–2 familles typographiques
   distinctes, échelle typo, espacements, rayons différenciés.
4. **Construire** avec le vrai contenu du brief, jamais de lorem ipsum.
5. **Critiquer** avec la checklist ; corriger chaque point coché avant de livrer.
6. **Vérifier en vrai** quand un navigateur est disponible : rendu mobile et desktop, console sans
   erreur, contraste AA mesuré.

## Checklist anti-cliché (point coché = à corriger)
- [ ] Fond crème + serif + accent terracotta
- [ ] Fond noir + un seul accent vert acide ou vermillon
- [ ] Mise en page "journal" (filets fins, zéro arrondi, colonnes denses) sans raison
- [ ] Kit SaaS : cartes arrondies identiques, même ombre partout, dégradés décoratifs
- [ ] Petit label en MAJUSCULES espacées au-dessus de chaque titre
- [ ] Un seul mot du titre en couleur ou italique
- [ ] Numérotation 01/02/03 sur un contenu qui n'est pas une séquence
- [ ] Hero "gros chiffre + petit libellé + dégradé"
- [ ] Animation fade/slide-up sur chaque section, hover sur chaque carte
- [ ] Polices par défaut : Inter, Roboto, Arial, system-ui, Poppins, Montserrat, Open Sans
- [ ] Emojis en guise d'icônes
- [ ] Textes génériques ("Boostez votre productivité", "Solution innovante")

## Règles
- Lignes < 80 caractères, contraste AA, mobile d'abord.
- Une seule animation orchestrée au maximum.
- La structure visuelle porte de l'information, elle ne décore pas.
