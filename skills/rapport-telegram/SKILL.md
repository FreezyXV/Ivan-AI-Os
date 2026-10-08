---
name: rapport-telegram
description: Format court et actionnable pour tout message envoyé à Ivan sur Telegram (Secrétaire @secretaireivanbot, alertes Sentinelle, fin de tâche d'un agent) - une décision ou une info par message, lisible en 10 secondes sur mobile. Utiliser dès qu'une sortie est destinée à Telegram, qu'un agent doit notifier Ivan, résumer une veille, signaler une alerte ou demander un GO à distance.
metadata:
  version: "1.0.0"
  famille: system
  manager: system
  risque: brouillon
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, brainstorming skills Claude/Codex 2026-09-29"
---
# Rapport Telegram

## Gabarit (≤ 600 caractères, texte simple)
```
<emoji de statut> <Sujet en 6 mots max>
<Ce qui s'est passé ou ce qui est proposé, 1-2 phrases, chiffres datés.>
→ <Action attendue d'Ivan : "GO ?", "rien à faire", "choisir A/B">
<lien ou chemin du détail, si utile>
```
Statuts : ✅ fait · ⚠️ attention · ❌ échec · ❓ décision requise · 📌 info.

## Règles
- Une information ou une décision par message ; plusieurs sujets → plusieurs messages, le plus
  urgent d'abord, 3 messages maximum par envoi.
- Décision requise : options numérotées (1, 2) et recommandation, pour répondre d'un chiffre.
- Pas de tableau, pas de Markdown complexe, pas de bloc de code long : Telegram mobile.
- Détail long → fichier ou lien ; le message ne contient que la conclusion.
- Urgence réelle seulement (échec, échéance < 24 h, sécurité) pour ⚠️ ou ❌ ; sinon regrouper
  dans le prochain résumé.

## Interdits
- Aucune donnée client, finance personnelle, identifiant, jeton ni extrait de journal brut.
- Aucun message à un tiers : Telegram vers Ivan uniquement (constitution : contact tiers = GO).
- Pas de relance automatique d'une question sans réponse avant 24 h.
