# Revue Claude : reprise des lecteurs et deux pages bloquées — 2026-10-07

Base relue : `agent/codex/alerts-integration` @`cd933ec` (diff `ab8d294`). Runtime observé en
lecture seule : `inspect-mac-pilot.mjs` (Node 24.19.0 géré), commit actif `ab8d294`. Aucun appel
à un modèle, aucune campagne payante, aucune écriture dans la file live (requêtes faites sur une
copie de `mac-alerts-ab8d294/reader-retry-proof-backup`, supprimée ensuite).

## 1. Reprise des lecteurs (`ab8d294`) — conforme, aucun défaut reproduit

| Critère | Constat |
|---|---|
| Échecs persistés | table additive `source_read_failures` (id, empreinte, code, tentatives, prochain essai) ; aucune exception brute ni contenu de page |
| Délais bornés | structurel → `next_attempt = NULL` (bloqué) ; transitoire → 30 min puis 2 h ; 3 tentatives au plus par empreinte |
| Filtre avant LIMIT | la condition de reprise est dans le `WHERE` de `unreadCandidates`, donc avant `LIMIT 100` |
| Nouvelle empreinte | SHA-256 du lecteur Python + du module de validation JS ; la doc et le hook ne la changent pas |
| Reçus et sources lues | `recordSourceReadFailure` ne fait rien si la source est déjà lue ou hors `pending`/`SOURCE_NOT_READ` ; succès → ligne d'échec effacée |

Tests rejoués : `ingest-alert-fairness` + `inspect-mac-pilot` 21/21, runtime 139/139.
**Ma sonde de famine** (#64 : budget de 2, deux pages toujours en échec, une lisible) : avant,
p3 n'était jamais lue en 3 cycles ; maintenant, cycle 1 = p1, p2 (échecs persistés),
cycle 2 = **p3 lue**, cycle 3 = aucune relecture inutile. Le défaut signalé dans #64 est corrigé.
En production : `sourceReadFailures` = 2 (une date non vérifiable, une page trop grande),
`CHECK_SOURCE_READS` visible sans masquer les autres diagnostics.

## 2. Les deux pages bloquées

Captures publiques du 2026-10-06T22:07Z, HTTP 200 (empreintes SHA-256 pour la preuve) :
- `le-chonk` : 15 746 octets, `44766ec7a9470f75a02b7c2e54e1deab662afbc730100525786f5e49f8d91678` ;
- `next-16-4` : 498 948 octets, `04856c331ed6ef66d30d07be2d4cc24ab8210d9c36d221e0f5cd98138dd617be`.

Les deux refus sont reproduits à l'identique avec `read-public-alert.py` de `cd933ec`.

### simonwillison.net/2026/Oct/6/le-chonk/ — `PUBLIC_SOURCE_DATE_UNVERIFIED`

**Cause exacte.** La date primaire est bien dans la page, mais avec un suffixe que le
lecteur n'accepte pas :
- `<p class="mobile-date-eyebrow">6th October 2026 - Link Blog</p>` ; le lecteur applique
  `fullmatch(r"(\d{1,2})(?:st|nd|rd|th)? ([A-Za-z]+) (\d{4})")`, qui échoue à cause de
  ` - Link Blog` ;
- `<div class="entryFooter">Posted <a href="/2026/Oct/6/">6th October 2026</a> at 8:18 pm</div>`,
  ignorée volontairement par le lecteur.

**Lecture fiable possible** : accepter sur l'eyebrow un suffixe de type fermé
(`(?: - (?:Link Blog|Quote|Note|TIL))?`), puis garder la comparaison existante avec le jour de
l'URL : c'est une **concordance** entre deux indices, pas une date déduite du lien. Précision :
`page-day`, car 8:18 pm n'indique pas de fuseau. Corps utile : 6 paragraphes, environ 1 200
caractères. Test proposé : cette capture donne 2026-10-06 ; même capture avec une URL au 7 →
`DATE_INVALID`.

**Mais attention au doublon Mistral.** Ce billet est un *commentaire* (« Link Blog ») de
l'annonce `mistral.ai/news/mistral-large-4/`, déjà **lue** et en revue
(`SELECTION_UNCERTAIN`). Il ajoute un fait tiers (score Artificial Analysis 38) et un avis
(« about 6 months behind the frontier »), pas de nouveaux chiffres officiels. S'il devient
lisible, il ne doit **pas** produire une deuxième alerte sur la même annonce. Il faut soit le
rattacher à l'annonce comme commentaire, soit le laisser non lu. Aujourd'hui, rien ne relie les
deux, car la déduplication du ledger porte sur le sujet, le jour et le titre, et les titres
diffèrent. **Avis** : le laisser non lu tant que ce rattachement n'existe pas. Le gain (un
commentaire tiers) ne justifie pas le risque d'un doublon. Les chiffres de l'annonce
(49B actifs, 1T) et de la documentation (52B, 1,05T) restent cités séparément.

Observation annexe, sans défaut : une ligne `mistral.ai/news/mistral-large-4//` (double barre
finale) attend aussi en `SOURCE_NOT_READ`. Le lecteur la refuse (`PUBLIC_SOURCE_UNSUPPORTED`,
reproduit), donc pas de double alerte possible par cette voie. `canonicalUrl` pourrait la
ramener à l'URL déjà lue (au choix de Codex).

### nextjs.org/blog/next-16-4 — `PUBLIC_SOURCE_TOO_LARGE`

**Taille réelle** : 498 948 octets décompressés, au-dessus de `MAX_BYTES = 400_000`.
- Scripts : 235 680 octets (47 %) ; SVG : 38 332 ; `<article>` : 196 746 octets de HTML.
- Texte utile de l'article : **22 990 octets**, soit 4,6 % de la page.

**Date primaire** concordante sur trois indices de la page et du flux, aucun tiré de l'URL :
- `article:published_time` = `2026-10-06T20:00:00.000Z` ;
- date visible « Tuesday, October 6th 2026 » ;
- flux `pubDate` = Tue, 06 Oct 2026 20:00:00 GMT.

**Mesure du plafond** sur les 8 billets du flux du blog Next.js :

| Taille (octets) | Billets |
|---|---|
| 163 261 à 238 765 | 6 billets (annonces de sécurité, article sur les tickets GitHub) |
| 498 948 | `next-16-4` |
| 506 038 | `turbopack-chunking` |

Ce sont les deux billets techniques longs, donc les plus utiles, qui dépassent le plafond.

**Lecture fiable possible**, au choix de Codex, propriétaire du lecteur :
- (a) plafond propre à `nextjs.org` à 600 000 octets : maximum mesuré 506 038, marge 18 %,
  mesure sur 8 pages seulement ;
- (b) préférable : garder le plafond de transfert global et mesurer le texte extrait de
  `prose`/`next-prose` (≈ 23 Ko ici) plutôt que le HTML brut, que les scripts gonflent.

Sans l'une ou l'autre, la page reste correctement non lue. Le refus structurel la sort
désormais du budget (§ 1), elle ne gêne plus les autres lectures.

## 3. K09/K10 — mise à jour

- **Vérifié** : la famine du budget de lecture (#64, § 2) est corrigée et prouvée (§ 1).
- **Pas de synthèse `v3-business-market` livrée** : le dernier envoi reste le message 60
  (`lastDelivery`) ; `business.validatedFiches` = 0. Rien à relire par reçu, pas de note.
  B03 (reçu 61) n'est pas rejoué et reste un test historique insuffisant.
- **Qualification produit, pas défaut de code** : deux semaines de digest réel notées par Ivan
  et dix abstentions réelles annotées par lui. Elles ne se simulent pas et restent ouvertes.
- **Inchangé** : Career en pause, OVH reporté, Knowledge/Anakalypto en dernière étape commune.
