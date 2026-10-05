# K06 — qualité et efficacité des synthèses automatiques (Claude, 2026-10-05)

Statut : **huit sorties natives réelles notées** (prose seulement), mesures hors ligne du
prompt, aucune sélection Jev évaluée ici. Sorties produites par Codex (services @9136f58,
contexte `mac-alerts-20261005-v3`, corpus de cette PR @ba9fbe8) :
`~/.ivan-ai-os/mac-alerts-9136f58/editorial-samples-current.jsonl` (variante `current-v3`) et
`~/.ivan-ai-os/mac-alerts-23cf0be/editorial-samples-compact.jsonl` (variante `compact-v1`),
cas I01, I02b, I12 (synthétique), I13. Aucun nouvel appel payant pour ce lot.

## 1. Pertinence : non mesurée

Ces lignes portent `selectionMeasured: false`. `evaluer.mjs noter` affiche désormais
**N/A** et les exclut du dénominateur (correctif de cette PR, testé : prose seule et
sorties mêlées). L'ancien affichage « 0/8 » était faux : ce n'était ni une sélection ratée
ni une raison d'inventer un KEEP. Contrôles codés du contrat : 0 échec sur 8.

## 2. Notation indépendante, à l'aveugle (0–2 par axe, contrat § 9)

Méthode : les huit messages ont été mélangés (graine fixe) et étiquetés A–H. Les notes ont été
fixées avant de lever la correspondance avec les variantes. La correspondance est conservée
hors Git (scratchpad Claude).

| Cas | Variante | Fidélité | Utilité | Action | Effort | Total | Constat principal |
|---|---|---|---|---|---|---|---|
| I01 Next.js | current-v3 | 2 | 1 | 2 | 2 | 7 | Utilité rattachée au « pilote Mac », qui n'exécute pas Next.js : lien inventé. Action proportionnée (inventaire puis vérification de `images.remotePatterns`). |
| I01 Next.js | compact-v1 | 2 | 1 | 1 | 2 | 6 | Utilité conditionnelle mais générique ; action « planifier la mise à jour » avant d'avoir vérifié qu'un projet est concerné. |
| I02b BCE | current-v3 | 2 | 1 | 1 | 2 | 6 | Faits exacts ; utilité vague (« éclaire la veille ») ; action « suivre » sans « rien à faire maintenant ». |
| I02b BCE | compact-v1 | 2 | 1 | 2 | 2 | 7 | « Transmission incomplète » : déduction, annoncée comme telle dans la limite (elle laisse de côté la seconde explication de la source). Action claire. |
| I12 OpenClaw (synthétique) | current-v3 | 2 | 2 | 2 | 2 | **8** | Vérifier la version puis mettre à niveau si concernée ; la limite dit que version et exposition réseau de l'installation sont inconnues. |
| I12 OpenClaw (synthétique) | compact-v1 | 2 | 1 | 1 | 2 | 6 | Utilité mal cadrée (risque d'« interruption » au lieu d'exposition de sécurité) ; mise à niveau sans vérifier d'abord la version installée. |
| I13 ThinkingBox | current-v3 | 2 | 1 | 1 | 2 | 6 | Transforme les **vingt répétitions** du protocole de l'article en exigence pour le pilote : non proportionné. |
| I13 ThinkingBox | compact-v1 | 2 | 2 | 2 | 2 | **8** | « Angle utile, non une exigence imposée » ; test isolé de l'état final, répétitions proportionnées. |

**Totaux : current-v3 27/32, compact-v1 27/32.** Chaque variante gagne deux cas. La fidélité
est bonne partout (aucun fait hors extrait, chiffres étayés). Les écarts portent sur l'utilité
et la proportion de l'action, c'est-à-dire sur le cadrage, pas sur la lecture.

Défauts communs, à corriger côté runtime/prompt (Codex) :
1. Chaque limite commence par « Lecture sur extrait partiel ; les passages omis ne sont pas
   vérifiés ». `renderBrief` @23cf0be l'ajoute quand `excerptTruncated` n'est pas `false` :
   pour I12, la fixture synthétique ne déclarait pas sa couverture, donc le défaut sûr
   s'applique (correction de ma première lecture : ce n'est pas un défaut du runtime ; les
   fixtures doivent déclarer `textChars`). Reste un point d'effort de lecture : la mention se
   cumule souvent avec la même idée reformulée par le modèle.
2. Rattachement abusif au « pilote Mac » (I01) : le contexte doit distinguer ce qui tourne
   dans le pilote (OpenClaw, Jev, Node) des projets d'Ivan en général. Proposition de
   consigne : « Ne rattache une source au pilote que si le composant y est nommé dans le
   contexte ; sinon, formule une condition (“si un projet utilise X”). »
3. Proportionnalité : un protocole d'article (vingt répétitions, mise à niveau immédiate)
   devient une action seulement après vérification qu'Ivan est concerné, et proportionnée au
   coût. Consigne proposée : « Commence l'action par la vérification qui conditionne la suite. »

## 3. Efficacité mesurée

Caractères de prompt, mêmes sources : I01 4069 → 2964 (−27 %), I02b 3772 → 2656 (−30 %),
I12 2967 → 1991 (−33 %), I13 4142 → 2989 (−28 %). Ni tokens facturés ni tarif ne sont exposés
par l'API native. Les durées (10–42 s, appel CLI/RPC compris) ne montrent aucun effet causal
de la taille du prompt : I13 dure ≈ 41–42 s dans les deux variantes.

Conclusion : à n = 4, la variante compacte n'a pas montré de perte de qualité, mais rien ne
prouve non plus qu'elle conserve la qualité. Elle reste **réservée aux évaluations**, jamais
active en production. Prochaine décision possible : après le jeu de pertinence neuf (K03/K06,
branche `agent/claude/alerts-qualification`), sur un échantillon plus large, avec les trois
consignes du § 2 appliquées aux deux variantes.

## 4. Abstention de Jev (rappel)

Codex : la v3 envoie désormais 1200 caractères à Jev (et non plus 500) ; une source Next.js relue
donne encore `keep` 0,26 → `review`. Les seuils ne se baissent pas pour obtenir un reçu : ils se
valident sur le jeu neuf, dont les labels sont fixés avant toute mesure.
