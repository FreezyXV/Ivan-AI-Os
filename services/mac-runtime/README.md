# Gateway Mac en service de fond — pilote activé le 2026-09-29

LaunchAgent de l'utilisateur, sans sudo : Jev démarre à la connexion et launchd le relance
après arrêt inattendu, avec temporisation de 60 secondes. Le Mac doit rester allumé et éveillé ;
ce n'est pas un VPS 24/7. Aucun changement de sommeil, de routage ou de modèles OpenClaw.

La clé fournisseur est dans un élément du Trousseau local macOS, service
`com.ivan-ai-os.typesafe`, compte `jev-gateway`. Un petit helper Swift capture la saisie par stdin
et restitue la clé au runner par pipe privé. Jamais dans argv, JSON/plist, fichiers du dépôt,
sorties ordinaires ou logs. Si le Trousseau est indisponible, le même runner attend et
réessaie après 5, 15 puis 60 secondes. Il reprend le démarrage sans redémarrage du processus
dès que l'accès revient. L'attente s'arrête immédiatement sur SIGTERM/SIGINT.
Ne pas invoquer directement le helper en mode read : cette sortie est réservée au pipe du runner.

Le runner utilise une release épinglée hors checkout et une configuration privée 0600, dans un
dossier 0700. Il remplace l'environnement hérité par une liste fermée, écoute uniquement sur
127.0.0.1 et réutilise decision-token, evaluation.jsonl et jev-budget.json du pilote actuel.
La consommation estimée reste limitée à 10 EUR/mois ; aucun smoke payant lors des redémarrages.
Le mode table reste désactivé dans le candidat ; il attend sa fusion et son pilote distinct.

## État vérifié du pilote

Sur GO d'activation d'Ivan, la clé déjà provisionnée au gateway a été transférée au Trousseau
par pipes privés depuis ce seul processus, du même utilisateur. Aucun identifiant dans Git,
argv ou fichier ordinaire. Le lanceur temporaire est arrêté ; le LaunchAgent est en service.
Release runtime a58b99f hors checkout, candidat privé `~/.ivan-ai-os/background-a58b99f`.
Authentification 401 sans jeton, avis déterministe, compteur conservé et empreinte de la
configuration OpenClaw inchangée : vérifiés. Vrai appel natif ivan_route : Jev/Engineering 0,96.
Redémarrage natif réel : nouveau PID, nouvelle lecture du Trousseau, compteur conservé à
48 appels / 0,001349 EUR estimé ; aucun appel fournisseur dans le contrôle de restart.
Le compte et le job isolés de la preuve native sont supprimés ; le service réel demeure.
Preuves privées : activation-result.json, native-smoke.json, restart-proof.json ; ne pas publier
les configurations, le Trousseau, le token ou des exports d'environnement/processus.
Le code reste sur la branche Codex pour revue ; pas de fusion foundation/v1 déduite du pilote.

## Préparation avant bascule

1. Commiter puis préparer la release avec `scripts/prepare-runtime-release.mjs`.
2. `node scripts/prepare-mac-background.mjs RELEASE NODE WORKSPACE RUNTIME OUTPUT` produit
   le helper compilé, settings.json, com.ivan-ai-os.jev.plist et preparation.json privés.
   Le script refuse les sorties existantes et les dépôts Git. Il ne touche pas au Trousseau,
   à launchctl ou au gateway actif. Le plafond et le taux de conversion du compteur existant
   doivent correspondre ; le candidat initial conserve le taux 1 du pilote actuel.
3. Relire les sorties et le code. Provisionner depuis un vrai TTY avec
   `node RELEASE/scripts/mac-jev-keychain.mjs OUTPUT/settings.json` (saisie masquée).
4. Dans la même session opérateur, contrôler l'authentification/usage et sauvegarder le compteur.
   Arrêter seulement le lanceur 4311 actuel ; garder l'ancien 4310 et OpenClaw en place.
5. Installer le plist en 0600 sous `~/Library/LaunchAgents/` puis
   `launchctl bootstrap gui/UID PLIST`. Vérifier /health, 401 sans bearer, /v1/usage avec bearer,
   un avis shell déterministe et un seul appel ivan_route natif ; enfin une DM Telegram utile.
6. Tester un redémarrage du job et la conservation du compteur. Ne jamais faire de kickstart
   du processus Node avec arguments/env secrets ni afficher launchctl print/env ou les configs.

Retour arrière : `launchctl bootout gui/UID/com.ivan-ai-os.jev`, retirer uniquement le plist
installé pour cette étape puis relancer l'ancien lanceur masqué. Garder jeton, compteur,
audit, snapshots et la configuration OpenClaw inchangés. Aucun effacement du Trousseau par défaut.

## Vérifications

`npm test --prefix services/mac-runtime` : configuration privée, environnement fermé, absence
de secrets dans le plist, erreurs masquées, authentification et conservation du budget au restart.
Les tests utilisent un serveur loopback synthétique, sans appel TypeSafe. Un test natif séparé
doit vérifier le helper Swift et launchd avec un compte/label test isolés avant le premier pilote :
`node scripts/verify-mac-background.mjs RELEASE NODE HELPER`. Le script utilise et supprime
seulement son compte Trousseau test, vérifie une authentification et un redémarrage natif,
sans lire la clé de production ni appeler un endpoint payant.

## Diagnostic de reprise

Le runtime conserve uniquement son dernier état dans `background-status.json`, fichier privé
0600 et borné. Les champs sont état, PID, date, nombre de tentatives et délai de retry ; aucune
clé, configuration, entrée utilisateur ou erreur brute. États : `WAITING_KEYCHAIN`,
`BACKGROUND_GATEWAY_READY`, `BACKGROUND_GATEWAY_UNAVAILABLE`, `BACKGROUND_GATEWAY_STOPPED`.
`node scripts/mac-jev-status.mjs SETTINGS_PATH` lit ces métadonnées et contrôle `/health`,
sans lire le Trousseau. La santé HTTP complète l'état enregistré, qui peut devenir ancien
après un arrêt brutal.

Preuve synthétique Mac du 2026-10-04 : premier accès refusé par le helper, retry puis état READY,
même PID, budget à zéro appel, arrêt STOPPED/exit 0 ; aucun détail stderr du helper reflété.
Les neuf tests du service passent. Cette preuve ne verrouille pas le Trousseau de production.

Références : [agents launchd](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html),
[Trousseau Apple](https://developer.apple.com/documentation/security/using-the-keychain-to-manage-user-secrets).
Les contrats Apple complètent les preuves locales ci-dessus ; ils ne garantissent pas un Mac disponible 24/7.
