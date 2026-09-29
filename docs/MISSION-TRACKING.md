# Suivi des missions — livraison préparée

Le plugin ivan-ai-os-missions conserve les étapes d'une mission et expose ivan_mission_status :
dix missions récentes, domaine, état, durée, retour manager/worker et réception du transport.
Il évite de confondre « agent lancé », « rapport reçu » et « résultat livré à Ivan ».
Il n'ajoute aucun appel modèle ou Jev, n'envoie aucun message et ne relance pas les files.
Source sur agent/codex/mission-ledger ; activation attend la revue du contrat natif.

Cinq tests passent, dont deux missions concurrentes et reprise du fichier après redémarrage.
Chargeur OpenClaw 2026.9.5 : deux hooks reconnus, outil disponible pour main/System, absent
pour Finance ; événement synthétique persisté par le hook natif. Aucun runtime actif modifié.
Voir hooks/openclaw/ivan-missions/README.md pour installation et limites d'observation.

## Ce qui fonctionne actuellement

| Composant | Preuve |
| --- | --- |
| Jev en fond sur Mac | LaunchAgent, Trousseau, restart natif avec compteur conservé, PR #20 |
| Sept rôles | Configurés ; main garde son contexte, six managers et workers isolés |
| Engineering | Telegram → Jev → manager → worker → trois assertions → résultat |
| Career | Trois questions/critères fictifs vérifiés puis reçus sur Telegram |
| System/mémoire | Recherche/lecture de la note validée puis worker et rapport, PR #14 |
| Livraison du chef | Test C livré automatiquement à 14:22:22 UTC sans relance, PR #21 |
| Finance public | Bref BCE/AMF, trois affirmations vérifiées, reçu à 14:28:21 UTC sans relance |
| Business/Knowledge | Rôles configurés ; parcours utile de bout en bout encore à mesurer |

Jev : 52 appels, 0,001461 EUR estimé au 29/09 à 14:29 UTC, plafond 10 EUR/mois.
Les routes des tests System C et Finance prennent environ 0,5 seconde. Les étapes LLM
et les recherches constituent le reste du délai ; changer le classifieur seul ne le résout pas.
Le contexte final du chef est autour de 33–35k tokens sur ces deux tests ; les compteurs cumulent
plusieurs appels et beaucoup de cache. Ils ne constituent pas une facture API globale.
L'optimisation utile suivante vise le contexte du chef et les allers-retours nécessaires,
sans supprimer la vérification du livrable ni prétendre que tous les moteurs sont terminés.

## Coopération

Dernier état Claude constaté : worktree propre, agent/claude/jev-lesson @92cbdf1.
Ses propositions #17/#18 attendent encore fusion ; Jev reste le routage live.
Aucune revue enregistrée sur #21 au contrôle. Son périmètre reste skills/, agents/ et hooks/claude/.
Relecture utile : #14, #20, #21, puis adaptation du skill mémoire au contrat des outils actifs.
Aucune activité en cours n'est inférée de ses commits ; son worktree n'est pas modifié par Codex.
