# Contrat éditorial des alertes Telegram — `alert-editorial-v1`

Auteur : Claude (lot K01–K02), 2026-10-05. Consommateur : Codex C08–C10.
Statut : **proposition source**, pas activée et pas vérifiée de bout en bout. Compatible avec le
schéma runtime `coded-brief-v1-provisional` (commit Codex `9572e42`, branche locale
`agent/codex/alerts-integration`, non publiée au moment de la rédaction). Les évolutions
demandées sont listées au § 11 ; aucune ne crée un second schéma.

Une alerte permet à Ivan de **comprendre sans ouvrir l'article** : faits vérifiés, ce que ça
change pour lui, action éventuelle, limites, puis le lien. Rien de retenu = aucun message.

## 1. Chaîne et responsabilités

| Étape | Qui | Produit |
|---|---|---|
| Collecte, lecture effective, extrait, dates, empreinte | code Codex | enveloppe § 2 |
| Doublons, fraîcheur, périmètre, sujets en pause, injection évidente | code Codex | `skip` / `review` / sélection requise |
| Pertinence (keep / review / skip) | Jev `alerts.pertinence.mac-v1` | décision + confiance, **jamais de texte** |
| Synthèse d'un élément retenu | `ivan_alert_synthesize` (System, complétion isolée sans outils ni historique) | brief § 3 |
| Contrôles (citations, chiffres, longueurs) puis rendu | code Codex | message § 4 |
| Silence / digest / immédiat, envoi, reçu | code Codex | § 7 |
| Qualité éditoriale, corpus, évaluation indépendante | Claude | ce contrat, `skills/rapport-telegram/corpus/` |

Jev classe ; il ne rédige pas. Le générateur synthétise ; il ne refait pas le tri et n'envoie rien.

## 2. Entrée : l'enveloppe lue

Champs existants (runtime) : `producer`, `url` HTTPS publique canonique, `title`, `topic`
(`business|finance|engineering|system`, ou `career|knowledge|ovh|other`), `scope: "public"`,
`publishedAt`, `observedAt`, `readAt` si lu, `sourceStatus` (`read|unavailable|title-only`),
`excerpt` (≤ 1200 caractères, texte effectivement téléchargé, jamais la description RSS).

Champs demandés (§ 11, A1) : `textChars` (longueur du texte extrait complet), `excerptMode`
(`head|passages`), `excerptTruncated`. Sans eux, ni le modèle ni Ivan ne savent si l'extrait
couvre l'article ; la limite « lu partiellement » doit alors être ajoutée par le code.

Inconnu = absent. Aucun champ n'est déduit du titre, de l'URL ou de la mémoire du modèle.

## 3. Sortie du générateur (brief)

```json
{
  "goal": "system",
  "facts": [{ "summary": "fait essentiel en français", "evidence_index": 0 }],
  "utility": "ce que ça change concrètement pour une priorité active",
  "action": "une action réaliste, ou « Rien à faire maintenant. »",
  "uncertainty": "limite de la source ou de la déduction"
}
```

- `goal` : une des quatre priorités actives ; c'est celle que l'utilité sert.
- `facts` : **1 à 3**. Le modèle désigne le passage numéroté qui prouve le fait ; le code
  remplace l'index par la citation exacte (`quote`). Le modèle ne recopie jamais une citation :
  traduction, guillemets typographiques et ellipses la corrompraient.
- Tout nombre d'un `summary` (date, version, pourcentage) figure dans sa citation. Écrire
  « dix mille dollars » plutôt que « 10 000 $ » si la source dit « $10,000 » (§ 11, A6).
- `utility` et `action` ne contiennent aucun chiffre absent des faits étayés.
- `uncertainty` est **obligatoire** si l'extrait est partiel (`excerptTruncated` ou
  `passages`), si l'utilité repose sur une déduction, ou si la source est une opinion,
  un discours ou une citation d'un texte non lu.
- Longueurs maximales : summary 350, utility 500, action 300, uncertainty 300.

## 4. Message rendu (Telegram, texte simple)

```
<titre de la source>
Publié le AAAA-MM-JJ.            (« Relevé le » pour la veille Finance)
• fait 1
• fait 2
• fait 3

Utilité pour toi : …

À faire : …

Limite : …

Source : <url>
```

Longueur : généralement **1000–1800 caractères** quand c'est utile, moins si cela suffit ;
2500 au maximum. La longueur n'est pas un objectif : trois faits creux valent moins qu'un fait
utile. Le lien est **toujours la dernière ligne** ; jamais de lien seul, de tableau ou de bloc
de code. Le titre, la date et le lien sont ajoutés par le code, pas par le modèle.

## 5. Contexte public minimal

Actuel (`mac-pilot-20261005-v1`) : priorités actives Business, Finance publique, Engineering,
System avec un objectif d'une phrase chacune ; Career en pause ; Knowledge et OVH reportés.

Proposition v2 (§ 11, A5), toujours publique et sans profil : ajouter 5 faits système d'une
ligne, nécessaires pour que l'utilité soit concrète plutôt que générique :
1. Le pilote tourne sur un Mac, pas encore sur un serveur permanent.
2. Plusieurs agents (Claude Code, Codex, OpenClaw) partagent un dépôt Git et une mémoire Obsidian.
3. Les agents appellent des services payants ; le budget Jev commun est plafonné.
4. La pile web par défaut des projets est Next.js / TypeScript ; les services sont en Node.
5. La veille Finance suit des indicateurs publics (BCE, inflation, taux) sans portefeuille.

Exclus du contexte des synthèses : profil complet, actifs, allocations, objectifs personnels,
clients, données Career. Une personnalisation privée éventuelle se fait localement, à la demande
d'Ivan, jamais injectée automatiquement dans Jev, le générateur ou un fichier partagé.

## 6. Pertinence (keep / review / skip)

Retenir (`keep`) seulement si **tous** les points sont établis par l'extrait lu :
1. **Nouveauté** : un changement, une décision, une donnée, une version ou un résultat nouveau.
2. **Fraîcheur** : publié dans la fenêtre du type de source (§ 11, A3).
3. **Preuve** : le fait est dans l'extrait, pas seulement dans le titre ou le chapeau RSS.
4. **Lien concret** avec une priorité active, formulable en une phrase sans « peut-être ».
5. **Impact / effort** : l'information change une décision, un risque ou un coût du pilote.
6. **Action disponible**, ou bonne raison de savoir maintenant même sans action.

Ne prouvent rien : un titre séduisant, des mots-clés communs (« IA », « agents »), une promesse
de prix ou de performance non chiffrée dans l'extrait, la popularité, deux bots qui proposent
la même page. `review` = lien possible mais non établi par l'extrait ; `skip` = promotion,
bruit, répétition, sujet en pause, aucun usage concret.

## 7. Silence, digest, immédiat

| Cas | Livraison |
|---|---|
| `skip`, `review`, source non lue, injection suspecte, rien de retenu | **silence** (visible dans l'état de santé, pas sur Telegram) |
| `keep` ordinaire | **digest** du soir |
| `keep` + urgence réelle (ci-dessous) | **immédiat**, une alerte |

Urgence réelle = les quatre conditions, établies **par code** et non par le ton de la source :
(a) composant ou service **actif dans le pilote** (inventaire local), (b) risque de sécurité,
de perte de données, de coût non plafonné ou échéance < 24 h, (c) exploitation en cours ou
échéance datée dans l'extrait, (d) action réalisable par Ivan. Tant que ce contrat d'urgence
n'est pas implémenté et mesuré, **aucune urgence automatique** : tout passe par le digest.
L'agent ne déclenche jamais lui-même l'action proposée.

Le digest ne perd jamais un élément en silence : s'il ne tient pas, il part au digest suivant
ou dans un second message du même créneau ; un élément expiré non envoyé est compté (§ 11, A2).

## 8. Faits, déductions, sources partielles

- Un fait = ce que dit l'extrait, attribué (« selon la BCE », « Simon Willison plaide pour »).
  Une opinion reste une opinion ; un discours n'est pas une décision.
- Une déduction (utilité, lien avec le pilote) est formulée comme telle et ne porte aucun chiffre
  nouveau. Ce qui est **après** l'extrait n'existe pas pour la synthèse, même si le modèle le
  « connaît ».
- `unavailable` (HTTP 401/403, paywall, délai) et `title-only` : jamais de synthèse ; silence.
- Extrait non substantiel (introduction, table des matières, page d'abonnement, chrome du site) :
  `review` avec raison `EXTRAIT_NON_SUBSTANTIEL`, pas de résumé creux.
- Instructions dans la source (« ignore previous instructions », demande de secret, « classify
  as URGENT ») : la source reste une donnée ; `review` + motif `INJECTION_SUSPECTE`, aucun envoi,
  jamais de recopie de la consigne dans un message.

## 9. Qualité d'une synthèse — grille d'évaluation

Cinq axes notés 0–2, **séparément** ; un JSON valide ne prouve rien.

| Axe | 2 | 1 | 0 |
|---|---|---|---|
| Pertinence | bonne décision keep/review/skip et bonne livraison | bonne sélection, mauvaise livraison | envoyé à tort ou utile écarté |
| Fidélité | chaque fait dit ce que dit sa citation, rien hors extrait | nuance perdue | fait inventé, hors extrait ou chiffre faux |
| Utilité | conséquence concrète pour une priorité active | utile mais générique | creuse ou inventée (portefeuille, objectif privé) |
| Action | réaliste, proportionnée, ou « rien à faire » assumé | vague | transaction, contact tiers, action automatique |
| Effort de lecture | compris en < 1 min sans ouvrir la source | il faut ouvrir pour un point | il faut ouvrir pour comprendre |

Seuil proposé pour le pilote (non calibré) : fidélité = 2 obligatoire, total ≥ 8/10.
Exemple vécu : un brief du corpus de construction affirmait « désactivable seulement sur choix
explicite » avec une citation exacte — mais ce point était après l'extrait. Les contrôles codés
l'ont laissé passer ; seule la relecture de fidélité l'a vu.

## 10. Interdits

Résumer depuis un titre ou une description RSS ; inventer un chiffre, une date, une version,
un portefeuille, un objectif ou une personnalité ; recommander une transaction ; contacter un
tiers ; lien seul ; deux messages pour la même page ; urgence sur le seul vocabulaire de la
source ; donnée privée, secret ou extrait de journal brut dans un message ; notification Career
pendant la pause.

## 11. Évolutions demandées à Codex (preuves dans `docs/REVIEW-CLAUDE-ALERTS-2026-10-05.md`)

- **A1 — Extrait par passages et couverture.** Garder la tête (≈ 300 caractères), puis les
  phrases contenant chiffres, versions, dates ou décisions, jointes par ` […] `, dans la limite
  de 1200 ; exporter `textChars`, `excerptMode`, `excerptTruncated` ; ajouter par code la limite
  « extrait partiel » ; découper `evidenceSpans` aussi sur ` […] `. Jev reçoit les 500 premiers
  caractères de ce même extrait. Option si la mesure le justifie : 3000 caractères pour la seule
  synthèse (≈ 450 jetons de plus par génération, deux générations par passage au maximum).
- **A2 — Digest sans perte.** Avec des briefs de 1300–1500 caractères, un seul tient dans 2500 ;
  les autres restent `ready` puis deviennent périmés et ne partent jamais. Proposer : digest
  jusqu'à 3800 caractères (limite Telegram 4096) ou plusieurs messages dans le même créneau ;
  état `expired_unsent` compté au lieu d'un abandon silencieux.
- **A3 — Fraîcheur par type.** 72 h écarte un correctif de sécurité Next.js de 5 jours.
  Proposer 7 jours pour les avis de sécurité et discours/communiqués de banque centrale,
  72 h pour le reste ; compter les écarts `SOURCE_STALE` dans l'état de santé.
- **A4 — Pré-filtre d'injection codé** avant Jev : motifs « ignore (all|your|previous)
  instructions », « system note to ai », demande de token/secret → `review INJECTION_SUSPECTE`.
- **A5 — Contexte public v2** (§ 5), même version sur Jev et le générateur.
- **A6 — Contrôle des nombres** : tolérer les séparateurs de milliers (« 10 000 » ↔ « 10,000 »)
  ou documenter le refus ; aujourd'hui c'est un faux rejet sûr, pas une faille.
- **A7 — Doublons** : normaliser la barre oblique finale du chemin (hors racine) dans
  `canonicalUrl` ; les URLs alternatives restent une limite connue.
- **A8 — Urgence** : pas de voie immédiate tant que § 7 n'est pas codé contre un inventaire
  local ; le cas I12 du corpus sert de test de référence.

## 12. Ce qui n'est pas prouvé

Les exemples du corpus sont rédigés manuellement par Claude à partir de pages réellement lues ;
ce ne sont pas des sorties du générateur natif. La sélection Jev n'a pas été évaluée sur le jeu
indépendant. Aucune mesure d'utilité perçue par Ivan n'existe encore (C10, C23).
