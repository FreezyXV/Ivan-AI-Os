# K07 — relecture de `agent/codex/alerts-integration` @d63a0c3 (Claude, 2026-10-05)

SHA relu : **`d63a0c36e08eae37839559dd01cdc33388ce8aa1`** (commits `0b098d7`, `49060ea`, `d63a0c3`
après `23cf0be`). Arbre extrait par `git archive d63a0c3` ; aucun fichier Codex ni réglage actif
modifié. Tests à ce SHA : alerts-runtime 68/68, `hooks/codex` + `scripts` 27/27,
`test_backup_alert_state` OK (unittest).

**Non intégré à ce SHA** : la PR #59 (probabilités Jev, `selectionOutcome`, script de
calibration, dédoublonnage v2, fraîcheur BCE, consignes K06). Le worker applique donc toujours la
règle 0,75, qui ne retient aucun keep sur le jeu de calibration. Pas de réglage de politique à
relire tant que #59 n'est pas intégrée.

## Constats

1. **Archive perdue : correctif incomplet — moyen, prouvé.** `ledger.ingest` renvoie bien une
   pierre tombale sans lire le blob. Mais `scripts/ingest-alert-candidates.mjs` l.41 enchaîne
   `prior=ledger.get(row.id)`, qui relit l'archive. Sonde : élément d'export archivé, blob
   supprimé, nouvel export de la même URL → `ingestCandidates` lève `ALERT_ARCHIVE_UNAVAILABLE`
   et **tout le lot du flux est interrompu**. Proposition : si `ingest` renvoie une pierre
   tombale (état terminal archivé), `continue` sans `get` ; sinon, capture par élément avec un
   compteur `archiveErrors`.
2. **Reviews anciennes — corrigé, prouvé.** `settleStaleReviews` (appelé à chaque cycle) fait
   passer les `review` hors fenêtre de fraîcheur à `expired_unsent`, avec le motif et le reçu Jev
   conservés. Sonde : trois reviews anciennes → `expired 3`, la file accepte de nouveau ;
   une review récente reste en `review`. Remarque mineure : `expired_unsent` mélange désormais
   des briefs prêts mais non envoyés et des éléments jamais retenus ; le motif d'origine permet
   de les distinguer, mais le diagnostic devrait afficher les deux compteurs séparément
   (`expiredReviews` existe déjà dans les métriques du cycle).
3. **Erreur de rétention — corrigé.** `mac-alerts-cycle.mjs` capture une erreur
   d'`archiveTerminal` (`ALERT_ARCHIVE_UNAVAILABLE` / `ALERT_RETENTION_UNAVAILABLE`) sans arrêter
   le cycle.
4. **Résidu de lecture.** `list('skipped' | 'delivered' | …)` lève encore une exception si un
   seul blob manque (sonde). Aucun appelant de production n'a été trouvé à ce SHA : c'est à
   surveiller pour le diagnostic, pas un défaut actif.
5. **Livraison Telegram** : `telegram-delivery.js` et `digest.js` sont inchangés depuis
   `23cf0be` ; les conclusions de `REVIEW-CLAUDE-K07-PR57-23cf0be.md` restent valables.
6. **Adaptateur hook Codex** (`hooks/codex/`) — conforme à la lecture :
   - il traduit Bash et les en-têtes `apply_patch` (y compris `Move to` / `Delete File`) vers la
     copie épinglée du hook Claude, sans jamais transmettre le contenu du patch ;
   - un `ask` du hook Claude devient un **refus** explicite, jamais une autorisation
     silencieuse.

   Limite : en mode `shadow` par défaut, il n'apporte aucun contrôle. Seul le mode `gate`
   reprend les refus codés et les garde-fous. Non installé, ce qui est cohérent avec son README.
7. **Sauvegarde** (`backup-alert-state.py`) : tests OK. Restauration réelle documentée par Codex
   (copie sous `/private/tmp`) ; non rejouée par Claude.

## Ordre proposé

Corriger le constat 1 (petit), intégrer #59 puis passer la politique calibrée
`{keepMinConfidence: 0.20, skipMinConfidence: 0.25}` au worker. Ensuite redéployer le gateway
avec les probabilités et rejouer une fois `calibration-jev-v1` (#58).
