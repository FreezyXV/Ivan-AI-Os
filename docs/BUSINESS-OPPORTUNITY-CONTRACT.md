# Contrat de fiche d'opportunité Business (Claude, 2026-10-06)

But : une fiche qu'Ivan peut exploiter en moins de deux minutes, qui dit **ce qui est prouvé**,
**ce qui est supposé** et **le prochain test réversible**. Aucune promesse de revenu, aucun
contact d'un tiers, aucun achat. Vérificateur codé : `skills/business-engine/scripts/fiche.mjs`.
Exemple réel : `skills/business-engine/corpus/fiches-v1/exemple-fiche-B01-B02.json`.

## Champs
| Champ | Contenu | Règle |
|---|---|---|
| `sujet` | slug du problème | un problème, pas une solution |
| `probleme` | qui souffre de quoi, d'après les sources | aucun montant absent des citations |
| `acheteur` | `{profil, statut}` | `établi` seulement si un paiement est **observé** ; sinon `hypothèse` |
| `preuves[]` | `{url, date, type, citation}` | citation **non vide (≥ 15 caractères)** et **exacte de l'extrait lu** (jamais du titre) ; `type` ∈ douleur, demande, offre-existante, paiement-observe |
| `sourcesDistinctes` | nombre d'URL distinctes | calculé, pas déclaré |
| `objections[]` | concurrence, taille inconnue, risque de plateforme… | au moins une ; une objection supposée est dite telle |
| `hypothese` | ce qu'on croit, annoncé comme hypothèse | jamais présentée comme preuve |
| `prochainTest` | `{description, dureeJours ≤ 7, coutEur: 0, reversible: true (obligatoire), contactTiers: false}` | lecture, recherche ou prototype local ; ni message, ni inscription, ni publication |
| `decision` | `exploratoire`, `a-noter`, `abandon` ; `creuser`/`lancer` **uniquement** avec `moteur` | deux sources distinctes plus un signal de marché ⇒ `a-noter` |
| `moteur` | `{source: "signals.mjs#scoreOpportunity", entree: {sujet, cible, douleur, criteres, eliminatoires?, jours_premier_euro}}` | le vérificateur **recalcule** avec le vrai moteur : décision et `scoreCode` doivent être égaux au résultat ; chaque critère noté > 1 pointe vers une preuve citée dans la fiche (ou `profil` pour fit/délai MVP) |
| `limites` | ce qui manque pour décider | obligatoire |

## Distinguer
- **Preuve** : ce que dit la citation (une douleur, une demande, une offre payante qui existe).
  Une demande prouve une douleur, pas un paiement ; une offre existante prouve un marché, pas
  qu'une nouvelle offre serait payée.
- **Hypothèse** : l'acheteur probable, la solution, la différence avec l'existant.
- **Recommandation** : seulement le score codé (`signals.mjs` : ≥ 22 lancer, ≥ 16 creuser,
  abandon sans preuve de paiement). Une fiche sans score s'arrête à `exploratoire`/`a-noter`.

## Jeu d'évaluation `fiches-v1`
10 sources publiques inédites (HN, juillet–septembre 2026), réponses attendues figées à part
(`labels.json`, empreinte `5368b47a…`) : 5 utiles, dont deux sources distinctes d'une même
douleur (B01 + B02), 3 preuves trop faibles (question vide, cas de santé isolé et sensible,
plainte générale) et 2 bruits (promotion, essai). Pièges : B05, où le nom de la loi n'apparaît
que dans le titre ; B07, domaine sensible ; B09, une offre ne prouve pas une demande.
Aucune fiche n'a été générée automatiquement : seul l'exemple manuel B01 + B02 existe.

## Montants
Tout montant d'un champ (problème, hypothèse, limites, test) doit figurer **à l'identique en valeur**
dans une citation valide : une devise présente ailleurs n'étaye pas un autre montant (« $5 » cité
n'autorise pas « 999999 € »). Les mots de revenu (MRR, ARR, revenu, chiffre d'affaires) sont
refusés s'ils ne figurent dans aucune citation.

Révision du 2026-10-06 (revue Codex #61) : un `scoreCode` déclaré, une citation vide, un test
non réversible et un montant non étayé étaient acceptés ; ils sont refusés, avec un test de
régression pour chacun. Une entrée JSON incomplète renvoie des erreurs sans planter.

## Interdits
Revenu, prix ou taille de marché inventés ; contact, démarchage, inscription ou achat ;
données personnelles ou de santé collectées ; recommandation sans score codé ; fiche fondée
sur un titre.
