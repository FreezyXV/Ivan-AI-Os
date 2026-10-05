# Orchestrateur Mac — intégration autorisée le 5 octobre 2026

GO Ivan : collecteurs communs, lecteurs étendus, génération/digest, planning
unique, cycles Business/Finance, reprise et mesures. Branche Codex séparée,
aucune modification des fichiers Claude, de la constitution ou d'AGENTS.md.

## Chemin technique

`scripts/mac-alerts-cycle.mjs <settings.json>` est un passage borné. Launchd
l'appelle toutes les cinq minutes ; SQLite décide quels créneaux sont dus :
flux à chaque tranche de six heures, Finance après 07:30 Europe/Paris,
Business lundi après 09:00, digest après 19:30. Une sortie de veille exécute
le créneau courant une seule fois, sans rejouer les jours manqués. Deux
processus ne peuvent réserver le même cycle. Échec : un seul nouvel essai
après quinze minutes ; panne/crash : bail de quinze minutes, deux tentatives
maximum. Les créneaux et métriques survivent au restart.

Le collecteur local reprend `collector_export.py` de la PR Sentinelle #1
@5c7eab0 avec provenance conservée. Configuration publique séparée, sans son
profil ni son ancien client Jev. Les flux de demande Ask HN remplacent les
listes d'offres produit pour Business. Pas de copie de config.json privé.
Après preuve du nouveau parcours, désactiver le workflow historique distant,
sans fusion sur main ni second collecteur planifié. Retour : arrêter le
LaunchAgent, réactiver le workflow distant ; ne jamais activer les deux ensemble.

## Sources et synthèse

Lecteurs explicites : blog Simon Willison, Hugging Face, Next.js, pages de
presse BCE, demandes Ask HN. Conteneur de contenu, publication de la page
concordant avec le flux, empreinte de réponse, HTTPS sans redirect, limites
d'octets/délai. Un site hors périmètre ou incomplet reste non lu. Le lecteur
n'est pas un navigateur universel et ne prétend pas lire les liens externes.

Jev trie seulement les preuves lues, sur le budget commun existant. Maximum
huit sélections et deux générations par passage de traitement. Confidences
incertaines, sources anciennes et projets reportés ne produisent pas de message.

Le plugin `ivan-ai-os-alerts` fournit `ivan_alert_synthesize` à System seulement.
Il utilise `api.runtime.subagent.complete` : complétion native isolée sans outils,
bootstrap ou historique. Authentification gérée dans le gateway ; aucune clé
copiée et aucun override de modèle. Citations et chiffres contrôlés avant READY.
Le service l'appelle après sélection ; le plugin seul n'est pas un juge de
pertinence. Schéma `coded-brief-v1-provisional`, à relire avec Claude K01/K02,
sans écrire à sa place dans ses skills/contrats.

Le digest regroupe jusqu'à deux éléments si leurs synthèses tiennent dans
2500 caractères. Réservation atomique des éléments avant l'unique envoi,
reçu natif commun à ses éléments. Envoi sans confirmation : inconnu, sans
renvoi automatique. Rien de retenu signifie aucun message. Pas d'urgence
automatique sans un contrat d'urgence calibré.

## Moteurs

Finance conserve les snapshots publics et le client Claude. Adaptations
dans services/alerts-runtime, sans modifier son skill : ICP retiré en février
2026 remplacé par HICP/4D0 ; dernière bougie Kraken en cours retirée avant
calcul. Sources : [BCE, changement de dataset](https://www.ecb.europa.eu/stats/inflation/html/index.mt.html),
[nouvelle série totale](https://data.ecb.europa.eu/data/datasets/HICP/HICP.M.U2.N.000000.4D0.ANR).
Une variation sans avis Jev disponible n'entre pas dans les synthèses automatiques.
URLs d'observation datées empêchent de supprimer à vie les événements futurs
d'un même indicateur. Message « Relevé le » distingue relevé et publication.
Aucun portefeuille, allocation personnelle ou transaction dans ce cycle.

Business ajoute seulement les demandes publiques effectivement lues, puis
utilise signal.pertinent en lot de quatre maximum. Ni score d'opportunité,
preuve de paiement ni recommandation « lancer » ne sont inventés. Des signaux
insuffisants restent exploratoires et la collecte vide reste silencieuse.
La notation approfondie du workflow Business demande plusieurs preuves et
la relecture métier Claude ; un cycle de veille ne la remplace pas.

## Preuves à consigner avant activation complète

Tests de créneaux/DST, concurrence, reprise et livraison inconnue, lectures
et protocole natif de synthèse. Puis source réelle → Jev → génération native
→ reçu Telegram, second passage sans doublon/appel, contrôle des services et
coût Jev avant/après. Compter les générations, durée et taille des sorties.
La complétion native expose sa comptabilité interne ; sans usage/tarif disponible
ne pas inventer un coût premium ni assimiler zéro coût Jev à zéro coût total.
Le corpus indépendant Claude et une période de mesure sont encore nécessaires
pour déclarer la qualité ou la fiabilité en usage quotidien.
