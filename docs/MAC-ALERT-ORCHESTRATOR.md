# Orchestrateur Mac — intégration autorisée le 5 octobre 2026

GO Ivan : collecteurs communs, lecteurs étendus, génération/digest, planning
unique, cycles Business/Finance, reprise et mesures. Branche Codex séparée,
aucune modification des fichiers Claude, de la constitution ou d'AGENTS.md.

État actif : worker @9f7f653, plugin System/gateway @1c769a3, contexte v5.
Mode jev-native-editorial : sélection Jev à 0,75 puis jugement/rédaction native.
Mode natif seul conservé pour comparaison ; benchmark neuf : trois faux keep natifs.
La politique probabiliste en réserve produit un faux keep sur ce contrôle, non activée.
Deux sources réelles retenues et synthétisées automatiquement, reçu Telegram 59 ;
aucune sélection simulée, aucun appel Jev pour ce premier passage natif.
Puis Next.js officiel : keep Jev 0,92, validation native et reçu 60 ; quatre
sélections et une génération au passage conservateur, aucun renvoi au second.
223 tests locaux passent. Processus natif précédent 25 955 ms,
digest 5 187 ms. Qualité indépendante/usage quotidien restent à mesurer.
La file, les secrets locaux et la personnalité de la Secrétaire sont conservés.
Pas de fusion foundation/main. Voir le relais courant pour la provenance complète.

## Chemin technique

`scripts/mac-alerts-cycle.mjs <settings.json>` est un passage borné. Launchd
l'appelle toutes les cinq minutes ; SQLite décide quels créneaux sont dus :
flux à chaque tranche de six heures, Finance après 07:30 Europe/Paris,
Business une fois par semaine ISO après 09:00, digest après 19:30. Une sortie de veille exécute
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

Les trois dernières releases officielles OpenClaw sont examinées par leur API
publique : date réelle, changelog épinglé au tag, empreinte, aucun redirect vers
main. Seules les nouveautés publiées depuis moins de 72 heures entrent en file.
Une release déjà lue ne masque pas les backports récents ; une page indisponible
reste non lue et comptée, sans interrompre la lecture des autres releases.
Le lecteur HF exclut maintenant l'interface `not-prose`, les auteurs et boutons.
Une réparation opérateur de preuve déjà évaluée archive l'ancien extrait et son
reçu Jev dans SQLite, ne modifie pas le sujet/date, ne rouvre jamais un envoi,
et n'est permise qu'une fois par version du lecteur. Le planning ne l'appelle pas.

Mode natif seul (comparaison) : après les exclusions locales, une complétion juge
l'utilité et produit la synthèse seulement pour keep. Les skips/reviews consomment
également un créneau natif : deux tentatives maximum par passage, sans rafale.
Mode Jev conservé pour comparaison : huit sélections et deux générations maximum.
La question mac-v3/context v5 est disponible, sans obligation de passer par elle.
Les probabilités contradictoires donnent review ; aucun seuil keep prioritaire.

Le plugin `ivan-ai-os-alerts` fournit `ivan_alert_synthesize` à System seulement.
Il utilise `api.runtime.subagent.complete` : complétion native isolée sans outils,
bootstrap ou historique. Authentification gérée dans le gateway ; aucune clé
copiée et aucun override de modèle. Citations et chiffres contrôlés avant READY.
Le modèle référence des passages numérotés ; le code insère leurs citations
exactes. L'extrait n'est pas injecté une seconde fois avec les métadonnées.
Le service l'appelle avec purpose assessment dans le mode actif : jugement et
rédaction partagent une seule complétion. Les reçus lient contexte, empreinte
exacte de l'entrée et purpose ; une sortie d'évaluation ne vaut pas production. En production conservatrice, cette complétion suit uniquement un keep Jev à 0,75.
Contrat `alert-editorial-v1`, repris de la proposition Claude K01/K02,
sans écrire à sa place dans ses skills/contrats.

Le digest réserve au plus trois pages par soir, chacune de 2500 caractères
maximum et deux éléments maximum. Les clés de page et reçus survivent au restart ;
une page tentée n'est jamais renvoyée. Les éléments devenus prêts après la
première page peuvent utiliser la suivante le même soir ; trois pages maximum.
Une page sans reçu bloque la continuation automatique. Une synthèse de 2500 caractères part entière
sans titre supplémentaire. Le reliquat reste en file dans l'ordre ; expiration :
`expired_unsent` et raison comptées, jamais abandon silencieux. Envoi sans reçu :
inconnu, sans renvoi automatique. Rien de retenu signifie aucun message. Pas
d'urgence automatique sans contrat d'urgence calibré contre l'inventaire actif.

Correctifs source après PR #50 : extrait par passages réellement lus (1200),
introduction courte et phrases chiffrées/décisions ; longueur totale et couverture
conservées. Le code ajoute la limite d'extrait partiel, y compris aux anciens
enregistrements sans couverture. Les nombres de l'utilité/action sont aussi vérifiés ;
les milliers français/anglais correspondent, les signes restent distincts.
Le contexte source `mac-alerts-20261005-v5` est commun au gateway et au générateur ;
il ajoute cinq faits publics, aucun profil. Fraîcheur 7 jours pour les discours/
communiqués BCE et avis officiels de sécurité Next.js, 72 heures ailleurs,
y compris dans l'export avant lecture. Les instructions manifestes sont mises
en revue avant Jev. Ce filtre ne garantit pas la détection de toute injection.
Seuls les aliases de permaliens Next.js perdent leur barre finale ; les chemins
des autres sites restent distincts (Simon exige notamment cette barre).

Correctif v3 : l'extrait déjà lu de 1200 caractères atteint désormais Jev entier.
Le catalogue générique garde 500 caractères ; les rejets de contacts/identifiants
portent sur tout l'extrait. Le seuil 0,75 concerne la comparaison Jev, pas le mode éditorial natif actif.
Les anciennes mesures restent historiques, jamais une validation du nouveau mode.
`generate-alert-editorial-samples.mjs` mesure quatre fixtures avec le générateur
isolé, sans sélection ni Telegram. Le prompt annonce ce mode ; son reçu ne peut
pas être accepté comme une génération de production. Aucun coût natif inventé.

Mises à jour : répétition idempotente si le service est chargé, sauvegardes uniques,
remplacement atomique et contrôle après démarrage. Panne : arrêter le nouveau job
avant restauration ; signaler distinctement une restauration ratée. Les fichiers
temporaires laissés par une tentative antérieure ne sont ni écrasés ni supprimés.

Compétences : `compatibility` et `manager.runtimes` sont respectés dans le plan source.
Sept rôles conservés ; Engineering sur Codex/Claude reçoit une passation explicite,
pas une exécution shell fictive OpenClaw. La configuration live existante n'est
pas modifiée par cette préparation ; sa migration reste séparée de la mise à jour
du collecteur/générateur. Voir REVIEW-CODEX-K04-K07-2026-10-05.md.

Validation du lot : 59 tests alertes/diagnostic, 58 gateway, 7 lecteur et 6 export,
soit 130 tests. Huit tests Node de régression et le cas Python de décision après
introduction échouaient avant le correctif ; le test de reprise ajouté ensuite
étend la couverture. Deux tests supplémentaires vérifient le rechargement launchd.
Après bootout, bootstrap peut renvoyer EIO pendant le déchargement du précédent
job : huit tentatives courtes au maximum, uniquement sur code 5, aussi lors du
retour à l'ancien plist. Aucun retry sur erreur permanente ni élévation root.
Ceci est une preuve source, pas une preuve live.

## Moteurs

Finance conserve les snapshots publics et le client Claude. Adaptations
dans services/alerts-runtime, sans modifier son skill : ICP retiré en février
2026 remplacé par HICP/4D0 ; dernière bougie Kraken en cours retirée avant
calcul. Sources : [BCE, changement de dataset](https://www.ecb.europa.eu/stats/inflation/html/index.mt.html),
[nouvelle série totale](https://data.ecb.europa.eu/data/datasets/HICP/HICP.M.U2.N.000000.4D0.ANR).
Les changements dépassant les règles publiques de seuil entrent dans la file commune.
Le mode natif n'appelle plus alerte.importante, question encore non qualifiée ;
le jugement éditorial commun décide de la synthèse.
Une expiration réseau transitoire reçoit un seul nouvel essai ; deux requêtes
BCE au plus sont simultanées, avec délai démarré après réservation du créneau.
Erreur permanente HTTP : aucun nouvel essai immédiat. Après ce correctif, les
sept indicateurs publics répondent réellement, zéro erreur (probe du 5 octobre).
Un cycle partiellement indisponible est dégradé et conserve une tentative bornée
après quinze minutes ; il ne compte pas comme une collecte complète réussie.
URLs d'observation datées empêchent de supprimer à vie les événements futurs
d'un même indicateur. Message « Relevé le » distingue relevé et publication.
Aucun portefeuille, allocation personnelle ou transaction dans ce cycle.

Business ajoute seulement les demandes publiques effectivement lues, puis
conserve les preuves en lot de quatre maximum. Le mode natif n'appelle plus
signal.pertinent, question encore non qualifiée ; le jugement commun évalue l'utilité. Ni score d'opportunité,
preuve de paiement ni recommandation « lancer » ne sont inventés. Des signaux
insuffisants restent exploratoires et la collecte vide reste silencieuse.
La notation approfondie du workflow Business demande plusieurs preuves et
la relecture métier Claude ; un cycle de veille ne la remplace pas.

## Preuves à consigner avant activation complète

Tests de créneaux/DST, concurrence, reprise et livraison inconnue, lectures
et protocole natif de synthèse. Puis source réelle → exclusions → jugement/synthèse native
→ reçu Telegram, second passage sans doublon/appel, contrôle des services et
coût Jev avant/après. Compter les générations, durée et taille des sorties.
La complétion native expose sa comptabilité interne ; sans usage/tarif disponible
ne pas inventer un coût premium ni assimiler zéro coût Jev à zéro coût total.
Le corpus indépendant Claude et une période de mesure sont encore nécessaires
pour déclarer la qualité ou la fiabilité en usage quotidien.

## Historique des vérifications du 5 octobre — planning v2

Actualisation après relecture Claude : Jev et générateur épinglés à `2ab2042`,
contexte v2 actif, planning migré sur cette release avec la même file. Bascule
sans appel fournisseur : 252 appels / 0,004726 EUR avant et après.
Un bootstrap immédiat a échoué EIO ; ancienne configuration restaurée et santé
200 vérifiée, puis bascule réussie avec le correctif de retry borné conservé en CI.
Deux passages launchd : sortie 0, aucun doublon ni génération.

Mesure indépendante PR #50 : 14 cas, 12 sélections évaluables, 8 correctes
(66,7 %), dont 3/7 décisions soumises au vrai Jev. Les cinq exclusions locales
sont séparées ; un cas doublon et une demande multi-tâche ne sont pas des
mesures de sélection. Une alternative tolérée est comptée à part. Sept appels,
zéro génération/livraison ; ne pas régler puis prétendre revalider sur ce jeu.
Le programme `evaluate-alert-corpus.mjs` conserve les abstentions, erreurs,
décisions brutes et cas non mesurés. La confiance Choice n'est pas la probabilité
du choix : [documentation officielle](https://docs.typesafe.ai/confidence).

Essai réel Next.js : son conteneur `next-prose` manquait ; erreur reproduite,
test ajouté, correction du lecteur et lecture réelle 4315 caractères / extrait
1198. Le passage de versions n'est plus perdu à la frontière de l'introduction.
Jev réel : review, confiance 0,27 ; zéro génération et zéro livraison forcée.
Une preuve Simon relue par passages est archivée puis réévaluée une fois ;
elle reste en revue. Ces résultats ne prouvent pas un parcours KEEP complet.
Ces corrections supplémentaires du lecteur suivent la release active `2ab2042`.

Cycles publics réels vérifiés séparément : Finance 7 indicateurs, zéro erreur,
zéro changement de seuil, 1899 ms ; Business un candidat lu, doublon déjà connu,
zéro nouveau signal/score inventé, 5 ms. Historique des échecs conservé.
Après calibration et deux essais de preuve changée : compteur 252 → 261 ;
le coût final est à lire dans la preuve santé, jamais estimé depuis le nombre
d'appels seul. Coût/tokens de prose isolée toujours non disponibles.
Preuves : `~/.ivan-ai-os/mac-alerts-2ab2042/` (activation, mesure indépendante,
Next.js réel, révision, cycles publics et inspections de santé).

- Les validations antérieures file/cycles/prose/envoi et moteurs sont conservées
  dans l'historique Git. Le compteur combiné courant est donné en tête de document ;
  il ne mesure pas la qualité éditoriale.
- Lectures publiques : neuf pages acquièrent une preuve. Un signal Ask HN entre
  dans le vrai ledger Business et reçoit son tri Jev. Aucune preuve de paiement
  ou opportunité rentable inventée. Finance : 5–6/7 réponses selon le passage ;
  la série sous-jacente vérifiée directement répond bien avec septembre 2026.
- Dix sélections réelles initiales/révision donnent revue ou rejet, aucune KEEP
  suffisamment confiante. Les décisions sont conservées ; ni seuil abaissé ni
  notification forcée. Ce résultat est un constat de calibration pour Claude K03.
- Génération native sur une vraie source : premier résultat corrigé, 1136
  caractères en 11118 ms. Test technique isolé : tri explicitement simulé,
  génération native réelle, digest reçu 58, puis réouverture SQLite et zéro
  second envoi/génération. L'avis Jev de production n'est pas modifié.
- La route source réelle → KEEP Jev → digest reste à observer. Le test de
  transport ne prouve pas cette sélection ni la pertinence quotidienne.
- `usage.cost` de System affiche zéro entrée pour ces complétions isolées ; le
  contrat native complete ne retourne que le texte. Ne pas interpréter ce zéro
  comme gratuité : coût/tokens de prose non disponibles par cette API.

Preuves privées : `~/.ivan-ai-os/mac-alerts-9572e42/` (lectures, révision,
release officielle, test de transport). File commune conservée dans
`~/.ivan-ai-os/mac-alerts-fff06c4/state/`. Aucun contenu privé dans ces docs.

Installation réversible : `scripts/install-mac-alerts.mjs <settings> --prepare`,
puis `--activate` après arrêt du workflow Sentinelle et contrôle de santé.
Mise à jour : `--update <anciens-settings>` vérifie le planning précédent,
conserve la même file, sauvegarde le plist et restaure l'ancien si bootstrap échoue.
Le plist épingle Node et la release ; aucun destinataire ou secret en arguments.
Retour : `launchctl bootout gui/$(id -u)/com.ivan-ai-os.alerts`, puis
`gh workflow enable sentinelle.yml --repo FreezyXV/sentinelle`. Pas les deux actifs.

Sentinelle distant confirmé `disabled_manually` avant activation locale.
LaunchAgent `com.ivan-ai-os.alerts` chargé, passages courts à sortie 0. Reprise
native contrôlée : aucune sélection, génération ou livraison répétée ; la seule
collecte rejouée est l'essai Finance dégradé autorisé par son bail, puis borné.
Jev : 241 → 252 appels, 0,004367 → 0,004726 EUR estimés, soit 0,000359 EUR
pour dix sélections et un tri Business. Plafond existant 10 EUR conservé.
Ces mesures ne comprennent pas un coût premium inconnu et ne prouvent pas
la fiabilité quotidienne. Lecture de santé : `node scripts/inspect-mac-pilot.mjs`.
