# Contre-revue de clôture du pilote Mac (K09/K10) — Claude, 2026-10-06

Code relu : `agent/codex/alerts-integration` @`9d9062f`. Runtime observé en lecture seule
(`inspect-mac-pilot.mjs`, Node 24.19.0 géré) : `d35963e`, mode `jev-native-editorial`
(mode E, Jev 0,75 puis natif), contexte v6. File de production : 3 livrés, 33 en revue, 9 écartés,
5 expirés. Diagnostics actifs : `CHECK_COLLECTION`, `CHECK_EDITORIAL_REJECTIONS`,
`CALIBRATE_RELEVANCE`, `EXPAND_READERS`. Jev : 758 appels, 0,029 € estimés ce mois.

## 1. Correctif livré dans ce lot (`2ab7694`)

11 scripts de skills levaient `ENOENT` dès leur import depuis stdin (`argv[1] === "-"`) :
`classify.mjs` et les modules qui l'importent, plus d'autres scripts CLI. Le test a été écrit
d'abord : import par stdin avec un `fetch` piégé, donc sans CLI ni réseau. Correctif :
garde commune `skills/tools/cli.mjs#isCliEntry`, qui résout les liens symboliques des deux
côtés ; l'usage normal en fichier et via lien reste inchangé. Résultats : skills/agents 81/81 ;
runtime 139/139, gateway 62/62 et scripts 50/50 sous Node 24.

## 2. Relecture ciblée des changements Codex

| Critère | SHA | Avis |
|---|---|---|
| Reprise des candidats après disparition du flux RSS | `0066e49` | conforme sur le fond (≤ 100 candidats, même budget, mêmes exclusions, aucun envoi rouvert) ; **défaut reproduit** ci-dessous |
| Date primaire Mistral et Cloudflare | `e2446e5` | conforme : date de la page plutôt que du repost, URL Cloudflare et date de page doivent concorder, date future refusée, précision `page-day` ; limite : l'heure réelle (12:00Z chez Mistral) est ramenée à minuit, donc plus ancienne, ce qui est prudent pour la fraîcheur |
| Codes des refus | `e2446e5` | conforme : `FACT_n_INVALID_SHAPE`, `QUOTE_NOT_IN_SOURCE`, `NUMBER_NOT_IN_QUOTE`… sans contenu de brouillon |
| Avertissements Business persistés | `d35963e` | conforme : `qualiteFiche` est rendu avec la fiche, non bloquant |
| Version éditoriale | `d35963e` | `alert-editorial-v3-business-market` actif ; **aucun message réel produit dans cette version** : pas de jugement de sortie |

**Défaut reproduit (`0066e49`) : famine du budget de lecture.** Une page de l'arriéré qui
échoue toujours (corps trop volumineux, date non vérifiable) est relue à chaque cycle, en tête
de l'ordre (les plus récentes d'abord). Sonde : budget de 2, deux pages qui échouent toujours,
une troisième lisible ; sur 3 cycles, les lectures sont toujours p1 et p2, et **p3 n'est
jamais lue**. En production, le budget est de 8 et 2 pages échouent : ce n'est pas encore
bloquant, mais le risque grandit avec l'arriéré. Proposition : mémoriser le code du dernier
échec par URL et ne réessayer que les échecs transitoires (délai) ; une erreur structurelle
(taille, date, hôte non pris en charge) sort du budget jusqu'à un changement de lecteur.

## 3. Vérifié, limité, différé

### Vérifié (preuve en main)
- Chaîne complète de bout en bout : 3 messages de production livrés avec reçu (59 : deux
  synthèses ; 60 : Next.js), plus un essai historique distinct (61, fiche B03).
- Fidélité mécanique : citations exactes, nombres et identifiants contrôlés dans la propre
  citation ; refus tracés par contrôle ; aucun envoi tenté n'est jamais rejoué.
- Sélection : Jev v5 à 0,75 → 0 bruit sur dev (6/14 utiles) et sur le benchmark (4/5) ;
  contrôle v6 : 0 bruit, 0/1 utile (le seul positif portait un label faible, M03).
- Reprise après arrêt et restauration sur copie (Codex) ; services sous Node 24.19.0.
- Garde-fous : Career écarté par code, injection et rumeurs courtes tenues sans appel.

### Limité (fonctionne, mais pas qualifié pour l'usage quotidien)
- **Utilité quotidienne non démontrée** : aucun test historique ne la valide. B03 a été livré
  mais reste **insuffisant** (utilité, hypothèse et test hors sujet Business).
- **Rappel faible** : la plupart des informations utiles finissent en abstention ; aucun
  recours mesuré ne fait mieux sans bruit.
- Coût des complétions natives non exposé ; seul Jev est chiffré.
- Lecteurs partiels : arriéré non lu, famine possible (§ 2), `docs.mistral.ai` non lu.
- **Chiffres Mistral divergents** (annonce : 49B actifs et 1T ; documentation : 52B et 1,05T) :
  à citer séparément, jamais à fusionner.
- **Date d'un README** : la création ou le dernier push d'un dépôt ne datent pas le contenu
  lu. Je retire ma proposition de #63 : une lecture future doit épingler le blob sur un commit
  et dire que la date de publication est inconnue.
- Un seul annotateur (Claude) pour tous les labels, avec au moins une erreur reconnue (M03).
- Pas de veille réelle sur une nuit complète du Mac ; aucun service Mac éteint.

### Différé (décision d'Ivan)
- Career en pause ; OVH reporté ; Knowledge/Anakalypto en dernière étape commune
  (préparation : `K08-KNOWLEDGE-PREPARATION.md`, non activée).
- Urgence immédiate (pas d'inventaire codé) ; seul le digest est actif.

## 4. Pour clore honnêtement le pilote
1. Deux semaines de digest réel, avec Ivan qui note chaque message (utile, pas utile, et
   pourquoi). C'est la seule mesure d'utilité quotidienne qui compte.
2. Faire étiqueter par Ivan 10 abstentions réelles avant toute nouvelle politique.
3. Corriger la famine du budget de lecture (§ 2).
4. Une nuit de veille du Mac instrumentée.

## Addendum — état à `78fd8c1` (2026-10-06, soir)

- Depuis la relecture ci-dessus (`9d9062f`), la branche Codex n'a reçu que les commits du hook
  (reprise de #65 : `54c61c9`, `0264ea9`, `ad23aa2`) et de la documentation : aucun code runtime
  nouveau à relire. Fusion à blanc de cette PR sur `78fd8c1` : sans conflit ; skills/agents
  81/81, runtime 139/139 (Node 24 géré).
- **Hook** : version installée `1c91ce3` (prose citée corrigée, options `-C`/`-c`/`--git-dir`
  couvertes). Complément source `c6ead2c` sur #65, **non installé** (installation coordonnée
  par Codex) : liste fermée des options globales de Git 2.42, dont les quatre options relevées par
  Codex (`--no-optional-locks`, `--glob-pathspecs`, `--noglob-pathspecs`, `--icase-pathspecs`).
  Une option hors de cette liste reste `evaluer` : ce n'est **pas** une protection de toutes les
  formes Git possibles, et les permissions natives de Claude Code restent indépendantes.
