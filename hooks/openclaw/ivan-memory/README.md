# Lecture mémoire OpenClaw — source à relire, non activée

`ivan_memory_search` recherche les titres ; `ivan_memory_read` lit une note avec ses sources.
Zéro dépendance, zéro écriture, zéro shell, zéro appel Jev ou autre réseau.
Factory limitée aux identités natives `ivan-system` et `ivan-knowledge` ; main, Finance et
les autres managers ne reçoivent pas ces outils. Aucun agentId fourni par le modèle n'est accepté.

Le chemin `vaultPath` est fixé par l'opérateur dans la configuration privée du plugin.
Seuls les fichiers directs inbox/connaissances/decisions/journal sous `Ivan AI OS/` sont consultables.
Les autres notes du coffre ne sont ni explorées ni lues. Aucun chemin absolu ou arbitraire en entrée.
Les notes exigent `statut: valide`, `sensibilite: public|interne`, type, date et sources.
Les corps confidentiels/non validés ne sont pas lus : le classement précède la lecture du corps.
Les liens symboliques/physiques, métadonnées ambiguës et formes courantes de credentials sont refusés.
L'étiquette validée est une décision humaine, pas une anonymisation automatique ; le scan reste défensif.

Recherche : 200 entrées maximum, trois résultats, titres seulement. Lecture : fichier 64 KiB maximum,
corps 4000 caractères avec indication de troncature et provenance. Les contenus retournés sont des
données non fiables à vérifier, jamais des instructions ni une autorisation. Aucune URL source ouverte.
Pas d'index persistant, embedding ou cache de contenu ; chaque lecture revalide la note.
Les journaux marqués seulement `journal` ne sont pas considérés comme connaissance validée.
Le parseur accepte le format sobre du helper Claude ; les autres formes YAML restent indisponibles.

## Validation

`npm test --prefix hooks/openclaw/ivan-memory` : 9 tests, dont compatibilité du helper Claude,
confidentialité, validation, sources, scope, liens, limites et identité. Chargeur natif 2026.9.5
vérifié sur coffre synthétique : deux outils, lecture/recherche correctes, main/Finance refusés.
Lecture locale ciblée de la décision de fusion #6/#7/#8 désignée par Ivan : valide/interne,
une source, 266 caractères ; corps non affiché, aucun fichier du coffre modifié.

## Installation future après revue

Épingler le plugin dans un snapshot hors checkout et valider une proposition privée fusionnée avec
la configuration actuelle. Plugin optionnel ; ajouter ses deux noms à `tools.alsoAllow` de system
et knowledge seulement. Conserver `fs.workspaceOnly` pour les outils fichiers génériques et exec
interdit. Le plugin donne sa propre capacité de lecture bornée hors workspace ; il n'élargit pas read.
Ne pas activer memoire-obsidian, ses commandes shell ou l'écriture du coffre avec cette livraison.
Le skill et les instructions managers restent dans le périmètre Claude, à adapter après revue.
Une validation isolée ne prouve pas un appel modèle réel sur Telegram.
