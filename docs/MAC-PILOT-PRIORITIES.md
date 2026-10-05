# Priorités du pilote Mac — décision Ivan du 5 octobre 2026

Ce document remplace l'ordre de travail antérieur ; les livraisons utiles sont conservées.
Ne pas modifier AGENTS.md ou la constitution pour cette réorientation.

## Périmètre

- Career en pause pour plusieurs mois. La Secrétaire ne délègue plus à ce rôle ;
  conserver son workspace, ses skills et ses données pour reprise, sans collecte Career.
- Knowledge/Anakalypto : chantier de finalisation reporté après le reste du projet,
  à terminer conjointement par Codex et Claude. Ne pas supprimer les fonctions existantes.
- La mémoire utile à System reste active ; reporter Anakalypto ne suspend pas Obsidian.
- OVH/cloud reporté. D'abord tester, mesurer et optimiser le système sur Mac.
- Priorité : qualité des alertes Sentinelle/Secrétaire, Business, Finance publique,
  Engineering, System, livraison fiable, collectes locales et optimisation mesurée.

## Résultat attendu d'une alerte

Une alerte permet à Ivan de comprendre son intérêt sans ouvrir la source :
fait daté et vérifié, synthèse, pertinence par rapport au contexte actuel,
action éventuelle ou « rien à faire », limites, puis lien source.
Le format actuel rapport-telegram (600 caractères, détail dans un lien) est insuffisant.
Viser 1000–1800 caractères si utiles, sans remplir artificiellement ni envoyer de liens seuls.

Filtrage : dédoublonnage et fraîcheur en code, règles de périmètre, Jev lorsque
la pertinence demande une classification, synthèse LLM seulement après sélection.
Jev ne rédige pas les résumés. Lire les sources effectivement ; jamais reconstruire
un article depuis son titre. Un contenu inaccessible doit être signalé ou écarté.
Regrouper les infos ordinaires ; réserver l'alerte immédiate à l'urgence réelle.
Une même source ne doit pas être livrée deux fois par Sentinelle et la Secrétaire.

La personnalisation utilise un contexte compact validé et actualisé : pilote Mac,
construction Ivan AI OS, objectifs Business/Engineering/System, veille Finance publique.
Career est hors périmètre ; Anakalypto et OVH ne sont pas des priorités de développement.
Ne pas injecter le profil complet ni des données privées dans Jev ou les sources partagées.

## Travail sans chevauchement

Codex : services/, hooks/openclaw/, shared/, scripts runtime, collectes,
dédoublonnage, catalogue Jev, interface de personnalisation, envoi et preuves Telegram.
Claude : skills/rapport-telegram/, contrats éditoriaux dans workflows/,
évaluations de pertinence/synthèse, contexte compact proposé et audit des skills.
Claude publie docs/ALERT-EDITORIAL-CONTRACT.md ; Codex consomme le contrat.
Codex pilote l'ordre global, chacun relit la livraison de l'autre ; pas de modification
concurrente des mêmes fichiers, ni du worktree de l'autre, ni de fusion implicite.

## Ordre

1. Consigner la pause Career et le nouveau périmètre dans le runtime, sans effacement.
2. Identifier les producteurs et horaires réels de Sentinelle/Secrétaire.
3. Stabiliser le contrat éditorial et ses exemples avec Claude.
4. Livrer un premier parcours source → filtre → synthèse → Telegram avec reçu.
5. Tester puis mesurer utilité, faux positifs, doublons, ancienneté, temps et tokens.
6. Étendre aux collectes et cycles Mac, puis à l'usine logicielle et à System.
7. Terminer Knowledge/Anakalypto ensemble ; réexaminer OVH après le pilote.

## État vérifié

Sentinelle est mentionné dans le skill, mais son producteur n'a pas été identifié
par la lecture du dépôt ou des LaunchAgents Ivan/OpenClaw. Ne pas prétendre
avoir changé ses alertes avant identification. La nouvelle synthèse est à construire.
La disponibilité générale dépend encore du Mac éveillé et connecté.

Pause appliquée : Career retiré des délégations du chef, config validée et service
redémarré sain. Ses fichiers et le reste de configuration sont conservés. Les
priorités sont ajoutées à USER.md en préservant son contenu antérieur. Preuve
privée : ~/.ivan-ai-os/pilot-mac-20261005/result.json. Aucun envoi Telegram de test.
