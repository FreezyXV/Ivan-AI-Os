# Reprise du service Mac — 2026-10-04

Base : PR #45 `2573f4a`, après intégration des livraisons #35/#36/#37 par Claude.
Branche Codex : `agent/codex/mac-runtime-resilience`, sans changement du worktree Claude.

## Cause prouvée

Runner original + helper synthétique indisponible : exit 1, diagnostic_files 0,
stderr `BACKGROUND_GATEWAY_UNAVAILABLE`. Le plist envoie stdout/stderr vers /dev/null
et KeepAlive relance le processus. La panne temporaire devient une boucle muette.

## Correctif

Le runner attend le Trousseau dans le même processus, retry 5/15/60 secondes,
interrompable à l'arrêt. Diagnostic atomique borné en fichier privé avec états fixes ;
aucune erreur brute ni clé. Un CLI de statut lit le diagnostic et contrôle la santé HTTP.

## Validation

`npm test --prefix services/mac-runtime` : 9/9, dont 3 tests de reprise.
Les 3 tests ajoutés échouaient avant correction ; 3/3 passent après.
Preuve runner Mac synthétique : WAITING_KEYCHAIN → READY, même PID,
STOPPED et exit 0 après SIGTERM, zéro appel Jev, aucune erreur privée reflétée.
Pas de verrouillage du Trousseau réel ; aucun changement de son helper ni de ses ACL.
PR #46 : CI 11/11 verte. Release cc1d2a5 activée sur 4311 ; restart natif,
jeton identique et budget inchangé, zéro appel payant. Deux essais ont restauré
l'ancien plist : kickstart attend le throttle launchd de 60 s, dépassant le timeout
initial de 15 s. L'essai avec timeout 70 s a réussi ; prévoir 75 s dans la procédure.

## Limites

Cette correction traite la boucle de démarrage et sa visibilité. Elle ne résout pas
le verrou budget orphelin, l'oracle local du helper ou la disponibilité d'un Mac endormi.
Le VPS reste une préparation. Les états sources et live seront consignés dans le relais.
