# K07 — relecture des commits runtime Codex (Claude, 2026-10-05)

Commits relus en lecture seule : `72860ea` (planning épinglé, versions officielles),
`db6ac37` (reprises réseau, santé des cycles), `99ee0b8` (docs), sur
`origin/agent/codex/alerts-integration`. Méthode : `git diff 9572e42..99ee0b8`, `git archive`
dans un dossier temporaire, sondes Node sur fixtures, appels **publics** en lecture (API GitHub
releases, changelog brut, Kraken, BCE). Aucun planning, LaunchAgent, jeton ni envoi touché.
`digest.js` et `pipeline.js` n'ont pas changé : les constats A2 (digest) et A1 (extrait)
de `REVIEW-CLAUDE-ALERTS-2026-10-05.md` restent ouverts.

## Constats

1. **Kraken : double suppression de la bougie en cours entre deux PR — majeur, corrigé côté
   Claude.** `engines.js` (72860ea) fait `rows.pop()` ; ma PR #54 retirait aussi la dernière
   ligne. Sonde : runtime + #54 → `PARSE_KRAKEN` sur fixture ; sur les 720 lignes réelles, ce
   serait un décalage silencieux d'un jour. Correctif #54 `e7653a8` : filtrer sur `result.last`
   (horodatage de la dernière bougie close, vérifié en direct : `last` = 2026-10-04, ligne
   finale = 2026-10-05). Même sortie avec ou sans le `pop` runtime (clôture 112 au 2026-10-04 dans
   les deux cas). Après fusion de #54, le `pop` et `modernFinanceUrl` deviennent redondants
   (tous deux idempotents) et peuvent être retirés.
2. **Reprises Finance (db6ac37) — conforme.** Un seul nouvel essai sur 502/503/504 ou délai,
   délai démarré après l'obtention d'un créneau BCE (2 en parallèle). Observé aujourd'hui sans
   ce mécanisme : un échec BCE transitoire puis 7/7 au passage suivant ; le correctif est justifié.
3. **Versions officielles OpenClaw : seules les plus récentes sont vues — moyen.**
   `official-releases.js` prend `releases.slice(0,3).find(stable)` puis s'arrête sur
   `duplicate` au cycle suivant. Données réelles : v2026.9.8 (2026-10-03), v2026.8.35 et
   v2026.8.34 (2026-10-02), toutes dans la fenêtre de 72 h : les deux dernières ne sont jamais
   lues. De plus `CHANGELOG/2026.8.35.md` répond 404 au tag `v2026.8.35` : une version sans ce
   fichier fait échouer tout le collecteur (`OFFICIAL_RELEASE_CONTENT_UNAVAILABLE`).
   Proposition : parcourir chaque version stable fraîche, dédoublonner chacune, et ingérer une
   version sans changelog lisible en `unavailable` (non résumée) au lieu de lever une erreur
   globale. Le composant étant actif dans le pilote, ces versions sont aussi le cas de référence
   I12 de la future voie d'urgence.
4. **`install-mac-alerts.mjs --update` : mises à jour bloquées après la première — moyen,
   lecture du code (non exécuté : LaunchAgent réel).** Ligne 51 : `alerts.rollback.plist`
   est écrit avec `flag:'wx'` ; à la deuxième mise à jour, `EEXIST` arrête le script avant le
   `bootout` (échec fermé, mais plus aucune mise à jour possible sans action manuelle).
   Ligne 54 : un `.update` laissé par un arrêt brutal fait échouer chaque mise à jour suivante
   et déclenche le retour arrière. Proposition : nommer la sauvegarde avec le `sourceCommit`
   précédent, écrire par fichier temporaire unique puis `rename`, nettoyer un `.update` orphelin.
   À vérifier aussi : `--activate` relancé quand le service est déjà chargé (`bootstrap` d'un
   label chargé échoue) ; un `launchctl print` préalable rendrait l'opération idempotente.
5. **`reviseReviewedEvidence` (72860ea) — conforme.** Réparation explicite, limitée aux
   `SELECTION_UNCERTAIN` dont l'extrait a changé, ancienne preuve et reçu Jev conservés,
   idempotente par révision. Elle relance un appel Jev payant par élément : à réserver à un
   changement de lecteur, comme le commentaire l'indique.
6. **Digest — inchangé, A2 ouvert.** Avec les briefs du contrat (1300–1500 caractères), un
   seul élément tient dans 2500 ; les autres expirent sans trace après 72 h.

## Ce qui n'a pas été vérifié

Planning réel, reprise après veille du Mac, reçus Telegram : non exécutés par Claude (périmètre
Codex). Le correctif de la PR #49 (garde-fous) n'est pas installé : la copie épinglée locale
`0a27835` reste silencieuse sur la constitution jusqu'à la bascule par Codex.
