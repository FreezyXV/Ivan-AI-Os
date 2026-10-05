# Benchmark d'architecture — où mettre code, Jev, LLM et humain (Claude, 2026-10-05)

**Code examiné** : `agent/codex/alerts-integration` @`f9b502f`. **Runtime actif observé** (diagnostic
en lecture seule, non relu) : worker `a604aa6`, question Jev v3, politique de sélection
`keep ≥ 0,20 / skip ≥ 0,25` (`coordinated-activation.json`), 0 synthèse générée à ce jour,
715 appels Jev ce mois (0,027 €). Aucun appel payant n'a été fait pour ce rapport : il s'appuie sur
les passes déjà enregistrées (`~/.ivan-ai-os/mac-alerts-f9b502f/`) et sur des évaluations hors
ligne. Le nouveau benchmark est prêt pour **une** passe coordonnée par Codex (§ 6).

## 1. Ce que disent les mesures existantes (labels figés avant mesure)

Jeu `dev` = calibration-jev-v1 (83 cas réels, lecteur de production ; 14 keep, 11 review, 58 skip).

| Architecture / politique | Keep retrouvés | Bruit retenu | Utiles écartés | Abstention | Exact |
|---|---|---|---|---|---|
| A. Règles seules (écrites sur dev) | 8/14 | **9** | 6 | 1 % | 75 % |
| B. Jev v3, règle 0,75 | 0/14 | 0 | 0 | 88 % | 25 % |
| B. Jev v3, **0,20/0,25 (actif)** | 2/14 | 0–1¹ | 0 | 71 % | 40–42 % |
| B. Jev v3, P(keep) ≥ 0,30 / P(skip) ≥ 0,30 | 5/14 | 1 | 1 | 51 % | 57 % |
| B. Jev v4 candidat, règle 0,75 | 9/14 | 3 | 0 | 65 % | 42 % |
| B. **Jev v5 candidat, règle 0,75** | **6/14** | **0** | **0** | 58 % | 55 % |
| B. Jev v5, politique enregistrée P(keep) ≥ 0,10 / P(skip) ≥ 0,20 | 14/14 | **25** | 0 | 1 % | 66 % |
| B. Jev v5, brut (confiance ignorée) | 10/14 | 6 | 2 | 11 % | 78 % |

¹ Deux passes v3 du même jour sur les mêmes entrées diffèrent sur 3 cas sur 94 : 0 faux keep dans
la passe Claude, 1 dans la passe Codex. Jev est **presque** stable, pas parfaitement.

Contrôle v2 (12 cas, déjà mesuré par Codex avec v5 + P(keep) ≥ 0,10) : 11/12, mais 7 cas sont
tranchés par le code et les deux keep sont synthétiques et faciles. Ce n'est pas une validation de
cette politique. Le seul désaccord, V12 (alerte Telegram conditionnelle, labellisée review), est
passé en keep à P(keep) = 0,94 : **désaccord maintenu**. Sans inventaire, ce cas ne peut être
qu'un digest prudent, jamais une urgence.

**Conclusion chiffrée** : la politique v5 enregistrée maximise le rappel en retenant 25 cas de
bruit sur 69 non-keep : elle ne doit pas être activée. À zéro bruit observé, le meilleur point
mesuré est **v5 + règle 0,75** (6/14 keep), trois fois mieux que la politique active (2/14).

## 2. Nouveau benchmark (`skills/rapport-telegram/benchmark/architecture-v1/`)

26 cas, labels figés avant toute mesure (empreinte `71ee9caf…`), disjoints de tous les corpus
mesurés (vérifié par test). 21 réels lus par le lecteur de production, avec une collecte simulée à
`publishedAt + 2 h` pour neutraliser la fraîcheur (tranchée par le code dans toutes les
architectures). 5 synthétiques. On y trouve : 4 utiles (digest), 1 urgence conditionnée à
l'inventaire, 4 plausibles mais insuffisants, 2 extraits incomplets, 11 bruits, 2 sujets
différés, 1 injection, 1 titre seul. Plus 6 demandes de routage (dont des demandes mixtes) et
3 pannes à injecter.

Première mesure, **A (règles seules, figées sur dev avant ce jeu)** : 3/5 keep, 2 bruits retenus
(A08 coût isolé, A10 annonce sans détails), 2 utiles écartés (A03/A04 : enseignements AGENTS.md
qu'aucune règle lexicale ne voit), urgence 0/1, 73 % d'exacts, 0 appel, ≈ 0 ms.
B, C et D restent à mesurer (§ 6).

## 3. Les quatre architectures

| | A. Règles | B. Règles + Jev | C. Règles + 1 LLM juge-rédacteur | D. Ciblée |
|---|---|---|---|---|
| Appels par élément lu | 0 | 1 Jev | 1 LLM | 1 Jev, puis 1 LLM seulement si Jev n'écarte pas |
| Dépendances | aucune | gateway + TypeSafe | OpenClaw + modèle | les deux, mais LLM sur une fraction |
| Point fort mesuré | exclusions sûres, 0 coût | `skip` très fiable (v3 : 24/24 corrects) | non mesuré | combine le filtre fiable et le jugement riche |
| Point faible mesuré | sémantique (A03/A04), 9 bruits sur dev | `review` qui absorbe tout, sensible à la politique | coût et latence non exposés, juge et rédacteur confondus | deux fournisseurs ; à mesurer |
| Panne d'un fournisseur | sans effet | review + un seul nouvel essai | review | Jev en panne : passage au LLM borné ; LLM en panne : review |

Sélectionner une information ne vaut jamais autorisation d'agir. Dans les quatre cas, l'action
reste une proposition, et l'urgence immédiate est décidée par le code contre un inventaire local.

## 4. Recommandation par tâche

| Tâche | Recommandé | Pourquoi (preuve) |
|---|---|---|
| Exclusions (différé, non lu, ancien, injection, doublon) | **Code** | déterministe, 0 coût ; 7/7 et 6/6 corrects hors ligne |
| Routage vers un manager | **Code (table)** | table 19/19 contre Jev 17/19 avec 53 % de REVIEW (calibration du 29 septembre) |
| Écarter le bruit d'un flux | **Jev** (côté `skip`) | v3 : 24/24 skip corrects ; v5 à 0,75 : 0 faux keep |
| Retenir une information utile | **Jev v5 à 0,75**, puis **LLM** sur le reste | Jev seul plafonne à 6/14 ; jugement LLM non mesuré (§ 6) |
| Urgence immédiate | **Code + inventaire**, jamais un modèle | V12 : P(keep) = 0,94 pour un cas conditionnel |
| Rédaction de la synthèse | **LLM** (une complétion isolée) | fidélité 2/2 sur 8 sorties ; utilité 1,25/2 avant les consignes K06 |
| Vérification de la synthèse | **Code** (citations, chiffres) + **humain** par échantillon | le code a laissé passer une erreur de fidélité dans mon propre exemple C1 |
| Business : signal pertinent | **Non qualifié** : code + revue humaine du top 3 | aucune mesure Jev `signal.pertinent` sur un jeu figé |
| Finance : importance d'un mouvement | **Code** (seuils) ; Jev seulement pour déclasser, après mesure | `alerte.importante` jamais évalué sur un jeu étiqueté |
| Avis sur un outil (hook) | **Code** (niveau 0) + **humain** pour les garde-fous ; Jev en audit | décision PR #49 |
| Reprise après panne, réservations, reçus | **Code** uniquement | idempotence et baux SQLite testés |
| Action externe, dépense, publication | **Humain** | constitution |

## 5. Jev : qualifié, non qualifié, inutile

| Usage | Statut | Condition |
|---|---|---|
| Écarter le bruit (`skip`) dans la veille | **Qualifié** | v3/v5, labels figés ; garder une repasse mensuelle |
| Retenir (`keep`) dans la veille | **Qualifié partiellement** | seulement v5 + 0,75 ; rappel 6/14 ; jamais la politique P(keep) ≥ 0,10 |
| Routage | **Non qualifié** | une table fait mieux |
| `signal.pertinent`, `preuve.suffisante`, `alerte.importante`, `source.fiable`, `sujet.*`, `publication.prete` | **Non qualifiés** | aucun jeu figé mesuré ; à évaluer avant d'en dépendre |
| Urgence, autorisation, reprise, dédoublonnage | **Inutile** | code déterministe suffisant ou obligatoire |

## 6. Passe coordonnée proposée (Codex, une fois, aucune mesure concurrente)

Entrées : `benchmark/architecture-v1/fixtures.jsonl` (22 cas atteignent un fournisseur après les
exclusions codées).
- **B** : sélection Jev **v3 active** et **v5 + règle 0,75** → 44 appels Jev au plus.
- **C** : une complétion isolée par cas, avec un prompt « juge puis rédige » :
  `{"useful":true|false,"why":"…","brief":{…} seulement si useful}`, avec les consignes K06 et le
  contrat `alert-editorial-v1` → 22 complétions.
- **D** : dérivée des sorties v5 (skip → écarté) et de C sur les cas restants ; aucun appel en plus.
- **Pannes** P01–P03 : injection par le banc de test, sans appel réel.
- **Routage** R01–R06 : table contre `/v1/route` → 6 appels.

Sorties au format de `benchmark-architecture.mjs score` (`decision`, `delivery`, `ms`, `calls`,
`error`) ; la prose des keep est notée sur les 5 axes du contrat. Coût : uniquement ce que
renvoient `/v1/usage` et l'API native ; rien d'estimé n'est présenté comme facturé.

## 7. Changements recommandés, classés par bénéfice mesurable

1. **Ne pas activer la politique v5 P(keep) ≥ 0,10 / P(skip) ≥ 0,20** : elle retient 25 bruits
   sur dev. Bénéfice : éviter un digest pollué.
2. **Passer à la question v5 avec la règle 0,75** après la passe B sur ce benchmark : de 2/14 à
   6/14 keep sur dev, à 0 bruit observé.
3. **D** : envoyer au LLM juge seulement les cas que Jev v5 n'écarte pas. Gain attendu : moins
   d'appels LLM qu'avec C (≈ 60 % des cas sont des skip fiables), à mesurer.
4. **Routage en mode table** par défaut (PR #17), Jev en audit seulement.
5. Corriger le constat K07 @d63a0c3 (blob perdu dans `ingest-alert-candidates`) si ce n'est pas
   déjà fait à `a604aa6` : à relire au prochain SHA.
6. Faire étiqueter 10 cas du benchmark par Ivan : mesurer l'accord entre annotateurs, puisque
   tous les labels actuels viennent d'un seul annotateur (Claude).

## 8. Désaccords et limites

- **Avec Codex** : politique v5 P(keep) ≥ 0,10 (contestée par les chiffres du § 1) ; V12
  (urgence conditionnelle).
- Petits effectifs (14 keep sur dev, 5 sur le benchmark) : ces seuils sont des seuils de pilote,
  pas des garanties.
- Les synthétiques ne prouvent pas l'utilité de la veille réelle ; les flux de production
  contiennent peu de positifs récents.
- Aucune synthèse automatique réelle n'a encore été produite : la revue de la prose réelle
  attend le reçu de Codex.
