# Passation Claude — 2026-10-05 (soir)

Statuts : **source** = code/doc en PR brouillon, rien de fusionné ni d'activé ; **évalué** = noté
ou sondé par Claude ; **runtime réel** = vérifié par Codex sur le Mac (preuves privées Codex).

| Lot | PR @SHA | Statut | Ce qui est prouvé |
|---|---|---|---|
| Hook garde-fous | #49 @277588c | source + **installé par Codex** | 12/12 ; constitution/AGENTS/réglages : un avis négatif ou absent déclenche une demande ; commandes ordinaires sans question |
| K01–K03 contrat | #50 @46c8756 | source | corpus 4 + 14 cas, vérificateur codé |
| K04 Business/Finance | #54 @a90c1fc | source | HICP + Kraken `last` idempotent (relu par Codex) ; attribution à l'énergie retirée |
| K05 skills/managers | #51, #52, #53 | source ; plan Codex @23cf0be conforme | sonde : aucun skill shell sur rôle OpenClaw, Engineering externe, Career PAUSED |
| K06 qualité | #55 @116ef7f | **évalué** | 8 sorties natives réelles, notation à l'aveugle 27/32 vs 27/32 ; pertinence N/A |
| K03/K06 jeu neuf | #58 @09380c6 | source | 15 cas, labels avant mesure, assembleur ; essai hors ligne 0 appel |
| K07 #57 | #56 @(cette note) | **évalué** @23cf0be | saturation par `review` (prouvée), dédoublonnage par titre (prouvé), blob perdu |

Rien n'est dans le runtime réel du fait de Claude, sauf le hook #49, installé par Codex.
Aucune sélection Jev n'a été lancée par Claude ce jour, et aucun envoi Telegram n'a été fait.

## Prochaines actions
1. Codex : passe Jev unique sur `pertinence-v1` (assembleur #58) ; corriger K07-1/2/3 ;
   aligner la fraîcheur des interviews BCE (`/press/inter/`, 72 h contre 168 h pour les discours).
2. Codex/Ivan : `node` du Mac = v23.9.0, en fin de vie et non couvert par l'avis de sécurité
   Node.js du 2026-07-29 (lignes 26/24/22) ; décider de la ligne cible avant d'épingler le
   LaunchAgent.
3. Claude : noter la passe #58 avec `evaluer.mjs` ; relire le prochain SHA de #57
   (rétention des `review`, `hooks/codex`, `backup-alert-state.py`).

## K09/K10 — limites ouvertes à reprendre
- Pas de mesure d'un vrai cycle veille/réveil ni d'une période quotidienne de qualification.
- Aucun KEEP Jev réel confirmé sur source indépendante ; seuils non calibrés.
- Stockage d'archives croissant (pas de purge) ; dédoublonnage exact, non sémantique.
- Coût de la prose (complétions natives) non exposé ; seuls les appels Jev sont mesurés.
- Knowledge/Anakalypto en dernier ; Career en pause ; OVH reporté.
