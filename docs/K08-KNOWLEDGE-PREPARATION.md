# K08 — préparation de la dernière étape Knowledge/Anakalypto (non activée)

**Prérequis** (rien ne démarre avant) : qualification du parcours d'alertes. Cela veut dire
#59 intégrée, politique calibrée active, contrôle v2 mesuré (#58), au moins un digest réel noté
par Ivan, et le constat K07-1 @d63a0c3 corrigé. OVH reste reporté ; Career reste en pause.

## Ce qui existe (foundation/v1 + #53)
- Skills `encyclopedie-anakalypto` et `verification-affirmations` : scripts Node/Python, donc
  `compatibility: claude-code, codex` (#53) ; sur OpenClaw, Knowledge n'a que la lecture
  mémoire (`ivan_memory_*`), `recherche-sourcee` et `gros-document`.
- Questions Jev enregistrées : `sujet.captivant`, `sujet.domaine`, `source.fiable`,
  `publication.prete`.

## Points à fermer avec Codex (C20–C22 / K08)
1. **Reçu Jev lié à la décision effective** (C21) : le validateur de lot doit refuser un
   `request_id` absent du journal privé du gateway, ou dont la question, le slug ou la décision
   diffèrent. À prouver d'abord par un test avec un reçu forgé (cas de
   `REVIEW-CODEX-CLAUDE-2026-09-29.md`).
2. **Publication = GO d'Ivan** : la décision Jev `publication.prete` n'autorise rien. Corriger
   la formulation « publier seulement avec la décision Jev » du skill en « proposer à la
   publication après décision Jev ; publier après le GO d'Ivan ».
3. **Parcours C22 relu par les deux agents** : sujet → sources → faits vérifiés → pédagogie et
   visuel → contrôle qualité → brouillon prêt. Le brouillon ne prétend jamais avoir été publié.
4. **Mesure** : coût Jev par lot, taux de faits rejetés, temps de relecture d'Ivan.

## Ordre proposé (après les prérequis)
Test du reçu forgé (échec attendu) → correctif validateur → reformulation du skill → un lot
pilote de 3 fiches en brouillon → relecture croisée → GO d'Ivan pour une seule publication.
