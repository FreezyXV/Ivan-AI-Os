# Abstentions Jev et diagnostic — revue Claude (2026-10-06)

Code relu : `agent/codex/alerts-integration` @`f3f0861` ; runtime observé (diagnostic, Node 24
géré) : `2a51fa1`. Aucune passe ni aucun appel payant ; les sorties privées de
`qualification-pr61-v6/` ont été lues une seule fois.

## 1. Confrontation des deux recours natifs (mesure-v6, collecte simulée, aucun envoi)
- **M01** (label skip) : Jev skip à 0,67 (sous 0,75, donc abstention) ; le natif échoue en
  `VALIDATE` (`ALERT_FACT_UNSUPPORTED`), aucun brouillon conservé. Pas de dommage, mais un appel
  natif dépensé pour un cas qui était du bruit.
- **M03** (label keep) : le natif répond **skip**. Je donne raison au natif sur le fond. L'extrait
  annonce une version d'un plugin de l'outil `llm`, qu'Ivan n'utilise pas ; l'API de comptage de
  tokens qu'il expose ne me semble pas nouvelle (non vérifié) ; le lien avec la mesure du coût natif
  était **ma** déduction, et elle est étirée. Mon label était faible (review aurait été plus juste).
  Il reste figé, mais le « 0/1 utile » de ce jeu tient en partie à ce label discutable : il ne
  prouve pas un défaut de rappel de v6.

## 2. Repêcher une bonne abstention sans ramener le bruit — mesure hors ligne
Sur dev (calibration-jev-v1, sorties v5 enregistrées, `selectionOutcome` du runtime ; réglage
autorisé sur ce jeu), avec le benchmark architecture-v1 **en simple rapport** (déjà consommé) :

| Recours sur les abstentions de Jev (0,75) | Dev : utiles / bruit | Benchmark : utiles / bruit |
|---|---|---|
| Aucun (mode E, base) | 6/14 · 0 | 4/5 · 0 |
| Règle locale « sécurité sur la pile » | 6/14 · 1 | 5/5 · 0 |
| Règle locale « coût sur la pile » | 9/14 · 3 | 4/5 · 1 |
| Règle locale « donnée macro » | 6/14 · 2 | 4/5 · 0 |
| Keep brut de Jev, sans seuil | 10/14 · 6 | 4/5 · 3 |
| Keep brut de Jev **et** règle locale | 8/14 · 1 | 4/5 · 1 |
| P(keep) ≥ 0,5 | 10/14 · 3 | 4/5 · 1 |
| Recours natif sur abstentions (C/D, mesuré) | — | 4/5 · 3 |
| Recours natif v6 (M01/M03) | — | 0 utile récupéré, 1 refus |

**Aucun recours n'augmente le rappel sans ajouter de bruit sur dev.** La règle « sécurité » ne
gagne rien sur dev et son 5/5 sur le benchmark n'est pas réglable a posteriori sur un jeu
consommé. **Recommandation : garder le mode E**, aucun nouveau seuil ; donc pas de contrôle
inédit à préparer tant qu'aucun changement n'est proposé.

Leviers plus prometteurs que les seuils :
1. **Qualité des labels** : un seul annotateur (moi), avec au moins une erreur (M03). Faire
   étiqueter par Ivan 10 abstentions réelles de la file (titre et extrait) pour mesurer l'accord,
   avant toute nouvelle politique.
2. **Refus natifs** (A03, M01) : traiter les causes de `VALIDATE` avant d'élargir le recours natif.
3. **Abstentions vues par un humain, sans modèle** (option, à décider par Ivan) : une fois par
   semaine, au plus 3 abstentions récentes présentées comme « à regarder », chacune avec son fait
   le plus précis cité, jamais un lien nu. Coût nul ; Ivan tranche. À ne pas activer sans son
   accord, puisqu'il refuse les listes de liens.

## 3. Guide de diagnostic actualisé par Codex — relu
Conforme : Node 24.19.0 géré pour les commandes, refus visibles avec compte et raisons
(`alerts.contentRefusals`), refus conservés dans SQLite et jamais rejoués, reprise d'une lecture
sans jamais rouvrir un envoi tenté (`ledger.js` l. 66 et 71, pierre tombale des envois archivés).

**Constat prouvé** : `CHECK_EDITORIAL_REJECTIONS` passe avant `WAIT_DIGEST` et `PROCESS_PENDING`.
Sonde `summarizeAlertCycles` : `ready = 2` et 1 refus donnent `CHECK_EDITORIAL_REJECTIONS` ;
`pending = 5` et 1 refus donnent aussi `CHECK_EDITORIAL_REJECTIONS`. Le compte vient des
éléments encore en revue : un refus ancien masque l'état utile pendant toute sa fenêtre de
fraîcheur (72 h, ou 168 h selon la source). Proposition : rendre `diagnosis` comme une liste ordonnée
de **tous** les codes actifs, ou placer le refus après `WAIT_DIGEST`/`PROCESS_PENDING` tout en
gardant `contentRefusals` séparé.

Distinction à garder dans le guide : les rédactions d'**évaluation** (benchmarks, recours testés)
portent `deliveryMeasured: false` et n'entrent jamais dans la file ; seule une synthèse `ready`
puis un digest avec reçu constitue une **livraison**.
