# Corpus éditorial des alertes

- `construction.json` — 4 exemples **utilisés pour écrire** le contrat (C1–C3, dont un cas
  silencieux C2a). Ne pas s'en servir pour évaluer.
- `independant.json` — 14 cas **construits après** le contrat, sur d'autres sources, pour
  l'évaluer : décision attendue, justification, interdits, preuves, éléments à contenir.

Sources `reel: true` : pages publiques téléchargées le 2026-10-05 (curl + extraction texte par
Claude, pas le lecteur runtime), avec `textChars` et `sha256Texte` du texte extrait. Les cas
`reel: false` sont synthétiques et le disent. Les synthèses de `construction.json` sont écrites
à la main : elles montrent la cible, elles **ne testent pas** le générateur automatique.

Contrôles codés : `node skills/rapport-telegram/scripts/verifier.mjs`. Ils détectent citations
inexactes, chiffres non étayés, limite manquante, lien mal placé ; ils ne prouvent ni la
fidélité du sens, ni la pertinence, ni l'utilité. Pour cela, noter chaque sortie sur les cinq
axes du contrat (§ 9) : pertinence, fidélité, utilité, action, effort de lecture, 0–2 chacun.

Pour évaluer le pipeline (C10) : passer chaque `entree.source` du jeu indépendant dans le
parcours réel (filtre → Jev → générateur → rendu), sans montrer `attendu` au modèle, puis noter.
