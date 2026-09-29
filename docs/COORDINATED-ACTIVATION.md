# Bascule préparée — 2026-09-29

Base : foundation/v1 @f6bb2e3, PR #6 → #7 → #8 fusionnées sur GO d'Ivan.
Codex prépare sur agent/codex/coordinated-runtime ; Claude garde skills/agents/hook Claude.
Le coffre choisi est `~/Ivan AI OS Brain/Obsidian/Ivan AI Os Notes`, configuré hors Git.
La décision de fusion est validée dans la capture d'Ivan ; aucune note personnelle lue ici.

## Résultat concret

- Sept rôles préparés sous `~/.ivan-ai-os/managers-f6bb2e3-coordinated`.
- `main` garde `~/.openclaw/workspace` : quatre fichiers de contexte et douze fichiers mémoire
  inchangés. Les corps mémoire ne sont pas lus. Pas de remplacement de SOUL/USER/AGENTS.
- Le dossier chief-of-staff préparé reste un artefact de revue, pas le workspace actif de main.
  Ses skills existent déjà dans les paquets managed installés ; aucun nouveau profil n'y est copié.
- Finance reçoit recherche-sourcee/rapport-telegram, sans profil privé.
- memoire-obsidian reste chez Claude/Codex ; filtre partagé plan/installation OpenClaw.
  calibration-jev reste brouillon et ne s'installe pas chez les managers.
- La proposition fusionne les sept entrées avec la configuration réelle, garde modèles,
  credentials, bindings, autres plugins et restrictions préexistantes ; collision = refus.
- Source runtime copiée depuis un commit précis hors du checkout, dépendance TypeBox du lock,
  sans scripts npm. Ce snapshot versionné n'est pas protégé contre une modification locale.
- Nouvelle URL proposée : `http://127.0.0.1:4311`. L'ancien service 4310 reste intact.
  Les ports 4310 et 18789 répondaient HTTP 200 lors de cette préparation.

Les propositions privées contiennent les credentials existants, mode 0600/dossier 0700.
Ne jamais les afficher, les joindre à une PR ou copier leur contenu dans un message.
`activation-summary.json` décrit seulement les changements ; `source-fingerprints.json`
permet de détecter une modification du contexte ou de la configuration avant application.
Si la configuration change, notamment après rotation, régénérer la proposition ; ne pas la copier
aveuglément. Aucune rotation, activation, connexion supplémentaire ou dépense n'est démontrée ici.

## Commandes de préparation

`prepare-manager-workspaces.mjs` accepte un quatrième argument : workspace actuel de main.
Le plan conserve ce workspace ; `preparedWorkspace` désigne son artefact indépendant.
`verify-manager-plan.mjs` vérifie les artefacts avec le vrai validateur OpenClaw.

`prepare-runtime-release.mjs <repo> <SHA-40> <nouvelle-sortie-privée>` archive seulement les sources
runtime du commit puis installe le lock avec npm ci --ignore-scripts --legacy-peer-deps.
`prepare-runtime-activation.mjs <config-actuelle> <manager-plan> <nouvelle-sortie-privée>
<binaire-openclaw> [release]` produit une configuration inactive et la valide nativement.
Tous les chemins sont absolus ; sorties neuves hors Git ; aucun restart ni modèle.

Pour le futur pilote autorisé : lancer le snapshot avec `PORT=4311` et
`IVAN_WORKSPACE_ROOT=/Users/yoanpetrov/Ivan-AI-Os`, `node scripts/mac-jev-runtime.mjs --stay`.
La clé TypeSafe est saisie au prompt masqué par Ivan, jamais dans chat/argv/Git.
Le token, le budget estimé 10 EUR/mois et l'audit restent dans le runtime privé par défaut.
Ce pilote dépend du terminal ouvert ; ce n'est pas encore un service permanent ou OVH.
Le catalogue est chargé depuis le snapshot ; les fichiers à évaluer restent ceux du dépôt.

## Ordre d'activation réservé

1. Revue Claude, GO d'activation d'Ivan et remplacement des credentials exposés.
2. Provisionnement privé TypeSafe ; vérifier usage/auth/route réelle sur 4311 avant bascule.
3. Revalider les empreintes, sauvegarder la configuration privée, appliquer la proposition.
   Ne pas changer le binding Telegram vers main ou déplacer sa mémoire.
4. Redémarrer OpenClaw ; vérifier le nouveau contrat natif, puis une DM synthétique découvrant
   ivan_route → manager → worker borné → résultat. Corréler les événements réels, pas le JSON du modèle.
   Si le pilote échoue, restaurer la configuration et le service précédents, sans effacer le budget.
5. Claude active son adaptateur uniquement dans ce projet, shadow, `IVAN_GATEWAY_URL` sur 4311.
   L'observer reste un pilote séparé à préparer : scope explicite, audit privé, latence mesurée.
6. Calibration réelle par Claude : 19 appels routage, trois questions groupées. Le runner ne mesure
   pas encore action.permission ; cette quatrième question exige ses propres scénarios.

## Preuves et limites

Base combinée : 88/88 tests. Correctifs : conservation main, filtre mémoire, merge config,
source plugin épinglée, launcher workspace explicite. Suite combinée : 95/95 tests.
Avant le correctif, le test launcher rendait OUTSIDE_WORKSPACE au lieu de PROTECTED_PROJECT_METADATA ;
le test de main pointait vers un nouveau dossier au lieu de son workspace existant.
Configuration native des sept artefacts et candidate validées, zéro modèle et zéro appel TypeSafe réel.
Snapshot réel : ~/.ivan-ai-os/releases/151b2b1, chargeur natif ivan_route vérifié sur la copie.
Candidate épinglée : ~/.ivan-ai-os/activation-151b2b1, validée, PREPARED_NOT_ACTIVATED.
PR #10 : six jobs CI verts. PR #11 indépendante prépare le holdout (19 cas, 13 multi-tâches),
48 tests gateway et six jobs CI verts ; labels à relire par Claude, aucune précision live mesurée.

Revue mémoire #8 : preuve jetable toujours `telegram_fixture_refused:false`,
`bearer_fixture_refused:false`, nouvelle note mode 0644. Corrections demandées à Claude,
sans toucher son périmètre ni le coffre réel. Un filtre `--max` n'est pas une autorisation.
Le déplacement depuis Documents ne prouve pas un blocage TCC pour tous les processus : notre
ancienne lecture native était refusée par la couche outils, sans EPERM/EACCES.
