# Guide de diagnostic — pilote d'alertes v6 (Claude, 2026-10-06)

Revue Claude initiale : `d1893b6`. Correctifs Codex actifs : `2a51fa1`, contexte v6, mode E.
Commande unique, en lecture seule : `~/.openclaw/tools/node/bin/node scripts/inspect-mac-pilot.mjs`. Elle ne lance aucun
modèle et n'envoie aucun message. Exploitation, sauvegarde et restauration :
`docs/MAC-ALERTS-RECOVERY.md`.

## Lire `alerts.diagnoses` (tous les codes actifs)

`alerts.diagnosis.code` reste le premier code pour les anciens clients. Lire la liste
`alerts.diagnoses` : un refus ne masque plus `WAIT_DIGEST` ni `PROCESS_PENDING`.
Les fiches Business validées et réellement scorées sont comptées dans `alerts.business`.
| Code | Signification | Quoi faire |
|---|---|---|
| `CHECK_DELIVERY_RECEIPT` | envoi incertain | regarder Telegram ; **ne rien relancer** |
| `CHECK_EDITORIAL_REJECTIONS` | contenu refusé | vérifier citations/phase ; `alerts.contentRefusals` conserve compte et raisons même en backlog |
| `WAIT_DIGEST` | synthèses prêtes | rien : digest du soir |
| `PROCESS_PENDING` | preuves en attente du prochain passage | vérifier que `com.ivan-ai-os.alerts` tourne (`launchctl list \| grep ivan`) |
| `CHECK_NATIVE_GENERATION` | complétion native indisponible ou trop lente | un seul nouvel essai automatique ; si ça se répète, vérifier OpenClaw (`openclaw_healthy`) |
| `CALIBRATE_RELEVANCE` | sélection incertaine (hors mode natif) | ne pas baisser un seuil ; mesurer sur un jeu neuf (`corpus/mesure-v6`) |
| `EXPAND_READERS` | pages non lisibles | ajouter un lecteur ; jamais résumer un titre |
| `NO_SELECTED_NEWS` | rien retenu | rien : le silence n'est pas une panne |

## Phases d'une synthèse native (`nativeFailure.stage`)
- `COMPLETE` : le modèle n'a pas répondu (panne ou délai) → rejouée une fois après 15 min.
- `PARSE` : réponse illisible → **non rejouée** (`*_INVALID`).
- `VALIDATE` : citation, nombre ou identifiant absent de sa propre citation
  (`ALERT_FACT_UNSUPPORTED`) → **non rejouée**.

Raisons de revue utiles : `SOURCE_EVIDENCE_INSUFFICIENT` (rumeur courte non attribuée, aucun
appel), `SOURCE_NOT_READ`, `SELECTION_UNCERTAIN`, `SELECTION_UNAVAILABLE` (Jev en panne, un seul
nouvel essai), `SYNTHESIS_INVALID`, `NATIVE_ASSESSMENT_INVALID`.

## Évaluation ou livraison
Les rédactions d'évaluation (benchmarks, recours natifs testés) portent `deliveryMeasured: false` et
n'entrent jamais dans la file. Une **livraison** = synthèse `ready`, puis digest, puis reçu Telegram.
Lire, relire ou réparer une source ne rouvre jamais un envoi tenté (`delivery_unknown` reste tel quel).

Correctif Codex après #62 : tous les codes actifs sont affichés ensemble. La priorité
conservée du premier code ne change ni le planning ni les envois.

## Limites concrètes au 2026-10-06
1. **Aucun message v6 livré** (3 messages au total, v5). Six nouvelles sources mesurées :
   zéro bruit retenu mais 0/1 utile retrouvé ; essai natif sur deux abstentions non concluant.
2. Refus désormais visibles (`CHECK_EDITORIAL_REJECTIONS`, compte et raisons), sans
   reprise automatique d'un contenu invalide. Une preuve refusée reste dans SQLite,
   elle n'est pas perdue. Noms complets et alias économiques corrigés et testés.
3. Coût des complétions natives non mesuré ; seul Jev l'est (≈ 0,00006 € par appel).
4. Le comportement pendant une vraie veille du Mac n'est pas mesuré ; aucun service ne tourne
   Mac éteint.
5. Urgence immédiate inactive (pas d'inventaire) : digest seulement.
6. Services Jev/alertes/OpenClaw sur Node 24.19.0 (plists et PID vérifiés). Le terminal
   peut encore résoudre 23.9.0 : utiliser le binaire géré ci-dessus pour le pilote.
7. Career en pause, OVH reporté, Knowledge/Anakalypto en dernière étape commune : rien n'est
   activé dans ce périmètre.
