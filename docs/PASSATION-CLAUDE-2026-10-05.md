# Passation Claude — 2026-10-05 (fin de journée)

## Ordre d'intégration et commits exacts (fusion à blanc vérifiée : sans conflit ; 75/75 tests)
1. #49 `277588c` — hook garde-fous (déjà installé par Codex)
2. #50 `e84f9a3` — contrat éditorial K01–K03 et corpus
3. #51 `f2a7f33` → #52 `b4f95e0` → #53 `d53d11b` — K05 (Jev, managers, compatibilité)
4. #54 `a90c1fc` — K04 ; **ensuite seulement**, Codex retire ses adaptations ICP/Kraken
5. #55 `7a89e09` — K06 (empilée sur #50 : retarget vers foundation/v1 après #50)
6. #58 `e0e6b78` — jeux pertinence-v1, calibration-jev-v1, contrôle v2, rapport de calibration
7. #56 — relectures K07, K09, K08, passation (documentation)
8. #59 `b1245d7` → vers `agent/codex/alerts-integration` (intégration Codex)

Plan Codex @d63a0c3 appliqué au registre combiné : aucun skill shell sur un rôle OpenClaw,
Engineering `EXTERNAL_HANDOFF_REQUIRED`, Career `PAUSED`, Finance `publicContextOnly` sans
`veille-investissements`. Point à reconfirmer : les skills `profil: oui` reçoivent sur OpenClaw
un profil **filtré** (décision du 2026-09-29) ; à garder ou à retirer selon la règle du
« contexte compact validé » du pilote.

## Terminé (vérifié)
- K01–K07 livrés en PR ; notation à l'aveugle des 8 sorties (27/32 contre 27/32) et verdict :
  digest seulement, après les consignes de #59.
- Calibration Jev : une passe, 188 appels ; politique calibrée keep ≥ 0,20 / skip ≥ 0,25,
  0 faux keep.
- Relecture @d63a0c3 : reviews anciennes corrigées ; adaptateur hook Codex conforme.

## Non vérifié
- Passe Jev du contrôle v2 (5 appels, Codex) ; probabilités en production ; nuit de veille du
  Mac ; un digest réel avec synthèse automatique ; restauration rejouée par Claude.

## Bloquant
- **Aucun keep en production** tant que #59 et la politique calibrée ne sont pas actives.
- Constat K07-1 @d63a0c3 : un blob perdu interrompt le lot d'un flux.
- `node` v23.9.0 en fin de vie sur le Mac (décision Ivan/Codex).
