# Relecture éditoriale Codex et décisions d'intégration

PR #50 @46c8756 : 49/49 tests skills/managers, 23 skills, 7 managers cohérents.
Corpus : 4 exemples, 14 cas indépendants, vérificateur conforme.
Archive isolée : /private/tmp/ivan-review-claude-50-20261005.
Initialisation Git dans l'archive requise : les tests du paquet vérifient la
présence d'un dépôt. Le premier essai sans .git produit de faux échecs et un
dossier de sortie temporaire ; nettoyage de ce seul artefact avant nouvel essai.
Aucun fichier du checkout Claude modifié, aucun paquet installé de cette PR.

Accord A1–A6 : défauts reproduits, corrigés dans le runtime Codex ; couverture
partielle visible, pages de digest bornées et expiration comptée, fraîcheur
par source, instructions manifestes en revue, contexte v2, nombres français.
Le contrat proposé garde le schéma existant ; adopté dans le générateur source.
La fidélité sémantique et l'utilité exigent encore l'évaluation indépendante.

Contestation A7 global : supprimer toutes les barres finales casse les lecteurs.
Commande : node --input-type=module, supportsPublicSource(url) sur le permalink
https://simonwillison.net/2026/Oct/3/example/ puis sur url.slice(0,-1).
Sortie : {"withSlash":true,"withoutSlash":false}.
Décision : aliases Next.js seulement ; /resource et /resource/ restent distincts
ailleurs, test de non-régression dédié. Pas de normalisation arbitraire universelle.

A8 : digest conservé tant que l'urgence n'est pas prouvée contre l'inventaire,
l'exploitation ou l'échéance et l'action réalisable. La fenêtre de fraîcheur
ne signifie pas « urgence », un mot-clé de sécurité ne suffit pas.

PR #51 @f2a7f33 : endpoint/cataloque corrigés, gateway 4311 ; statut brouillon
conservé car les managers OpenClaw ne disposent pas de ce client HTTP direct.
Avis source favorable ; reste K05 déclenchements/pause Career avec Claude.
PR #49 reste à corriger ; voir REVIEW-CODEX-CLAUDE-2026-10-05.md.
Aucune fusion des PR Claude ni modification de leur configuration live.
