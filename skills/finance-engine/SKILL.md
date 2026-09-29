---
name: finance-engine
description: Veille finance publique automatique d'Ivan (Finance Manager) - taux BCE, inflation zone euro, EUR/USD, taux US 10 ans, Bitcoin et Ether - collectée par script sans LLM, avec instantanés datés, alertes par seuils et bref sourcé. Utiliser pour "veille finance", "brief marché", "quoi de neuf côté taux / crypto / macro", avant une revue de placements, ou pour préparer le bref finance Telegram. Pour confronter à la stratégie personnelle d'Ivan : skill veille-investissements.
metadata:
  version: "1.1.0"
  famille: finance
  manager: finance
  risque: lecture
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, roadmap v1 section 12 (Finance Engine), veille publique, 2026-09-29"
---
# Finance Engine — veille publique

Outil : `node skills/finance-engine/scripts/veille.mjs collecter | alertes | rapport`.
Contrat : `workflows/finance-engine.md`. Aucun LLM pour collecter : 0 token.

## Procédure
1. `collecter` : BCE (taux de dépôt, inflation, sous-jacente, EUR/USD), FRED (US 10 ans),
   Kraken (BTC, ETH, variations 7 et 30 jours). Instantané privé daté ; une source en panne
   n'arrête pas les autres.
2. `alertes` : comparaison au relevé précédent. Important : changement du taux BCE, crypto
   ±10 % sur 7 jours, EUR/USD ±2 %. Info : nouvelle inflation, donnée ancienne, source en panne.
3. `rapport` : bref Markdown sourcé. Ne lire que la section « À surveiller » si rien n'a bougé.
4. `rapport --jev` : Jev (`alerte.importante`) reclasse en note les variations de routine ; si Jev
   ne répond pas, l'alerte reste importante (on ne masque jamais une alerte).
5. Analyse LLM **seulement** si une alerte « important » existe : expliquer en 3 lignes, sources
   primaires (BCE, AMF, Banque de France) ; confronter au cadre d'Ivan via `veille-investissements`.
6. Livrer : `rapport-telegram` (une info par message) ; note `journal` via `memoire-obsidian`.

## Règles
- Données publiques uniquement : aucun montant, position ni objectif d'Ivan ici.
- Donnée signalée « ancienne » : le dire, ne pas la présenter comme actuelle.
- Information, jamais un conseil ni une transaction (constitution : GO humain obligatoire).
