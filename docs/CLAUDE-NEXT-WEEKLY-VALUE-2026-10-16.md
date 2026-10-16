# Lot Claude — revue des résultats utiles, 16 octobre 2026

Codex reprend après une semaine de fonctionnement. Lire le relais courant et
WEEKLY-OUTCOMES-2026-10-16.md ; comparer agent/codex/weekly-value-recovery à
agent/codex/opportunity-loop. Travail isolé dans un worktree propre ; fetch sans
écraser de fichiers. Nouvelle branche agent/claude/weekly-value-review.

Priorités de revue, sans modèle payant ni configuration live :

1. Vérifier que le bilan distingue tentatives, messages et sources, topic et goal,
   coût inconnu et coût nul, qualification manuelle et digest sans intervention.
   Rejouer audit-mac-outcomes.test.mjs et public-demand.test.js.
2. Chercher un contre-exemple au collecteur : index trompeur, source officielle
   différente, texte incomplet, ancien contenu, rejet récurrent ou archive absente.
   Ne pas modifier services/, shared/ ou le worker de Codex ; fournir la preuve.
3. Juger le message 69 et le dossier 1e662e4641f1 : fidélité, utilité réelle,
   objections, coût/effort et plus petit test. L'objection du support Unity est
   déjà connue : ne pas refaire cette recherche. Le meilleur premier fait et
   l'absence de réserves répétées sont demandés dans le prompt v5, pas encore mesurés.
   Distinguer génération automatique et recommandation de construire.
4. Proposer deux sources de demande hors Hacker News : une famille de petites
   entreprises et une de services professionnels, avec preuve publique lue et
   objection. Préparer les exemples dans docs/, aucune collecte live ni prospection.

PR brouillon vers agent/codex/weekly-value-recovery ; pas de fusion ou activation.
Ne pas refaire la mesure Jev : aucun Jev pour les alertes. Career en pause, aucun
VPS ; Knowledge finalisation commune en dernier. Pas de nouvelle question à Ivan
sur un choix déjà confirmé. Les futures décisions n'appartiennent qu'à Ivan.

Les commandes natives Telegram restent à qualifier dans l'interface : le Mac
était verrouillé au contrôle du 16 octobre. Ce blocage UI n'empêche pas les services.
Le coût natif est encore non exposé, pas gratuit. Les six anciennes sources sous reçu incertain
restent isolés. Le dossier initial 6ab5272ce301 et son choix tester restent intacts.
