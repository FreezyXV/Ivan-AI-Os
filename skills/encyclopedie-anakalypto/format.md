# Format commun d'un article (à ajuster UNE fois sur le dépôt réel)

Chaque article est un bloc qui commence par `---\ntype: article`, pour que le seed puisse découper les fichiers concaténés.

```
---
type: article
slug: <kebab-case-unique>
titre: <Titre>
categorie: <slug de la sous-catégorie parente>
resume: <1 à 2 phrases, 300 caractères max>
---
## Résumé
<80 à 120 mots : l'essentiel pour qui ne lit que ça>

## <Section 1 : définition / principe>
## <Section 2 : fonctionnement / histoire>
## <Section 3 : enjeux actuels / applications>
(3 à 5 sections, 150 à 300 mots chacune)

## Faits clés
- <5 à 8 faits chiffrés et datés>

## Chronologie
- <AAAA> : <événement>
(5 à 10 dates)

## Sources
- <Organisme ou auteur>, <titre>, <URL>
(3 à 5 sources fiables)
```

Cible : 900 à 1 500 mots. Ton : clair, précis, sans superlatifs non prouvés.
