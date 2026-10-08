# Inventaire vérifié du pilote Mac — 8 octobre 2026

Source Codex : branche agent/codex/alerts-integration ; worker 6385c5b et plugin alertes 8364b9f actifs,
gateway Jev d35963e conservé. Mode natif avec relecture indépendante.
Référence distante foundation/v1 : 454b21e. Aucune fusion de ce lot.
Historique CI c613533 : 11/11 succès. Lot courant : 196 tests runtime/scripts et 81 skills/agents passent ; lecteur inchangé.

| Composant | Release réellement configurée | Provenance |
|---|---|---|
| Gateway Jev 4311 | orchestrator-d35963e | gateway d35963e, runner Mac cc1d2a5 conservé |
| Worker alertes, toutes les 5 minutes | orchestrator-6385c5b | reprise digest/diagnostic ; file et autres réglages conservés |
| Plugin ivan-ai-os-alerts | orchestrator-8364b9f | 8364b9f ; rédaction et relecture isolées |
| Plugin ivan-ai-os-route | fd2ea04 | fd2ea0447ba0b5cd18980704138d6483d0b677a4 |
| Plugin ivan-ai-os-memory | 8151c01-memory | 8151c01192add035fb8523e8375d6105753962cb |
| Plugin ivan-ai-os-engine-briefs | engine-briefs-5224721 | 5224721e2c88d635ecb7419b3afff582437c3d7e |
| Hook Claude, projet uniquement | claude-hook/c6ead2c | #65 ; installé par Claude, rules.mjs vérifié identique |

Inventaire lu depuis la configuration et les marqueurs des releases, sans copier
jeton, profil, destinataire ou paramètres privés. La version des autres plugins
n'est pas artificiellement attribuée au dernier commit du worker.

Six rôles configurés : main, Business, Engineering, Finance, System, Knowledge.
Career reste défini et conservé, mais absent du registre actif. Production
Knowledge/Anakalypto différée ; mémoire System maintenue. Node services 24.19.0.
Les deux tâches main conservées sont heartbeat et consolidation mémoire ; les
revues Workshop incompatibles restent inactives. Aucun nouveau manager permanent.

## Un seul parcours d'alertes

Sources publiques → collecteur Sentinelle adapté sur Mac et observations Finance
→ file SQLite commune → filtres déterministes → jugement/rédaction natifs
→ contrôles factuels et relecture indépendante → digest via Secrétaire Ivan. Collecte six heures, Finance matin,
Business semaine et suivi de preuve, digest 19:30 Paris ; créneaux durables.

Ancien producteur : FreezyXV/sentinelle, bot @sentinelleenginebot. API GitHub
vérifiée : workflow Sentinelle disabled_manually. L'export candidat reste actif
au sens GitHub mais uniquement workflow_dispatch sur codex/collector-export,
sans schedule, sans Jev et sans envoi. Le Mac lit les flux directement, sans
attendre un artifact et sans second responsable de livraison.

## Contrôle du 8 octobre

Worker 6385c5b activé seul avec sauvegarde VERIFIED. 196 tests concernés passent.
Les pages incertaines restent isolées ; les autres continuent. Rattrapage des
synthèses prêtes la veille avant le digest du jour. Diagnostic par activité.
Panne réseau Telegram à la première tentative automatique de rattrapage ;
quatre sources incertaines au total, jamais réessayées. Sonde native du bot OK
ensuite, sans changement de configuration. Finance fraîche réellement livrée,
reçu 63, qualification manuelle sans modèle/Jev. Ce n'est pas un digest du soir
automatique prouvé. À 10:39 UTC : 5 delivered / 4 delivery_unknown / zéro ready,
Business zéro. Anciens reçus préservés et snapshot final VERIFIED.
Claude #67 c3b428e repris en 335088a ; revue/docs/skills alignés, horloge de test
corrigée par Codex. Transport intermittent reste une limite. Lire le haut du relais.

## Historique — contrôle du 7 octobre

c613533 activé à 08:36 UTC, worker seul. Les anciennes abstentions ne passent
plus avant les nouvelles sources ; les cycles expirés sont fermés ; une panne
fournisseur suspend les autres appels du passage. Quatre reçus conservés,
sauvegarde VERIFIED et aucune modification OpenClaw/Jev/Claude.
Nuit réelle observée, 49 périodes de sommeil/réveils partiels ; les deux cycles
interrompus sont identifiés, zéro cycle fantôme après réconciliation. Six appels
matinaux échouent avant rédaction sur model/list timed out ; succès ultérieurs,
pas de réparation prétendue du fournisseur ni de coût natif inventé.

À 08:37 UTC : trois synthèses approuvées attendent le digest, dont une Finance ;
catalogue Business zéro. Dernière livraison toujours 62. Les pages de date
inconnue et les refus de contenu sont visibles ; ne pas les masquer avec la
santé des services. Preuves dans mac-alerts-c613533/morning-recovery-proof.json.
Voir MAC-NATIVE-RECOVERY.md et le haut du relais. Les sections suivantes gardent
les observations historiques, sans les attribuer au runtime actuel.

## PR ouvertes et intégration

- #21 : livraison des rapports du chef, reste ouverte vers foundation/v1.
- #20 : proposition initiale du runtime ; #45 résolution d'intégration vers
  foundation/v1, #46 reprise Trousseau empilée sur #45. Runner actif cc1d2a5.
- #47 → #48 → #57 : capacités, socle pilote, intégration runtime. #57 reste
  brouillon sur la branche de #48 ; chaque niveau garde son origine.
- Contributions Claude #49–#63 reprises selon les commits de passation/revue.
  Les PR GitHub restent ouvertes : cherry-pick source n'est pas fusion de PR.
  Dernière reprise : #63 84d92d7 → 1425e86 ; correctif runtime d35963e.
- #65 : trois commits repris en 54c61c9, 0264ea9 et ad23aa2 ; 19 tests hook/adaptateur passent.
  Complément c6ead2c repris en 063d402 ; copie privée c6ead2c active,
  mode gate et gateway 4311 conservés ; les quatre options signalées sont corrigées.
  Une option inconnue reste evaluer ; pas de promesse sur toutes les syntaxes shell.
- #64 : 2ab7694/e369e16/4b1e2fd repris en 7f0efd4/a2f2be4/8127e41.
  Onze imports CLI par stdin corrigés et contre-revue K09/K10 conservée.
  Le défaut de famine des lecteurs est corrigé et activé en ab8d294.
- #1 vers main, #17 table de routage, #40 autorisation de fusion et les propositions
  métier hors pilote ne sont pas activées par ce lot.

L'état de fusion ne constitue pas la preuve de déploiement : les marqueurs, les
sondes, la santé, les reçus et les créneaux ci-dessus sont la référence active.
L'ordre d'intégration du socle reste #45 → #46, puis #47 → #48 → #57, avec les
dépendances métier et la revue indépendante ; pas de fusion implicite ici.

## Mesure réelle de ce lot

Trois nouvelles pages Simon lues au premier passage ; deux restent incertaines,
une écartée. La reprise récupère Mistral du 6 octobre (review Jev) et Cloudflare
du 2 (stale, zéro appel). Deux autres lectures sont refusées explicitement pour
date non vérifiée et corps trop volumineux. Les 19 sources encore non lues
comprennent des hôtes non couverts et ces refus ; aucune lecture supposée.

Quatre appels Jev, environ 0,000254 EUR estimé ; aucun natif ni nouvel envoi.
Deux passages de contrôle identiques : aucun appel ni message supplémentaire.
Compteur mensuel : 758 appels, 0,029308 EUR estimé, plafond 10 EUR, inconnus zéro.
Les activations ne changent pas ce compteur. Coût natif indisponible via le SDK.

File : 3 delivered, 33 review, 9 skipped, 5 expired_unsent ; catalogue Business
prod zéro. Les trois livraisons de production sont antérieures à v6. Le reçu
historique Business 61 est distinct et éditorialement insuffisant selon #63.
Ne pas déclarer une nouvelle alerte fraîche réussie pour ce lot.

Sauvegarde vérifiée avant mise à jour et restauration sur copie : trois reçus
préservés, zéro tâche réouverte, zéro appel/envoi. Catalogue WAL couvert par test.
Les journaux pmset des 5–6 octobre ne fournissent pas une longue veille suivie
d'un réveil : une nuit réelle et l'utilité quotidienne restent à qualifier.

Preuves privées : mac-alerts-e2446e5/reader-qualification/result.json,
mac-alerts-0066e49/backlog-qualification/result.json et state-restore-proof.json,
mac-alerts-d35963e/coordinated-activation.json sous ~/.ivan-ai-os/.

## Dernier lot : reprise durable des lecteurs

ab8d294 : erreurs structurelles bloquées jusqu'à une nouvelle empreinte du lecteur ;
pannes temporaires espacées de 30 minutes puis deux heures, trois tentatives max.
Le filtre précède la limite de cent candidats. Lire SOURCE-READER-RECOVERY.md.
Sur copie puis en production : les deux pages en échec sont tentées une fois,
puis zéro lecture au deuxième passage après réouverture. Sur copie, leur état est
également conservé après sauvegarde/restauration ; les trois reçus sont préservés.
Zéro Jev, zéro natif, zéro envoi dans ces vérifications. Compteur Jev inchangé.
Le diagnostic expose deux erreurs persistantes sous CHECK_SOURCE_READS ; elles
n'empêchent pas les autres sources de prendre les places de lecture.

Activation du seul worker, avec sauvegarde/rollback ; fichiers du gateway Jev,
d'OpenClaw et du hook Claude vérifiés inchangés. Santé finale : services et outil
sains, planning chargé, dernier exit 0. File toujours 3 livrés/33 en revue/9 écartés/
5 expirés. Aucune nouvelle synthèse v3 prétendument qualifiée.
Preuves privées mac-alerts-ab8d294/{worker-activation,reader-retry-qualification,
live-reader-retry-proof,health-after-reader-proof}.json et sauvegardes vérifiées.

## Dernière qualification — #66, 7 octobre 2026

La revue Claude 640e2ec est reprise en 5015a28. Worker 9faaadb actif ; Jev,
OpenClaw et réglages Claude inchangés. Next.js 16.4 est désormais lu :
498 948 octets / 17 652 caractères extraits, date primaire concordante.
Une variante Mistral // retirée de la file non lue, identité et duplicateOf conservés.
Un Jev réel, 0,000067 EUR estimé : keep avec confiance 0,47, donc review sous
la politique .75/.75 inchangée. Aucun appel natif ni Telegram. Repassage sans
lecture ni modification de la décision. Aucun message v3 frais revendiqué.

Santé/outil/worker sains ; dernier cycle de flux encore dégradé FEED_UNAVAILABLE.
File : 3 delivered, 34 review, 11 skipped, 5 expired_unsent ; 18 non lues,
14 sélections incertaines et deux refus factuels. Un refus de date Simon persiste.
Jev : 761 appels, 0,029489 EUR estimé, inconnus zéro. Preuves privées et snapshot
final VERIFIED intact dans mac-alerts-9faaadb ; le snapshot initial a servi aux
essais isolés, utiliser state-backup-after-next-reader pour une reprise.
Les sections de mesure antérieures ci-dessus sont historiques.

## Dernier lot — 7 octobre, Jev retiré du tri éditorial

Worker/plugin 8364b9f ; mode native-editorial et verifyNativeBrief=true.
Créneaux natifs de cinq minutes, quatre complétions max par passage. Le relecteur
est lié à la source et au brief exacts. La migration des abstentions préserve
les anciennes décisions et les reçus. Lire NATIVE-ALERT-TRIAGE.md.

Premier passage automatique : deux sources traitées, une écartée et Next.js 16.4
prêt après rédaction et relecture ; 21,526 secondes, trois complétions, zéro Jev.
Livraison de qualification déclenchée manuellement, reçu Telegram 62 confirmé.
Total désormais quatre sources livrées ; les trois anciens reçus sont inchangés.
Un second passage de la même page n'envoie rien. Deux contre-exemples sont refusés
par le relecteur réel. Aucun nouveau benchmark complet ni coût natif inventé.
Compteur Jev inchangé à 761 / 0,029489 EUR estimé, plafond 10 EUR.

Preuves et sauvegarde VERIFIED intacte sous mac-alerts-8364b9f. Le worker peut
continuer de traiter la file : utiliser native-final-health.json pour le dernier
instantané et les diagnostics actifs. Les mesures des sections précédentes sont
historiques. Career/OVH différés ; production Knowledge/Anakalypto attend la fin.

Snapshot après livraison 62 : state-backup-after-native-delivery, VERIFIED ;
le rollback de code conserve la file actuelle et ses nouveaux reçus.
