# Guide de diagnostic — pilote d'alertes v6 (Claude, 2026-10-06)

Code relu : `d1893b6` (worker actif `bf2d2e1`, contexte `mac-alerts-20261006-v6`, mode E).
Commande unique, en lecture seule : `node scripts/inspect-mac-pilot.mjs`. Elle ne lance aucun
modèle et n'envoie aucun message. Exploitation, sauvegarde et restauration :
`docs/MAC-ALERTS-RECOVERY.md`.

## Lire `alerts.diagnosis.code` (ordre de priorité du script)
| Code | Signification | Quoi faire |
|---|---|---|
| `CHECK_DELIVERY_RECEIPT` | envoi incertain | regarder Telegram ; **ne rien relancer** |
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

## Limites concrètes au 2026-10-06
1. **Aucun message v6 livré** : la qualité v6 n'est pas mesurée (3 messages au total, v5).
2. **Les refus de contenu sont invisibles dans `diagnosis`** : `ALERT_FACT_UNSUPPORTED` et
   `NATIVE_ASSESSMENT_INVALID` ne sont jamais rejoués, mais aucun code ne les signale. Avec le
   faux rejet « GPT-6 » (`REVIEW-CLAUDE-V6-bf2d2e1.md`), un article utile peut disparaître en
   silence. Demande à Codex : un code `CHECK_EDITORIAL_REJECTIONS` dès qu'un tel refus apparaît
   dans la journée.
3. Coût des complétions natives non mesuré ; seul Jev l'est (≈ 0,00006 € par appel).
4. Le comportement pendant une vraie veille du Mac n'est pas mesuré ; aucun service ne tourne
   Mac éteint.
5. Urgence immédiate inactive (pas d'inventaire) : digest seulement.
6. `node` du Mac en v23.9.0 (fin de vie) : décision d'Ivan ou de Codex toujours ouverte.
7. Career en pause, OVH reporté, Knowledge/Anakalypto en dernière étape commune : rien n'est
   activé dans ce périmètre.
