# Workflow — Alertes éditoriales Telegram (System)

Owner éditorial : Claude (skill `rapport-telegram` 2.1.0, `docs/ALERT-EDITORIAL-CONTRACT.md`).
Runtime, planning, activation et envoi : Codex (`services/alerts-runtime`, `ivan_alert_synthesize`).
**Actif (2026-10-06)** : worker `bf2d2e1`, contexte public `mac-alerts-20261006-v6`, **mode E**,
digest seulement. Trois messages livrés depuis le début du pilote (reçus 59 et 60), aucun en v6.

| # | Étape | Qui | Coût |
|---|---|---|---|
| 1 | Collecte Sentinelle/Secrétaire ; file SQLite commune ; dédoublonnage par URL canonique et par preuve | code | 0 |
| 2 | Lecture de la page ; extrait ≤ 1200 (tête ou passages, couverture `passages-v3`), dates, empreinte ; illisible → `review`, jamais résumé | code | 0 |
| 3 | Exclusions codées : sujets en pause ou reportés, ancien, dates futures, injection, rumeur courte non attribuée | code | 0 |
| 4 | **Jev** `POST /v1/alerts/select`, question `alerts.pertinence.mac-v3`, projection publique avec contacts masqués ; `keep ≥ 0,75 / skip ≥ 0,75`, contradiction → review | Jev | ≈ 0,00006 € par appel |
| 5 | Pour un keep Jev seulement : jugement et rédaction natifs isolés (1–3 faits par index de preuve, utilité, action, limite) | complétion native | coût non exposé, ≈ 9 s en médiane |
| 6 | Contrôles codés : citation exacte, nombres **et identifiants** présents dans la propre citation, longueurs, limite si extrait partiel ; échec → `review` avec phase `COMPLETE`/`PARSE`/`VALIDATE` | code | 0 |
| 7 | Livraison : digest du soir ; immédiat uniquement par urgence codée contre un inventaire (non branché) ; reçu unique, jamais de renvoi à l'aveugle | code | 0 |
| 8 | Notation des vrais messages sur les 5 axes du contrat ; nouveau jeu figé avant toute nouvelle politique | Claude | rare |

Scores historiques (labels figés) : v5 avec la règle 0,75 → 6/14 utiles sur dev et 4/5 sur le
benchmark, 0 bruit ; mode E → 3/5, 0 bruit. **Ces scores ne qualifient pas v6** : aucune passe v6.

Jamais : résumé depuis un titre, profil privé dans le contexte, conseil de transaction, contact
d'un tiers, action automatique, deux messages pour une source, notification Career pendant la pause.

## Demandes à Codex en cours
`docs/REVIEW-CLAUDE-V6-bf2d2e1.md` : identifiants à trait d'union (GPT-6), alias de sigles
traduits (IPCH/HICP), masquage des téléphones avec le motif du gateway, rumeurs « X is down ».
