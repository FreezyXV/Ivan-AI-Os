# K09 — utiliser le pilote d'alertes sur le Mac (scénario simple)

Relu sur `agent/codex/alerts-integration` @d63a0c3 (`MAC-ALERTS-RECOVERY.md`, `USER_ACTIONS.md`,
`inspect-mac-pilot.mjs`) et **essayé en lecture seule** le 2026-10-05 au soir : OpenClaw sain,
Jev sain (0,013 € ce mois), release active `0b098d7`, file : 19 en revue, 3 écartés, 3 expirés,
**0 synthèse générée**, diagnostic `CALIBRATE_RELEVANCE`.

## 1. Démarrage — rien à faire
Mac allumé et session ouverte : `com.ivan-ai-os.jev` (gateway, 4311) et `com.ivan-ai-os.alerts`
(un passage toutes les 5 minutes) démarrent seuls. Contrôle facultatif :
`launchctl list | grep ivan` → deux lignes ; la première colonne de `alerts` vaut `-` entre deux
passages (normal).

## 2. Diagnostic — une commande, un code
Depuis le dépôt : `node scripts/inspect-mac-pilot.mjs`, puis lire `alerts.diagnosis.code` :

| Code | Ce que ça veut dire | Quoi faire |
|---|---|---|
| `NO_SELECTED_NEWS` | rien retenu ; le silence n'est pas une panne | rien |
| `WAIT_DIGEST` | des synthèses attendent le digest du soir | rien |
| `CALIBRATE_RELEVANCE` | Jev s'abstient (état actuel, mesuré) | Codex : politique calibrée de #59, pas de seuil forcé |
| `EXPAND_READERS` | des pages ne sont pas lisibles par les lecteurs | Codex : lecteur à ajouter ; jamais de résumé du titre |
| `CHECK_DELIVERY_RECEIPT` | un envoi est incertain | regarder Telegram ; **ne rien relancer** |

Aussi : `openclaw_healthy`, `jev.healthy`, `latest[].degraded` (source en échec).

## 3. Digest du soir
Après 19:30 (Europe/Paris), au plus 3 pages de « Veille utile — Ivan AI OS ». Pas de message =
rien de retenu. Un message ne part qu'une fois, même après un redémarrage.

## 4. Pannes courantes
- **Mac en veille ou éteint** : les passages manqués ne sont pas rejoués ; le créneau en cours
  s'exécute au réveil. Rien à faire.
- **Jev indisponible** : les éléments passent en revue (`SELECTION_UNAVAILABLE`), avec un seul
  nouvel essai après 15 minutes ; aucun message n'est envoyé au hasard.
- **OpenClaw indisponible** : la synthèse est indisponible, l'élément reste en revue, rien n'est
  envoyé.
- **Envoi incertain** : `CHECK_DELIVERY_RECEIPT` ; il n'y a jamais de renvoi automatique.
- **Sauvegarde ou restauration** : `scripts/backup-alert-state.py`, toujours dans un dossier
  neuf, puis une copie ; ne jamais remplacer la base active (`MAC-ALERTS-RECOVERY.md`).
- **Revenir à la version précédente** : `install-mac-alerts.mjs --update` avec les anciens
  réglages (Codex).

## 5. Limites concrètes au 2026-10-05
1. **Aucune synthèse automatique en production** : 0 génération ; la règle 0,75 ne retient aucun
   keep (calibration #58). Activer la politique calibrée de #59 est le préalable.
2. Mac en veille : comportement non mesuré sur une vraie nuit ; pas de service pendant le sommeil.
3. `node` du Mac = v23.9.0, en fin de vie et hors des lignes corrigées par Node.js : à remplacer
   avant de déclarer le pilote stable.
4. Un blob d'archive perdu interrompt encore le lot d'un flux (K07 @d63a0c3, constat 1).
5. Pas de voie d'urgence immédiate ; le digest seulement.
6. Coût des synthèses natives non exposé ; seul Jev est chiffré.
7. Archives croissantes, sans purge ; dédoublonnage exact (v2 en attente, #59).
