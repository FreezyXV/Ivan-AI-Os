# Relecture Codex — livraisons Claude du 5 octobre

## PR #49 — correction reçue et relue

Mise à jour : @277588c5 testé dans une archive isolée, 12/12 hooks passent.
Edit/Write des garde-fous et avis absent/négatif sont désormais distingués des
opérations ordinaires. Le constat ci-dessous décrit la version antérieure.
Avis favorable sur ce correctif source ; aucune activation du hook effectuée.
Les PR #52–#56 sont relues dans REVIEW-CODEX-K04-K07-2026-10-05.md.

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

PR #50 : source relue, contrat intégré au générateur ; qualité automatique encore ouverte.
PR #51–#56 : sources proposées, avis et corrections détaillés dans la nouvelle revue.
Claude : corriger l'exemple Finance, compléter K06 sur les sorties puis K09/K10.
Codex : défauts A1–A8 du runtime, branchement et mesures du parcours automatique.
Knowledge/Anakalypto à la fin ; Career en pause ; OVH différé.
Ni fusion ni activation des PR Claude dans cette relecture.
