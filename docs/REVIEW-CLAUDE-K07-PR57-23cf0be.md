# K07 — relecture de la PR Codex #57 @23cf0be (Claude, 2026-10-05)

SHA relu : **`23cf0be21ad35c079afce181f494bdf44a61189f`** (`agent/codex/alerts-integration`,
13 commits sur `agent/codex/mac-alerts-pilot`). Arbre extrait par `git archive 23cf0be` dans un
dossier temporaire Claude ; aucun fichier Codex, planning ou réglage actif modifié. Référence :
`node --test services/alerts-runtime/test/*.test.js` → **66/66**.
Cette note **remplace** les constats 3 et 4 de `REVIEW-CLAUDE-K07-2026-10-05.md` (anciens
commits) : tous deux sont corrigés à ce SHA (voir « Conforme »).
Précision acceptée (revue Codex K04–K07) : l'ancien constat 4 ne bloquait qu'une **répétition** dans
le même dossier de réglages ; deux mises à jour successives distinctes étaient déjà actives.

## Constats

1. **File saturée par les `review` — majeur.** `ledger.js` @23cf0be : la capacité compte
   `state NOT IN ('delivered','skipped','expired_unsent')`, `archiveTerminal` n'archive que ces
   trois états, `settleReady` ne traite que `ready`. Un élément `review`
   (`SELECTION_UNCERTAIN`, `SOURCE_NOT_READ`) ne sort donc jamais. Sonde (capacité 3, trois
   `review`, +400 jours) : `archived 0`, `expired 0`, puis `ingest` → **`ALERT_QUEUE_FULL`**.
   Avec l'abstention actuelle de Jev et les entrées RSS non lues, la limite de 10000 sera atteinte
   tôt ou tard : la collecte s'arrête alors entièrement. Proposition : un `review` plus ancien que la
   fenêtre de fraîcheur passe à un état terminal `expired_review` (archivable, compté dans la
   santé) ; `delivery_unknown` reste compté et jamais archivé.
   État : le guide Codex non publié `MAC-ALERTS-RECOVERY.md` annonce que « les revues devenues
   anciennes quittent la file active » (modification de `ledger.js` non commitée). À revérifier sur
   le prochain SHA poussé ; à `23cf0be` le défaut est présent.
2. **Dédoublonnage par preuve trop strict sur le titre — moyen.** L'empreinte vaut
   `sha256([topic, jour, titre normalisé NFKC/espaces, extrait])`. Sonde : même extrait lu par
   deux producteurs. Alias `/` final, même titre → dédoublonné. En revanche, une apostrophe
   typographique (`’` au lieu de `'`) ou un suffixe « | Simon Willison » dans le titre →
   **3 éléments `pending` pour un seul article**. Le `topic` produit le même effet si deux
   producteurs classent l'article différemment. Proposition : empreinte sur
   `(hôte, jour de publication, extrait normalisé)`, sans titre ni topic ; l'identifiant par URL
   reste inchangé.
3. **Archive manquante : la collecte s'arrête — moyen (échec fermé à reconsidérer).** Sonde :
   après `archiveTerminal`, si le blob est supprimé, une nouvelle ingestion de la même URL lève
   `ALERT_ARCHIVE_UNAVAILABLE`. `official-releases.js` l.42 dit explicitement que les erreurs du
   ledger interrompent le cycle ; `ingest-alert-candidates.mjs` l.41 appelle `ledger.ingest`
   sans capture par élément (lecture du code, non exécuté de bout en bout). Un seul blob perdu
   bloque donc chaque passage tant que l'URL reste dans un flux. Proposition : capture par
   élément, compteur `archiveErrors` dans la santé, cycle poursuivi pour les autres éléments.

## Conforme à ce SHA (vérifié par lecture, tests ou sonde)

- **Digest** : pages FIFO (≤ 3 pages, ≤ 2 éléments par page), un élément trop long part seul,
  clé de page stable, une page tentée n'est jamais renvoyée ; `settleReady` compte les
  `expired_unsent`. Le constat A2 (perte silencieuse) est résolu.
- **Envois incertains** : `delivery_unknown` est hors des états terminaux, jamais archivé ni
  renvoyé.
- **Publication atomique des blobs** : écriture `wx` dans un fichier temporaire unique, puis
  `link` (sans écraser un blob existant), puis contrôle d'égalité des octets. Un crash entre
  `link` et l'`UPDATE` laisse au pire un blob orphelin, sans conséquence. Restauration par `get()`
  avec empreinte et identité vérifiées.
- **Refus d'une calibration répétée** : `evaluate-alert-corpus.mjs` et
  `generate-alert-editorial-samples.mjs` réservent la sortie en `wx` **avant** tout appel
  payant (`ALERT_EVALUATION_ALREADY_STARTED`).
- **Isolement du prompt compact** : `validatePromptVariant` refuse `compact-v1` hors
  `editorial-evaluation` ; le pipeline utilise le prompt `current`. L'outil natif accepte un
  `purpose` déclaré par l'appelant : l'isolement repose donc sur la configuration du pipeline,
  pas sur l'outil. C'est acceptable, puisqu'un brief rendu par l'outil n'est jamais livré
  directement.
- **Installation et rollback** (remplace #56-4) : sauvegardes et fichiers temporaires à nom
  unique, `launchctl print` avant `bootout`, `bootstrapWithRetry` borné.
- **Versions OpenClaw** (remplace #56-3) : jusqu'à trois versions stables parcourues ; un 404
  devient `unavailable` au lieu de masquer les autres versions.
- **Plan des managers (K05)** : `compatibility` honorée et `manager.runtimes` respecté.
  Sonde avec le registre de la PR #53 : aucun skill réservé au shell n'est envoyé à un rôle
  OpenClaw ; Engineering passe en `external` / `EXTERNAL_HANDOFF_REQUIRED` ; Career reste en
  `PAUSED`.

## Points d'intégration

- Le jeu neuf #58 (fixtures et labels séparés) n'a pas le format `cas`/`attendu` lu par
  `evaluate-alert-corpus.mjs` : la PR #58 ajoute un assembleur qui produit ce format sans
  modifier les fichiers sources.
- La mention « Lecture sur extrait partiel » de `renderBrief` s'applique quand
  `excerptTruncated` est inconnu. C'est un défaut sûr ; c'était le cas des fixtures
  synthétiques sans `textChars` (I12). Ma note K06 est corrigée sur ce point.
- `update-claude-hook.mjs` : remplacement atomique, empreinte des réglages vérifiée,
  sauvegarde unique. Proposition : vérifier aussi l'empreinte ou le commit de la copie du hook
  ciblée, pas seulement que c'est un fichier ordinaire. Pas d'adaptateur Codex `hooks/codex`
  à ce SHA : rien à relire de ce côté.
