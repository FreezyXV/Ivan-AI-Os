# Workflow — Alertes éditoriales Telegram (System)

Owner éditorial : Claude (skill `rapport-telegram` 2.1.0, `docs/ALERT-EDITORIAL-CONTRACT.md`).
Runtime, planning, activation et envoi : Codex (`services/alerts-runtime`, `ivan_alert_synthesize`).
**Actif (2026-10-07, décision d'Ivan)** : mode `native-editorial` avec seconde lecture
indépendante (`verifyNativeBrief=true`), worker `c613533`, plugin `8364b9f`, contexte public
`mac-alerts-20261006-v6`, digest seulement. **Jev ne trie plus les alertes** (zéro appel Jev dans
cette chaîne). Première vraie synthèse de ce mode : Next.js 16.4, reçu 62 (digest de qualification
déclenché manuellement). Les reçus 59/60 et le test B03/61 relèvent des modes précédents.

| # | Étape | Qui | Coût |
|---|---|---|---|
| 1 | Collecte Sentinelle/Secrétaire ; file SQLite commune ; dédoublonnage par URL canonique et par preuve | code | 0 |
| 2 | Lecture de la page ; extrait ≤ 1200 (tête ou passages, couverture `passages-v3`), dates, empreinte ; illisible → `review`, jamais résumé | code | 0 |
| 3 | Exclusions codées : sujets en pause ou reportés, ancien, dates futures, injection, rumeur courte non attribuée | code | 0 |
| 4 | Jugement et rédaction natifs isolés en **une** complétion : keep/review/skip, puis 1–3 faits par index de preuve, utilité, action, limite ; rumeur courte et correctif seulement annoncé retenus par code, sans modèle | complétion native | coût non exposé, ≈ 10–18 s |
| 5 | **Seconde lecture indépendante** (`alert-verification-v1`) : source + proposition seulement, sans conversation ni profil ; décision `approve/reject/review` et codes, sans texte ; reçu lié par empreinte au contenu exact ; `reject` pour seul `NOT_RELEVANT` → skip, sinon review | complétion native | ≈ 5–10 s |
| 6 | Contrôles codés : citation exacte, nombres **et identifiants** présents dans la propre citation, longueurs, limite si extrait partiel ; échec → `review` avec phase `COMPLETE`/`PARSE`/`VALIDATE` | code | 0 |
| 7 | Livraison : digest du soir ; immédiat uniquement par urgence codée contre un inventaire (non branché) ; reçu unique, jamais de renvoi à l'aveugle | code | 0 |
| 8 | Notation des vrais messages sur les 5 axes du contrat ; utile / inutile / trop vague par Ivan (`docs/MAC-PILOT-OPERATIONS.md`) ; nouveau jeu figé avant toute nouvelle politique | Claude, Ivan | rare |

Limites du passage (créneau durable de 5 min, jamais rejoué) : 4 complétions au plus, rédacteur et
relecteur compris ; aucune seconde rédaction après un refus de contenu ; une panne du fournisseur
arrête le passage dès le premier échec, un refus de contenu non. Anciennes abstentions Jev : un
nouveau jugement natif, une seule fois par contexte, deux au plus et seulement dans les places
laissées libres par les sources nouvelles ou interrompues. Deux modèles ne garantissent pas la
vérité : la qualification quotidienne reste la mesure d'Ivan.

Scores historiques (labels figés, **sélection Jev**, désormais retirée) : v5 avec la règle 0,75 →
6/14 utiles sur dev et 4/5 sur le benchmark, 0 bruit ; mode E → 3/5, 0 bruit. Ils ne qualifient ni
v6 ni le tri natif : aucune mesure figée du tri natif n'existe à ce jour.

Jamais : résumé depuis un titre, profil privé dans le contexte, conseil de transaction, contact
d'un tiers, action automatique, deux messages pour une source, notification Career pendant la pause.

## Demandes à Codex en cours
`docs/REVIEW-CLAUDE-V6-bf2d2e1.md` : identifiants à trait d'union (GPT-6), alias de sigles
traduits (IPCH/HICP), masquage des téléphones avec le motif du gateway, rumeurs « X is down ».
