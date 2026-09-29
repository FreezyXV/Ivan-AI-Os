---
name: business-engine
description: Moteur d'opportunités d'Ivan (Opportunity Manager) - collecter des signaux publics de problèmes monétisables, les dédoublonner, mesurer leur récurrence, noter les opportunités sur preuves et les classer Cash (1er euro en 30 jours) ou Venture, puis livrer un top 3 actionnable. Utiliser pour toute veille business, recherche d'opportunités, d'arbitrages, de services ou de SaaS, "trouve-moi des opportunités", "cycle business", ou quand une alerte Sentinelle business arrive.
metadata:
  version: "1.0.0"
  famille: business
  manager: business
  risque: brouillon
  profil: "oui"
  statut: actif
  provenance: "Ivan-AI-Os, roadmap v1 section 11 (Business Engine), 2026-09-29"
---
# Business Engine

Mission : détecter des **preuves** de problèmes monétisables, pas produire « 10 idées de SaaS ».
Outil : `node skills/business-engine/scripts/signals.mjs` (registre privé hors Git).
Contrat complet : `workflows/business-engine.md`. Notation d'une idée isolée : skill `veille-niches`.

## Cycle (une fois par semaine, ou à la demande)
1. **Collecter** 15 à 40 signaux publics, une recherche par source :
   douleurs (Reddit, forums métier, avis 1–2★), demandes (« alternative à X », « je paierais »),
   offres (Product Hunt, Indie Hackers, annuaires, Malt/Upwork pour le Cash), tendances.
   Avantages d'Ivan : lire la section « Avantages distinctifs » de `profil.md`.
2. **Enregistrer** en JSONL (un signal par ligne) :
   `{"source","url","titre","sujet":"slug-du-probleme","type":"douleur|demande|offre|tendance","date":"AAAA-MM-JJ","extrait":"≤500 car.","preuve_paiement":true|false}`
   → `signals.mjs ajouter`. Les doublons (même URL ou même titre dans le sujet) sont ignorés.
3. **Prioriser** : `signals.mjs sujets --min 2` classe les sujets par nombre de **sources distinctes**.
   Ne creuser que les 3 à 5 premiers. (Tri Jev `signal.pertinent` dès que Codex l'ouvre.)
4. **Noter** chaque sujet creusé → `signals.mjs noter` avec 6 critères notés 0–5
   (`demande`, `paiement`, `concurrence` inversée, `fit`, `delai_mvp` inversé, `cout_acquisition`
   inversé), **une URL de preuve dès que la note dépasse 1**, `jours_premier_euro`, cible,
   douleur, monétisation, plan de validation 7 jours à 0 €.
   Règles codées : aucune preuve de paiement = abandon ; ≥ 22 lancer, ≥ 16 creuser.
5. **Livrer** : `signals.mjs rapport --top 3` → note `decision` via `memoire-obsidian`
   (sensibilité `interne`) + résumé Telegram via `rapport-telegram`.

## Règles
- Aucun chiffre de marché sans source ; aucune promesse de revenu.
- Données publiques uniquement dans les signaux ; rien sur les clients d'Ivan.
- Contacter un prospect, acheter un domaine ou un outil : GO d'Ivan (constitution).
- Idée retenue → `dev-studio` pour le MVP.
