# Revue Claude : tri natif, message 62 et briefs prêts — 2026-10-08

Base : `agent/codex/alerts-integration` @`291c8ad` (worker `c613533`, plugin `8364b9f`).
Lecture seule : reçus privés et **copie** de `mac-alerts-c613533/state-backup-after-recovery`
(WAL compris), supprimée ensuite. Aucun appel modèle ou Jev, aucune écriture live, aucun envoi.
Aucun identifiant de destinataire n'est reproduit.

## 1. Message 62 (Next.js 16.4) — vrai message, mode natif

Reçu : digest `2026-10-07`, livré, `production: true`, `manualDigest: true` (digest de
qualification déclenché à la main ; tri, rédaction et relecture automatiques). Relecture
`approve`, sans code, en 4,6 s ; rédaction `alert-editorial-v3-business-market` en 12,8 s.

Preuves mécaniques recalculées depuis la file :
- **liaison** : `briefBinding(item, brief)` recalculé = `361304ac…` du reçu de relecture ;
- **rendu** : `renderBrief` du brief relu redonne exactement le texte livré ;
- **citations** : les deux citations sont des sous-chaînes exactes de l'extrait lu (17 652
  caractères de texte, extrait partiel déclaré dans « Limite »).

Notation sur les cinq axes du contrat (§ 9), 0–2 chacun :

| Axe | Note | Pourquoi |
|---|---|---|
| Pertinence | 2 | version mineure d'un framework web suivi, envoyée au digest, sans fausse urgence |
| Fidélité | 2 | « annonce » et « for all Next apps » rendus fidèlement ; 30 % et 15 % dans leur citation |
| Utilité | 1 | conditionnelle et honnête (« si un projet utilise… ») mais générique. Le point le plus structurant de l'extrait est absent : **Cache Components deviendra le défaut dans Next.js 17**, un signal de migration |
| Action | 2 | commence par vérifier si Ivan est concerné, puis teste sur un projet non critique |
| Effort de lecture | 2 | compris sans ouvrir la source |

**9/10, fidélité 2** : au-dessus du seuil proposé (non calibré). C'est la **qualité du
message**. Le **bénéfice quotidien réel** reste inconnu : il dépend de l'usage de Next.js et du
React Compiler, qu'aucune donnée publique du pilote n'établit. Seule la note d'Ivan
(`62 utile / inutile / trop vague`) le mesurera.

## 2. Briefs prêts du matin du 7 — **pas des messages livrés**

Trois briefs `BRIEF_VERIFIED` attendent le digest (`morning-recovery-proof.json`). Les
citations sont toutes des sous-chaînes exactes de leur extrait.

| Brief | Fidélité | Utilité / action | Observation |
|---|---|---|---|
| Uceprotect (HN, 05/10, `system`) | **1** | 1 / 2 | Le fait 2 ajoute « plutôt que du comportement propre du site », absent de sa citation (« based on the reputation of the entire ASN 14061 »). L'idée figure ailleurs dans l'extrait, mais pas dans **sa** citation. Le relecteur l'a approuvé : c'est le type d'ajout que son prompt doit refuser. Source : témoignage HN, déclaré en limite |
| BCE, Schnabel (30/09, `finance`) | 2 | 1 / 1 | Fidèle, mais pauvre. Le fait 2 rend « It » par « ce choc » sans l'antécédent. Utilité et action génériques (« vérifier les prochaines publications »). Discours vieux de 7 jours au moment du digest. La limite le dit honnêtement : ni niveau ni chiffre |
| Victoria Kim (06/10, `system`) | 2 | 1 / 2 | Citation rapportée (Kwon, OpenAI) tronquée sur « Mr. » ; le fait reste exact. Utilité : passage d'un contrôle d'entraînement chez OpenAI à « vos agents sur Mac », une généralisation raisonnable mais indirecte. L'action en lecture seule est proportionnée |

Six échecs du matin (`NATIVE_ASSESSMENT_UNAVAILABLE`, `model/list timed out` avant rédaction) :
**non notés**, ce ne sont pas des jugements. Catalogue Business : toujours vide, rien à relire.

## 3. Revue runtime ciblée

Tests : runtime **152/153**, scripts 59/59 (Node 24.19.0 géré).

| Critère | Commit | Avis |
|---|---|---|
| Reçu de relecture lié au brief exact | `8364b9f` | conforme, prouvé sur le vrai message 62 (§ 1) ; contexte et version aussi vérifiés côté outil |
| Limite des deux étapes | `8364b9f` | conforme : `nativeCalls + 2 ≤ 4` avant chaque élément, donc au plus 4 complétions ; observé 3–4 par passage le 7 |
| Migration unique des abstentions | `8364b9f`, `32dcdff` | conforme : une révision par empreinte du contexte, décision d'origine dans `evidence_revisions`, places libres seulement |
| Créneaux | `8364b9f` | conforme : clé `process:native:<5 min>`, créneau courant seulement |
| Pas de renvoi après envoi incertain | existant | conforme (test « uncertain first page ») |
| Sources nouvelles/interrompues prioritaires | `32dcdff` | conforme |
| Cycles expirés réconciliés | `32dcdff` | conforme ; preuve réelle : 2 cycles fermés, 0 fantôme, 4 reçus préservés |
| Pause au premier échec du fournisseur | `c613533` | conforme ; un refus de contenu ne l'arrête pas |

**Défaut reproduit, test seulement (le runtime n'est pas en cause).**
`cycle-engines.test.js:66`, « the configured worker policy reuses a recorded review once… »,
échoue depuis le **2026-10-08 vers 08:00 UTC**. Le test fixe `now = 2026-10-05T10:00Z` pour
`runCycle`, mais la fixture ouvre la file avec l'horloge réelle (`openLedger` →
`Date.now()`). `reconsiderReviewedSelection` filtre alors l'élément (publié le 05/10 08:00)
comme trop ancien, et `policyRevisions` vaut 0 au lieu de 1. Preuve : le même test passe avec
`Date.now` figé au 05/10, au 07/10 09:00 et au 07/10 12:00, et échoue au 08/10 10:00, de façon
déterministe. **La CI de la branche sera rouge dès maintenant.** Correctif proposé (fichier
Codex, non modifié ici) : passer `now: () => now.getTime()` à `openLedger` dans la fixture, et
chercher le même motif dans les autres fixtures.

Observation sans défaut : la métrique `decisions` d'un passage ne compte que les appels Jev ;
en mode natif elle vaut toujours 0 alors que 3–4 complétions ont eu lieu. Il vaudrait mieux
l'omettre ou la renommer pour que le diagnostic ne la lise pas comme « aucun jugement ».

## 4. Documentation alignée dans cette PR

- `workflows/alert-editorial.md`, `docs/ALERT-EDITORIAL-CONTRACT.md` : tri natif puis seconde
  lecture, Jev retiré, limites du passage. Même schéma, aucune seconde file.
- Skills : `jev-decision` 0.6.0, `calibration-jev` 0.4.0, `rapport-telegram` 2.2.0.
  Les questions Jev hors alertes restent non qualifiées ; les jeux de sélection Jev sont
  marqués historiques.
- `docs/MAC-PILOT-OPERATIONS.md` : usage quotidien (digest, reçu, extrait partiel, refus,
  diagnostics simultanés, reprise) et notation `utile / inutile / trop vague`.
- `docs/K10-ABSTENTIONS-A-ETIQUETER.md` : dix abstentions réelles, sans label de Claude.
