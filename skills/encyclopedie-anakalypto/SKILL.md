---
name: encyclopedie-anakalypto
description: Rédaction d'articles d'encyclopédie au format commun strict d'Anakalypto (résumé, sections, faits clés, chronologie, sources), en lots, avec recherche sourcée et validation automatique du format. Utiliser dès qu'Ivan parle d'Anakalypto, d'articles d'encyclopédie, de sous-catégories restantes, d'un "nouveau lot" ou d'une fiche de connaissance, même sans citer le skill.
metadata:
  version: "1.1.0"
  famille: knowledge
  manager: knowledge
  risque: brouillon
  profil: "non"
  statut: actif
  provenance: "skill claude.ai d'Ivan encyclopedie-anakalypto v1, tests ajoutés Ivan-AI-Os 2026-09-29"
---
# Encyclopédie Anakalypto

## Format
Suivre EXACTEMENT [format.md](format.md) (frontmatter + sections). Chaque article est un bloc qui
commence par `---\ntype: article` pour que le seed du dépôt puisse découper les fichiers
concaténés. Si Ivan fournit un article existant, aligner d'abord les clés et les titres de section.

## Méthode par lot (5 à 10 articles en chat, 10 à 15 en Claude Code)
1. **Lister** les sous-catégories à traiter (fournies par Ivan ou tirées de `categories.md`).
2. **Pour chaque article, dans l'ordre** :
   - 3 à 5 recherches courtes, sources fiables (institutions, encyclopédies, publications,
     organismes officiels) ;
   - rédaction complète au format, 900 à 1 500 mots, faits vérifiables, chiffres datés ;
   - fait incertain → l'omettre, jamais l'inventer.
3. **Assembler** les blocs dans un seul fichier `articles-batch-N.md`.
4. **Valider** : `python3 scripts/valider_lot.py <fichier>` ; corriger uniquement les erreurs
   signalées. Code de sortie 0 = lot conforme.
5. **Livrer** le fichier complet + 3 lignes : nombre d'articles, sous-catégories restantes,
   points à vérifier.

## Économie de tokens
- Pas de rapport intermédiaire entre deux articles.
- Ne pas réafficher les articles dans le chat : livrer le fichier.
- Un lot par conversation ; nouvelle conversation pour le lot suivant.
- En Claude Code, un lot peut être confié à un sous-agent par tranche de 5 articles, puis validé
  en une seule passe.
