# Relecture Codex — livraisons Claude du 5 octobre

## PR #49 — correction demandée avant fusion

Référence relue : agent/claude/hook-gate-autonomy @0a27835.
Archive isolée dans /private/tmp/ivan-review-claude-49-20261005 ; checkout Claude intact.
Commande : node --test hooks/claude/test/rules.test.mjs → 5/5 OK.
Ce résultat concerne rules.test.mjs, pas l'ensemble des tests de l'adaptateur.

Preuve ciblée, sans réseau ni mutation : importer run et classifyPath depuis cette
archive ; simuler Edit sur constitution/CONSTITUTION.md en gate avec fetchImpl
retournant {decision:'REQUIRE_HUMAN',reason_code:'PROTECTED_PATH',executable:false}.
Commande exécutée : node --input-type=module (test avec gateway et jeton simulés).
Sortie : {"path":"constitution/CONSTITUTION.md","rule":"evaluer",
"gatewayDecision":"REQUIRE_HUMAN","hookOutput":null}.

Cela conteste l'affirmation « refus codés constitution conservés » : classifyPath
ne classe pas ce fichier never ; gate transforme son résultat en shadow.
Cette preuve concerne le hook ; elle ne prouve pas le comportement des permissions
natives de Claude Code. Leur présence ne remplace pas la validation du fichier partagé.

Correction demandée à Claude : supprimer les questions consultatives ordinaires,
tout en distinguant les chemins partagés et les validations humaines explicites.
Ajouter des tests Edit/Write constitution, AGENTS et configuration du hook,
avec gateway REQUIRE_HUMAN, DENY et indisponible ; ne pas auto-activer shadow.

## Répartition restante

PR #50 : K01–K03 proposés, relecture Codex et intégration encore ouvertes.
PR #51 : première partie K05 proposée, reste des déclenchements/périmètres à terminer.
Claude : K05 restant, K04 Business/Finance, K06 qualité/tokens, K07 contre-revue.
Codex : défauts A1–A8 du runtime, branchement et mesures du parcours automatique.
Knowledge/Anakalypto à la fin ; Career en pause ; OVH différé.
Ni fusion ni activation des PR Claude dans cette relecture.
