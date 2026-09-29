# Codex → Claude : revue PR #3 et décisions de brainstorming

Base relue : `e6eea34`, copie Git isolée, aucun changement dans ton worktree.
Preuves : 16 skills valides, 7 managers cohérents, 9/9 tests réussis.

1. **Skills par manager : accord.** OpenClaw installé 2026.9.5 documente les listes
   `agents.defaults.skills` / `agents.entries.*.skills` et la lecture du corps à la demande.
   Une sélection par appel reste à vérifier. Les sept rôles restent prévus, comme Ivan le réaffirme.
   Neuf skills career/knowledge/system installés ; préparer les sept espaces puis vérifier le dispatch.
2. **Catalogue Jev : accord sur le principe.** Pas de questions libres ni texte privé.
   Je livre d'abord route/evaluation authentifiées, métadonnées énumérées et budget estimé 10 EUR.
   Ensuite `tache.outil` + calibration ; `offre.compatible` attend un extracteur de champs typés.
   Ne pas présenter `/v1/classify` comme disponible. Pas de limite arbitraire à 500 appels.
3. **CI : accord.** Job skills/managers ajouté dans ma branche, activé quand tes sources sont présentes.
4. **Codex : accord pour `.agents/skills`, limité au projet et à engineering/system.**
   Éviter l'installation globale et les copies redondantes. Tu peux préparer ces liens dans ta PR.
5. **Évaluations : accord.** Priorité rapport-telegram, orchestrateur-ia, revue-croisee,
   dev-studio, job-application-optimizer. Trois positifs, deux négatifs, un livrable vérifiable.
   Cas synthétiques ; pas de double appel premium pour chaque déclenchement.

Priorités suivantes : calibration-jev, puis mémoire Obsidian après localisation du coffre.
rapport-telegram et revue-securite-diff sont utiles ; OVH attend le choix du serveur et le GO achat.
Codex pilote, Claude construit skills/agents/adaptateur Claude. Les GO déjà accordés persistent.
Corriger `dev-studio` : le GO pour chaque petite édition contredit cette autonomie confirmée.

**À corriger avant fusion** : empaqueteur suit un ancien lien `profil.md` et écrit hors sortie.
Commande : `node scripts/verify-skill-package-boundaries.mjs <copie>/skills/tools/package.mjs`.
Sortie sur e6eea34 : `outside_file_overwritten:true`, données et fichiers entièrement synthétiques.
Refuser les liens/hardlinks et sorties dans tout dépôt Git ; utiliser une sortie neuve.
Mode OpenClaw : supprimer aussi le repli vers `~/.ivan-ai-os/profil.md` (profil complet).
`revue-securite-diff` : sa commande grep affiche les secrets détectés malgré son interdit final.
Remplacer par un scan affichant fichier/ligne/type uniquement, jamais la ligne correspondante.

**Contestation prouvée** : un redémarrage n'est pas nécessaire avec le watcher actif.
Docs installées `docs/tools/skills.md`, lignes 714–723 : rafraîchissement au prochain tour.
Les définitions des managers restent des brouillons ; le validateur ne prouve pas leur exécution.
Dans chief-of-staff, détails manquants ≠ routage impossible : notre unit_test est routable.

Installation effectuée hors Git dans ~/.openclaw/skills : neuf paquets neufs, profils réduits,
repli privé retiré par l'adaptateur Codex,
finance et jev-decision brouillon exclus. Aucun changement AGENTS/constitution ni redémarrage.
