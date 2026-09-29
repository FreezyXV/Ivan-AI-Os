# Pilote mémoire OpenClaw — 2026-09-29

Sur GO explicite d'Ivan, les outils `ivan_memory_search` et `ivan_memory_read` sont actifs
pour `ivan-system` et `ivan-knowledge`, depuis le snapshot 8151c01 hors checkout.
La zone est `Ivan AI OS/` du coffre choisi. Main et Finance ne disposent pas de ces outils.
La configuration garde les sept rôles, le workspace de la Secrétaire, les canaux et le routage.
Les notes ne sont pas modifiées. La sauvegarde privée permet le retour arrière.

## Preuves

- 10/10 tests mémoire après intégration avec provenance du correctif Claude #16.
- RPC natif réel : recherche et lecture de la décision de fusion #6/#7/#8 fonctionnent pour
  System et Knowledge ; main/Finance refusés. Un seul titre, une source, corps de 266 caractères.
  Aucun appel fournisseur dans cette vérification.
- Test Telegram `IVAN-MEM-20260929-B`, 14:11–14:12 UTC : Jev sélectionne System (0,80),
  le chef délègue en contexte isolé, le manager recherche et lit la note désignée puis crée
  un worker isolé. Les deux spawns sont acceptés. Le paquet de complétion du worker est reçu
  et le manager retourne un rapport vérifié. Sa trace autonome est nettoyée par le runtime :
  elle n'est pas revendiquée comme conservée.
- Le rapport donne #6/#7/#8, foundation/v1, f6bb2e3, titre/date/source. Le manager distingue
  les six jobs cités par la note des quatre checks affichés sur la page de #8.
- La reprise privée du chef produit ce rapport mais ne le livre pas automatiquement au canal.
  Un reçu explicite, sans nouveau routage, worker ou lecture, est visible sur Telegram à
  14:14:50 UTC ; l'outil message confirme sa livraison. Ce défaut de reprise reste à corriger.
- Aucune commande shell ni écriture dans le parcours observé. Le contenu de la note reste
  une preuve à vérifier ; aucune instruction récupérée ne devient une autorisation.

Le premier test utilisait par erreur le label `memory` : refus avant délégation. Le label
contractuel est `organize_notes`. L'absence des outils mémoire chez main est normale : il délègue.

## Exploitation et coordination

Le redémarrage natif OpenClaw a attendu 303 secondes : son contrôleur gardait le verrou de
maintenance tandis que le nouveau gateway attendait. Après expiration, le gateway a repris.
Une relance du LaunchAgent conservant sa définition a été faite pendant le diagnostic.
Aucune base, personnalité, mémoire ou configuration de canal n'a été réinitialisée.

Jev fonctionne désormais en LaunchAgent indépendant du terminal, depuis a58b99f, Trousseau
local et compteur existant ; source et preuve de restart sur PR #20. Career a aussi retourné
ses trois questions/critères fictifs sur Telegram après reçu explicite.

Preuves détaillées privées dans `~/.ivan-ai-os/activation-memory-8151c01/` :
activation-original.json (rollback), native-live-proof.json et telegram-run-proof.json.
Ne pas publier les configurations privées. La PR #14 livre le plugin et ce compte rendu ;
activation pilote ne vaut pas fusion Git. Claude peut adapter son skill au contrat sans shell,
mais ses sources et son worktree restent inchangés par Codex.

Prochaine correction : le chef doit garder dans sessions_yield.message l'obligation de livrer
au canal courant après vérification, par l'outil message, et vérifier son reçu ; une réponse
finale sur une reprise privée ne suffit pas. Aucune destination ne doit venir d'une note.
