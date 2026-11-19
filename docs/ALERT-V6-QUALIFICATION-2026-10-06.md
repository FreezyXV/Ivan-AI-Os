# Qualification v6 — six nouvelles sources, 6 octobre

Source/runtime : 2a51fa1 ; contexte mac-alerts-20261006-v6, mode E à .75.
Claude #61 @34fe457, fixturesSha256 c60695d86950e981d5dede4b4207ba0f558cc69d38b8c23e591971b75756267a.
Six captures réelles inédites, labels figés avant appels ; observedAt simulé à
publication +2 h. Pas de preuve de fraîcheur actuelle ou de livraison Telegram.
Passe exclusive sur SQLite isolé avec processNext de production, délai 60 s,
six sélections Jev au plus, aucune nouvelle tentative ni modification des labels.

| Cas | Attendu | Mode E mesuré | Jev brut / confiance |
|---|---|---|---|
| M01 | skip | review | skip / .67 |
| M02 | skip | skip | skip / .79 |
| M03 | keep | review | keep / .64 |
| M04 | review | review | keep / .29 |
| M05 | skip | skip | skip / .81 |
| M06 | skip | skip | skip / .92 |

4/6 exacts, zéro faux keep, zéro utile écarté, mais seul utile non retrouvé (0/1).
Aucune rédaction : les .75 ne sont pas atteints pour les deux keeps bruts.
Coût Jev supplémentaire estimé 0,000397 EUR ; 741 → 747 appels, inconnus 0.
Ce petit jeu teste surtout le bruit, pas le rappel universel. Seuils inchangés.

Essai distinct sans refaire Jev : premières complétions natives sur les deux
abstentions Engineering M01/M03, choisies par priorité fixe puis ordre d'entrée,
jamais par label attendu. Sortie exclusive séparée, aucune livraison.
M01 : ALERT_FACT_UNSUPPORTED, phase VALIDATE ; draft invalide non conservé.
M03 : skip, 5624 ms ; le label utile de Claude doit être confronté à ce jugement.
Aucun article utile récupéré ; recours non activé. Aucun seuil réglé sur ce jeu.
Deux appels natifs, coût/tokens non exposés : SDK installé subagent.complete
retourne {text} (docs/plugins/sdk-runtime/background-work.md), pas un usage facturé.

Preuves privées : ~/.ivan-ai-os/mac-alerts-2a51fa1/qualification-pr61-v6/
results.jsonl, isolated.sqlite et native-review-fallback.jsonl.
Scripts exécutés : /private/tmp/ivan-qualify-pr61-v6.mjs et
/private/tmp/ivan-qualify-pr61-native-reviews.mjs ; ne pas les rejouer.
Zéro mutation de la file live et zéro envoi Telegram pour ces deux essais.
Reste : notation indépendante, jugement d'utilité et contrôle inédit équilibré
avant toute architecture de recours ou nouvelle politique. Les trois messages
livrés du pilote restent ceux de v5 ; aucune qualité de message v6 revendiquée.
