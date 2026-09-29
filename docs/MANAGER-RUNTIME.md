# Sept rôles : préparation et preuve attendue

Ivan a confirmé tous les rôles initialement prévus : chef de cabinet, business, career,
finance, knowledge/Anakalypto, engineering et system. Aucun rôle n'est supprimé.

Codex a préparé sept espaces distincts sous `~/.ivan-ai-os/managers`, à partir des sources
Claude relues `fa9c9e0`. Configuration proposée : agent `main` pour le chef, six identifiants
`ivan-<domaine>`, skills actifs limités à chaque manager, profils professionnels réduits.
Finance utilise recherche-sourcee et rapport-telegram **sans profil**. Ivan a explicitement
choisi Finance sur Claude et OpenClaw : macro, informations et opportunités publiques sur
Telegram ; actifs, montants et objectifs personnels contextualisés dans Claude.
Aucune transaction automatique. Une catégorie `portfolio_review` propose le relais privé,
sans transmettre de données personnelles.

Les sept rôles héritent du modèle configuré ; aucun compte, credential ou abonnement copié.
Exec/process restent interdits ; filesystem limité au workspace de chaque rôle. Les managers
ne contactent pas de tiers. Finance dispose d'une liste d'outils pour lecture, recherche et
délégation. Chef → manager → worker temporaire : profondeur 2, trois travaux concurrents au
maximum, deux enfants par parent, durée 300 secondes. Ces limites sont ajustables après mesure.
Le workspace et les instructions ne constituent pas seuls une frontière de sécurité.

`services/manager-runtime` construit un plan de délégation pour les six routes confirmées :
`sessions_spawn`, agent précis, contexte isolated, tâche bornée, résultat au parent.
Ce plan n'exécute rien et n'accorde aucune permission. Il contient seulement les métadonnées ;
le cahier des charges utile reste à fournir au manager. Les définitions et tests ne démontrent
pas encore un manager ou worker exécuté depuis Telegram.

## Préparer et vérifier

`scripts/prepare-manager-workspaces.mjs <source-Claude-relue> <nouvelle-sortie-privée> <profil-local>`
refuse une sortie existante ou dans Git, prépare les sept espaces puis publie la sortie par
renommage. Les profils restent hors Git en mode 0600, dossiers 0700. La vérification des
paquets respecte les exemples de déclenchement qui référencent d'autres skills du catalogue
complet, sans installer ces skills supplémentaires dans chaque manager.

`scripts/verify-manager-plan.mjs <manager-plan.json> <binaire-openclaw>` valide le fragment avec
le vrai OpenClaw dans un état temporaire, contrôle les sept espaces et l'absence de profil
Finance. Validation native 2026.9.5 réussie : 7 rôles, Finance sans profil, dossiers privés.
Aucun modèle démarré, aucune configuration active modifiée.

## Activation coordonnée restante

Fusion des sources après les revues croisées et le GO réservé à Ivan, puis checkout stable.
Provisionner le gateway authentifié avec le contrat metadata et le compteur estimé 10 EUR/mois.
Préparer une fusion du fragment avec la configuration existante, en préservant modèle, bindings,
allowlist Telegram, plugins et credentials ; ne jamais remplacer le fichier par le fragment.
Valider cette configuration et obtenir le GO d'activation avant toute bascule.

Premier pilote : observer et adaptateur Claude en shadow. Vérifier une vraie DM synthétique,
son routage, une délégation au bon manager, un worker borné et son résultat, ainsi que latence,
consommation et absence de données privées dans audit/Jev. Puis élargir les workflows business,
career, finance et knowledge. Une preuve historique de l'ancien ivan_route ne suffit pas.
