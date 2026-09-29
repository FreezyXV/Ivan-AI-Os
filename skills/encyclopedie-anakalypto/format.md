# Format v2 — fiche Anakalypto courte, visuelle, interactive (2026-09-29)

Décision d'Ivan : beaucoup de sujets, peu de lecture (≤ 2 min), l'accent sur le visuel et
l'interactif. Chaque fiche est un bloc qui commence par `---\ntype: article`.

````
---
type: article
slug: <kebab-case-unique>
titre: <Titre court>
categorie: <slug de la sous-catégorie>
resume: <1 phrase, 200 caractères max>
accroche: <question ou fait surprenant, 160 caractères max>
---
## L'essentiel
- <3 à 5 puces, 25 mots max chacune, une idée par puce>

## En images
```anakalypto-visuel
{"type": "timeline|chart|map|diagramme|quiz|comparateur|curseur|chiffres-cles",
 "titre": "<ce que le visuel montre>",
 "donnees": [<points issus des seules affirmations confirmées>]}
```

## Pour aller plus loin
<un paragraphe, 120 mots max>

## Faits clés
- <3 à 6 faits datés, générés par `affirmations.mjs faits`>

## Sources
- <Organisme ou auteur>, <titre>, <URL> (3 minimum)
````

Texte hors bloc visuel : 150 à 450 mots. Quiz : 3 questions minimum, chacune avec `question`,
`choix` (2 à 4) et `bonne` (index de la bonne réponse). Ton : clair, concret, sans superlatif non
prouvé ; un chiffre surprenant vaut mieux qu'un adjectif.

Publication : fichier voisin `<lot>.jev.json` obligatoire, avec pour chaque slug la décision Jev
`publication.prete` (≥ 0,7) et son `request_id`. Sans Jev, le lot n'est pas publiable.
