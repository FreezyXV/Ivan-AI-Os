# Livraison du chef après une complétion privée

Sur OpenClaw 2026.9.5, une reprise déclenchée par un manager est une conversation interne.
Le texte final ne suffit pas à livrer le résultat à Telegram. Le pilote mémoire B l'a prouvé :
rapport correct à 14:12:39 UTC, aucun envoi message, puis reçu demandé et livré à 14:14:50 UTC.
Career a également nécessité une demande de reçu ; son premier envoi était en file réseau.

La consigne du chef conserve dans `sessions_yield.message` l'obligation de vérifier le rapport,
le livrer par `message` sur la route source courante et contrôler le reçu. La consigne manager
reste distincte : elle vérifie le worker puis retourne au parent, sans accès message.
La destination vient du runtime, jamais d'une note ou d'un résultat du worker.
`ok:true` avec `delivered:false` / `delivery_queued` reste en attente ; le gateway possède les
reprises de file. Ne pas renvoyer une copie ni relancer un routage/worker après livraison.

## Pilote réversible

`scripts/prepare-chief-delivery.mjs OUTPUT` prépare, sans appliquer, une addition à l'AGENTS.md
existant du workspace main déclaré dans la configuration privée. Il conserve chaque octet du
contexte existant et fournit sauvegarde, proposition et empreintes dans un dossier privé neuf.
Une application doit comparer l'empreinte actuelle, ajouter uniquement le bloc proposé,
préserver le mode et remplacer atomiquement le fichier. Le contexte/personnalité d'origine,
les notes mémoire, les canaux, les modèles et les autres managers restent inchangés.
Le script ne touche pas à AGENTS.md du dépôt, ni aux sources/worktree de Claude.
Les nouveaux workspaces préparés utilisent la consigne propre au chef ou au manager.

Sur le GO de poursuite d'Ivan, le bloc f161603 a été appliqué au workspace actuel :
5104 octets originaux conservés, 1056 octets ajoutés ; sauvegarde privée chief-delivery-v1.
Le test Telegram C est terminé : Jev → System → lecture bornée → worker isolé → rapport
vérifié → message sur la route source courante, livré à 14:22:22 UTC et visible sur Telegram.
Un seul routage, un seul envoi et aucune demande de reçu supplémentaire. Le chef a utilisé
la consigne de livraison dans sessions_yield.message. La source est citée avec ses limites.
Preuve privée : chief-delivery-v1/telegram-proof.json. Le worker est accepté et sa complétion
remonte au manager ; sa trace autonome nettoyée n'est pas revendiquée comme conservée.

13/13 tests runtime : délégation, limites, préservation du workspace, launcher et addition
idempotente du bloc sans écraser les instructions existantes. Le parcours live reste nécessaire
pour vérifier le comportement du modèle ; aucun test de texte ne le remplace.
