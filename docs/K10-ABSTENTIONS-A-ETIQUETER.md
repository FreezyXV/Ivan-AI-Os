# Dix abstentions réelles à étiqueter par Ivan (K10)

Sources publiques **réellement lues** par le pilote, puis non envoyées. Extraites le 2026-10-08
d'une copie de la sauvegarde vérifiée `mac-alerts-c613533/state-backup-after-recovery` (aucune
écriture dans la file en service). Aucune panne de fournisseur n'est comptée comme un jugement :
les six `NATIVE_ASSESSMENT_UNAVAILABLE` du matin du 7 en sont exclues. Mélange volontaire des
quatre mécanismes d'abstention et des trois sujets actifs.

**Claude ne tranche pas.** Pour chaque ligne, Ivan répond `aurait dû venir`, `bien écartée` ou
`indifférent`, avec un mot sur la raison s'il le souhaite. Ces dix labels servent à mesurer le
rappel du tri natif avant toute nouvelle politique ; ils ne déclenchent aucun envoi ni benchmark.

| # | Source (date de publication) | Sujet | Écartée par | Ton label |
|---|---|---|---|---|
| 1 | [Comment: EmbeddingGemma 2](https://simonwillison.net/2026/Oct/6/hn-49983751/) (06/10) | engineering | relecteur : `UNSUPPORTED_FACT` | |
| 2 | [A quote from Felix Rieseberg](https://simonwillison.net/2026/Oct/5/felix-rieseberg/) (05/10) | engineering | relecteur : `INCOMPLETE_EVIDENCE`, `UNSUPPORTED_FACT` | |
| 3 | [Release: llm-mistral 0.16](https://simonwillison.net/2026/Oct/6/llm-mistral/) (06/10) | engineering | tri natif : skip | |
| 4 | [A quote from Jake Boggan](https://simonwillison.net/2026/Oct/7/jake-boggan/) (07/10) | engineering | tri natif : skip | |
| 5 | [Comment: Mistral Large 4 (HN)](https://simonwillison.net/2026/Oct/6/hn-49982139/) (06/10) | engineering | ancien tri Jev : skip | |
| 6 | [Money in the digital age: digital euro, tokenisation…](https://www.ecb.europa.eu//press/key/date/2026/html/ecb.sp261006~0da978f159.en.html) (06/10) | finance | tri natif : skip | |
| 7 | [Diagnostic Challenges for ECB Monetary Policy](https://www.ecb.europa.eu//press/key/date/2026/html/ecb.sp261005~1d8d998ef4.en.html) (05/10) | finance | tri natif : skip | |
| 8 | [Where AI risks meet](https://www.ecb.europa.eu//press/key/date/2026/html/ecb.sp261001~cf3c630379.en.html) (01/10) | finance | tri natif : skip | |
| 9 | [X signups now require a face photo](https://news.ycombinator.com/item?id=49949787) (04/10) | business | tri natif : skip | |
| 10 | [Ask HN: What do you run on a $5 VPS that's worth keeping online 24/7?](https://news.ycombinator.com/item?id=49985548) (06/10) | business | contrôle codé : `ALERT_FACT_UNSUPPORTED` (brouillon refusé) | |

Ce qu'un label mesure :
- **1–2** : le relecteur a-t-il bloqué une information utile, ou évité une erreur ?
- **3–4 et 6–9** : le tri natif écarte-t-il trop (rappel), surtout en Finance (trois discours BCE) ?
- **5** : l'ancien tri Jev, conservé comme référence ;
- **10** : un keep dont le brouillon a été refusé par le contrôle des citations. Un « aurait dû
  venir » ici vise la rédaction, pas le tri.
