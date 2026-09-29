---
name: veille-investissements
description: Veille des évolutions et opportunités d'investissement (taux réglementés, ETF éligibles PEA, frais, fonds euros, SCPI, or, BCE, fiscalité France et Luxembourg) confrontée à la stratégie long terme d'Ivan. Utiliser pour "veille invest", "revue finance", "opportunité d'investissement", "qu'est-ce qui a changé côté placements", ou quand Ivan transfère une alerte Sentinelle finance.
metadata:
  version: "1.2.0"
  famille: finance
  manager: finance
  risque: lecture
  profil: "oui"
  statut: actif
  provenance: "skill claude.ai d'Ivan veille-investissements v1, cadre externalisé Ivan-AI-Os 2026-09-29"
---
# Veille investissements

## Principe
Le cadre d'Ivan prime : lire la section « Cadre d'investissement » de `profil.md` (profil privé :
à côté de ce fichier une fois empaqueté, sinon `~/.ivan-ai-os/profil.md`). Absent → demander le cadre à Ivan avant toute recommandation. Une
"opportunité" qui contredit le cadre est classée HORS CADRE, jamais recommandée.

## 1. Collecter (une recherche par thème)
1. Taux Livret A / LDDS et prochaines révisions.
2. ETF éligibles PEA : nouveautés, frais, fusions, fermetures (dont ceux détenus).
3. Assurance-vie : taux des fonds euros, bonus.
4. SCPI : taux de distribution, décotes, collecte, alertes de liquidité.
5. Or, taux BCE, inflation zone euro.
6. Fiscalité : sujets suivis listés dans le profil.
Sources prioritaires : Banque de France, AMF, BCE, service-public.fr, impots.gouv.fr, guichet.lu,
ASPIM, émetteurs d'ETF, justETF.

## 1 bis. Dérive et versement (calcul, 0 token)
Allocation privée : `~/.ivan-ai-os/finance/allocation.json` (jamais Git, OpenClaw ni Jev).
`node skills/finance-engine/scripts/dca.mjs derive` : écart réel/cible en points (bande ±5 pts).
`node skills/finance-engine/scripts/dca.mjs repartir [montant] --valeur <total>` : répartition
(versement mensuel par défaut ; sans `--valeur`, répartition selon les pourcentages cibles —
règle d'Ivan ; avec `--valeur`, rééquilibrage sans vente)
**sans vente** du prochain versement (combler les écarts, puis suivre la cible). Proposition seulement.

## 2. Livrer (dans le chat)
- **À FAIRE** (3 maximum) : action concrète, compatible avec le cadre, appuyée par 2 sources
  indépendantes.
- **À SURVEILLER** : changements à venir.
- **HORS CADRE** (3 maximum) : avec leurs risques, pour information seulement.
- Sources.
- Une ligne finale : information, pas un conseil en investissement ; la décision revient à Ivan.

## Interdits
Market timing, levier, cryptos hors allocation prévue, "opportunité" sans source primaire,
promesse de rendement, toute transaction (constitution : GO humain obligatoire).
Montants et positions d'Ivan : jamais dans une requête web ni envoyés à Jev.
