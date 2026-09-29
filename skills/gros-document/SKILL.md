---
name: gros-document
description: Production de documents longs et rigoureux (rapport, CDC, audit, proposition commerciale, dossier, guide, article long, mémo stratégique) par plan validé puis rédaction section par section, sans jamais générer le document d'un bloc. Utiliser pour tout livrable de plus de ~2 pages ou dès qu'Ivan dit "rédige", "document", "rapport", "CDC", "cahier des charges", "audit", "proposition".
metadata:
  version: "1.1.0"
  famille: writing
  manager: knowledge
  risque: brouillon
  profil: "non"
  statut: actif
  provenance: "skill claude.ai d'Ivan gros-document v1, métadonnées Ivan-AI-Os 2026-09-29"
---
# Gros document

## Étapes
1. **Brief** (une seule fois, 5 points) : objectif, lecteur, décision attendue, longueur, format
   final (md, docx, pdf). Information critique manquante → UNE question.
2. **Plan** : titre, message clé en une phrase, sections numérotées avec pour chacune objectif,
   points clés, sources, budget de mots. **Montrer le plan à Ivan et attendre son GO.**
3. **Recherche** manquante → skill `recherche-sourcee`.
4. **Rédaction section par section** dans un seul fichier de travail : écrire une section, la
   relire contre son objectif, passer à la suivante. Intro et conclusion en dernier.
5. **Relecture critique** (checklist ci-dessous), puis corrections par remplacements ciblés.
6. **Export** au format demandé avec le skill de format adapté (docx, pdf, pptx).

## Checklist de relecture
- Chaque section répond à son objectif et respecte son budget (±10 %).
- Aucune affirmation factuelle sans source ; sinon [À VÉRIFIER].
- Pas de redite entre sections, transitions logiques.
- Chiffres cohérents d'une section à l'autre.
- Zéro remplissage ("Dans un monde en constante évolution", "Il est important de noter").

## Économie de tokens
- Modifier une partie = remplacement ciblé, jamais réécriture complète.
- Ne pas recopier le document dans le chat : donner le fichier + un résumé de 3 lignes.
- Document destiné à un tiers : Ivan l'envoie lui-même.
