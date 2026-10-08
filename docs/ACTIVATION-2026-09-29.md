# Pilote Mac activé — 2026-09-29

GO d'activation reçu d'Ivan. Base fusionnée : foundation/v1 @fd2ea04.
Codex travaille sur agent/codex/activation-preflight ; aucun changement sur main,
AGENTS.md, constitution ou le périmètre source de Claude.

## Runtime vérifié

- Jev authentifié sur 127.0.0.1:4311, modèle jev-1.13.0, budget commun estimé 10 EUR/mois.
- Smoke réel : unit_test → engineering, provider jev ; usage et absence d'authentification vérifiés.
- OpenClaw 2026.9.5 redémarré avec le plugin épinglé sous ~/.ivan-ai-os/releases/fd2ea04.
- Appel natif tools.invoke réussi : source plugin, provider jev, engineering, confiance 0,96.
- Sept rôles configurés : main et ivan-business/career/finance/knowledge/engineering/system.
- Telegram connecté à @secretaireivanbot ; binding, allowlist, modèles et credentials préservés.
- Main conserve son workspace. À la bascule, quatre fichiers de contexte et douze fichiers
  mémoire inchangés ; aucun corps mémoire lu pour cette comparaison.
- Exec/process interdits ; filesystem limité au workspace. Finance utilise le contexte public.
- Aucun skill mémoire Obsidian chargé dans OpenClaw ; son outil de lecture reste à construire.

La clé fournisseur reste dans le processus. Token, budget, audit, configurations et sauvegardes
restent dans des dossiers privés hors Git ; ne jamais afficher leurs fichiers de configuration.
Ce pilote dépend du lanceur ouvert : ce n'est pas encore un runtime permanent ni un déploiement OVH.

## Preuve Telegram et retour des workers

Test IVAN-ACT-20260929-C observé de 11:04:14 à 11:04:49 UTC :

1. La DM appelle réellement ivan_route : provider jev, engineering, confiance 0,96.
2. Main lance ivan-engineering, contexte isolated, limite 300 secondes, spawn accepté.
3. Le manager lance un worker ivan-engineering, isolated, limite 180 secondes, accepté.
4. Le worker termine. Le manager vérifie les trois assertions et retourne son rapport JSON.
5. Le chef transmet le rapport sur Telegram : appel message et résultat réussi corrélés.

Les cas add(2,3)=5, add(-2,-3)=-5 et add(0,0)=0 sont des tests **proposés**, jamais exécutés.
Les événements ciblés ne montrent aucun exec/process/write/edit ou changement de configuration.
La preuve privée est ~/.ivan-ai-os/activation-fd2ea04/telegram-pilot.json ; aucune session exportée.
Ce pilote valide Engineering ; les cinq autres domaines restent à mesurer en usage réel.

Deux essais antérieurs ont rendu NO_REPLY au lieu du rapport manager. Dans le second, la consigne
de reprise était passée dans acknowledgment. Ce champ est une attente utilisateur, pas le
contexte de reprise. Le troisième réussit avec sessions_yield({message: ...}) et une obligation
explicite de vérifier puis retourner un rapport interne non vide. completionTarget:parent
n'avait pas corrigé seul le problème : il n'est pas ajouté comme obligation générale.

Le contrat est ajouté au plan et au générateur Codex, puis aux six espaces privés générés avec
sauvegardes. Aucun contexte main ou fichier source agents/skills/hooks/claude n'est modifié.
Claude est invité à reprendre cette consigne dans orchestrateur-ia sur son propre périmètre.
Le contrôle reste en partie dépendant du modèle ; ce résultat n'est pas une garantie universelle.

Retest IVAN-ACT-20260929-D avec les instructions installées, sans recopier le protocole de reprise
dans la DM : champ message observé dans sessions_yield, puis rapport retourné sur Telegram à
11:10:32 UTC. Le résultat reçu contient les trois bonnes assertions et tests_executes:false.

Le redactor des événements OpenClaw peut remplacer du JavaScript avec accolades par
[Malformed diagnostic JSON redacted]. Le transcript ciblé de la reprise contient le vrai code :
ne pas assimiler le texte expurgé de télémétrie au livrable reçu par le parent.

## Retour arrière et coordination

Empreintes recontrôlées avant application, sauvegarde privée et remplacement atomique en 0600.
Retour arrière préparé et validé : ~/.ivan-ai-os/activation-fd2ea04/rollback/openclaw.rollback.json.
Il pointe vers le plugin legacy épinglé à 963860a et le service 4310, toujours disponible.
Restaurer uniquement la configuration originale rechargerait le plugin incompatible du checkout.
Ne pas effacer le compteur de consommation lors du retour arrière.

Claude est prévenu : runtime réel prêt, deux calibrations séparées à conserver et adaptateur
shadow à activer dans ce projet seulement. Codex ne relance pas sa calibration en doublon.
46 appels / 0,001293 EUR estimé ont été mesurés dans le compteur commun vers 11:05 UTC ;
ce total ne démontre ni la précision de la calibration ni une facture ou un plafond bancaire.

Validation du correctif de génération : 11/11 tests manager-runtime, sans appel fournisseur réel.
Suites gateway/skills/agents/hook de la base déjà vérifiées : 49/49 et 24/24 ; pas de nouveau
changement dans ces composants. Les approbations exactes et l'observer live restent des jalons ouverts.
