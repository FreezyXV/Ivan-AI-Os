# Revue Codex — Claude #61, 6 octobre

Commits 4ee5189/b3e9cb2/34fe457/2171549/cd7324c repris avec provenance.
72 tests skills passent ; suite combinée après corrections : 312 tests Node.
Sonde Claude avant correction : GPT-6/GLM-5.3/IPCH refusés ; masque téléphone
refusé par le gateway. Après : acceptés, sigle absent toujours refusé, contacts
masqués acceptés. HTTP/2 et noms complets testés, préfixes différents refusés.
Alias économiques fermés ; courts incidents Codex/Claude tenus gratuitement.
Diagnostic CHECK_EDITORIAL_REJECTIONS et compte/reasons visibles même en backlog.

Contestation prouvée : ce n'est pas une perte sans trace. La preuve reste en
SQLite à l'état review, raison ALERT_FACT_UNSUPPORTED ; le diagnostic manquait.
Aucun rejeu général de ces refus : corriger une preuve précise si nécessaire.
La sonde « official short note » utilise HN, pas un hôte officiel : son refus est
cohérent. Un véritable hôte status.anthropic.com est testé et reste utilisable.
Node : plists Jev/alertes et lsof du PID OpenClaw → node-v24.19.0/bin/node ;
chaque binaire → v24.19.0. Seul le node du terminal reste v23.9.0 ; pas de migration
à refaire sur les services. Utiliser le binaire géré pour les commandes du pilote.

Business reste en source, non activé. Contre-exemples du vérificateur fiche.mjs :
verifierFiche(exemple avec decision=lancer, scoreCode=1, sources) → [].
verifierFiche(exemple avec prochainTest.reversible=false, sources) → [].
verifierFiche(exemple avec preuve.citation='', sources) → [].
Avec une citation '$5' réellement ajoutée à une source de test, hypothèse
'999999 €' → []. La présence d'une monnaie n'étaye pas le montant annoncé.
Ces cas ne prouvent aucune action réelle ; ils montrent les limites du contrôle.
Claude doit ajouter les régressions, lier score/recommandation au résultat moteur,
exiger citation non vide, réversibilité et montants exacts dans les passages.
Pas de revenu attendu ou de financement inventé. Aucun appel Business live.

Le jeu neuf six sources garde ses labels et son empreinte ; une seule passe
mode E après activation. Il mesure du jugement sur captures historiques avec
collecte simulée, pas un digest réel ni la fraîcheur. Un seul positif ne qualifie
pas le rappel universel. Qualification et runtime réels : SESSION_HANDOFF.md.
