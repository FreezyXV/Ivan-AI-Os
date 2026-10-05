---
name: finance-engine
description: Veille finance publique automatique d'Ivan (Finance Manager) - taux BCE, inflation zone euro, EUR/USD, taux US 10 ans, Bitcoin et Ether - collectée par script sans LLM, avec instantanés datés, alertes par seuils et bref sourcé. Utiliser pour "veille finance", "brief marché", "quoi de neuf côté taux / crypto / macro", avant une revue de placements, ou pour préparer le bref finance Telegram. Pour confronter à la stratégie personnelle d'Ivan : skill veille-investissements.
compatibility: "claude-code, codex, openclaw"
metadata:
  version: "1.2.0"
  famille: finance
  manager: finance
  risque: lecture
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, roadmap v1 section 12 (Finance Engine), veille publique, 2026-09-29"
---
# Finance Engine — veille publique

Sans shell (OpenClaw) : ne pas lancer les scripts ; lire le dernier relevé public avec
`ivan_finance_brief` (adaptateur Codex), dates visibles, aucune donnée personnelle.

Outil : `node skills/finance-engine/scripts/veille.mjs collecter | alertes | rapport`.
Contrat : `workflows/finance-engine.md`. Aucun LLM pour collecter : 0 token.

## Procédure
1. `collecter` : BCE (taux de dépôt, inflation HICP et sous-jacente, EUR/USD), FRED (US 10 ans),
   Kraken (BTC, ETH, variations 7 et 30 jours sur bougies closes). Instantané privé daté ; une source en panne
   n'arrête pas les autres.
2. `alertes` : comparaison au relevé précédent. Important : changement du taux BCE, crypto
   ±10 % sur 7 jours, EUR/USD ±2 %. Info : nouvelle inflation, donnée ancienne, source en panne.
3. `rapport` : bref Markdown sourcé. Ne lire que la section « À surveiller » si rien n'a bougé.
4. `rapport --jev` : Jev (`alerte.importante`) reclasse en note les variations de routine ; si Jev
   ne répond pas, l'alerte reste importante (on ne masque jamais une alerte).
5. Analyse LLM **seulement** si une alerte « important » existe : expliquer en 3 lignes, sources
   primaires (BCE, AMF, Banque de France) ; confronter au cadre d'Ivan via `veille-investissements`.
6. Livrer : synthèse `rapport-telegram` forme A (contrat `alert-editorial-v1`) pour une alerte
   « important », digest du soir pour les notes ; note `journal` via `memoire-obsidian`.

## Synthèse pour Ivan
- **Fait** : indicateur, valeur, date d'observation (« Relevé le » ≠ date de publication),
  valeur précédente si connue, source primaire. Tout chiffre vient du relevé.
- **Lecture** (déduction, annoncée comme telle) : ce que le mouvement signifie pour la veille
  publique (écart à la cible de 2 %, taux réels, écart totale/sous-jacente). Un écart entre
  inflation totale et sous-jacente ne prouve pas à lui seul la part de l'énergie : l'attribuer
  seulement avec une décomposition par poste ou une source qui l'affirme (citée). Une opinion de la BCE
  est attribuée (« selon Schnabel »), jamais présentée comme une décision.
- **Action** : « Rien à faire maintenant » par défaut ; sinon une observation datée à refaire.
  Jamais d'achat, de vente ni d'allocation ; la confrontation au cadre personnel se fait en local
  avec `veille-investissements`, à la demande d'Ivan.
- **Limites** : retard des séries mensuelles, relevé unique, source en panne, volatilité crypto.

## Règles
- Données publiques uniquement : aucun montant, position ni objectif d'Ivan ici.
- Donnée signalée « ancienne » : le dire, ne pas la présenter comme actuelle.
- Information, jamais un conseil ni une transaction (constitution : GO humain obligatoire).
