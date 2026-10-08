## État courant — digest repris et Finance livrée, 8 octobre 2026

Worker 6385c5b actif ; plugin alertes 8364b9f, Jev d35963e et hook Claude
c6ead2c conservés. Mode natif avec seconde lecture ; aucun Jev pour les alertes.
196 tests runtime/scripts concernés passent. PR Claude #67 c3b428e reprise avec
provenance en 335088a : revue du message 62, skills/contrat/guide alignés.
Défaut d'horloge confirmé par Claude déjà corrigé dans le lot 6385c5b.

Ivan confirme aucun message depuis le reçu 62 (7 octobre 00:28 Paris).
Digest du 7 vers 21:41 interrompu pendant Low Power Sleep, batterie 1 % ;
aucun reçu, deux sources delivery_unknown. Défauts corrigés : cette page ne
bloque plus les autres, rattrapage au réveil des seules synthèses prêtes la
veille, diagnostics conservés par activité, résultat incertain dégradé.
Tests sur lendemain, DST/année, pages limitées et absence de renvoi.

Rattrapage automatique du 8 à 12:34 Paris : deux autres sources réservées,
panne réseau native sendMessage, état incertain conservé. IPv4 public et
sonde bot réussissent ensuite ; IPv6 direct échoue. Aucune configuration
réseau modifiée : ne pas revendiquer une réparation permanente du transport.
Qualification manuelle séparée, source Finance fraîche : taux US à 10 ans,
message 63 confirmé, zéro appel modèle/Jev. Les quatre sources incertaines
ne sont pas rejouées. Aucun nouveau digest automatique réussi encore prouvé.

À 10:39 UTC : delivered 5, delivery_unknown 4, expired_unsent 16, review 41,
skipped 25 ; zéro ready/pending/processing. Catalogue Business toujours zéro.
Anciens reçus et anciennes tentatives intacts. Sauvegarde après reçu 63 VERIFIED.
Preuves privées mac-alerts-6385c5b/{digest-recovery-activation,
fresh-finance-qualification,final-digest-proof}.json ; snapshot de reprise
state-backup-after-message-63. Garder la file actuelle pour un retour de code.

Claude note message 62 à 9/10 (fidélité 2/2), pas une mesure d'utilité Ivan.
Uceprotect ajoute une précision non portée par sa propre citation ; appartient
aux tentatives incertaines, ne pas la renvoyer. Ancien discours BCE fidèle
mais pauvre/expiré ; ne pas le confondre avec la nouvelle observation Finance.
Reste : digest ordinaire automatique vérifié, qualité Business/Finance,
transport Telegram intermittent, coût natif, Engineering/mémoire et consolidation,
puis Knowledge/Anakalypto commun. Career en pause, OVH différé.

## Historique — reprise du 7 octobre

## État courant — reprise nocturne et priorité des sources, 7 octobre 2026

Worker c613533 actif ; plugin alertes 8364b9f, Jev d35963e et hook Claude
c6ead2c inchangés. Mode native-editorial avec relecture indépendante, zéro Jev
pour les alertes. 284 tests Node concernés passent. CI c613533 : 11/11 verte.

Correctifs activés : les nouvelles sources et le travail interrompu occupent
les places avant la migration des anciennes abstentions ; les cycles expirés
sont fermés avec CYCLE_INTERRUPTED ; une panne fournisseur arrête le passage
après le premier échec, sans consommer la file restante. Un refus de contenu
ne coupe pas un fournisseur sain. Lire MAC-NATIVE-RECOVERY.md.

Nuit réellement observée : 49 périodes de sommeil entre 00:34 et 10:01 Paris,
avec réveils partiels ; deux cycles restés running après expiration. Fermés
après correctif, zéro cycle fantôme au contrôle et quatre reçus préservés.
Six erreurs matinales viennent de model/list timed out dans la passerelle locale
Codex (~5,3 s), avant rédaction. Les appels ont ensuite repris sans modifier le
modèle. Le transport interne reste externe ; ne pas revendiquer sa réparation.

État à 08:41 UTC : services sains, 4 livrées, 3 prêtes, 4 pending, zéro processing ;
deux dates non vérifiées et des refus/outages restent visibles. Finance BCE a
une synthèse approuvée en attente, pas une nouvelle livraison revendiquée ;
catalogue Business toujours zéro. Le traitement courant continue automatiquement.
Premier cycle c613533 terminé en 49,553 s, trois appels natifs et zéro Jev,
sans nouvelle fiche ni livraison. CHECK_PROCESS_RECOVERY effacé par ce succès.
Jev reste 761 appels / 0,029489 EUR estimé. Aucun nouvel envoi dans ce lot.

Preuves privées : ~/.ivan-ai-os/mac-alerts-c613533/{worker-activation,
morning-recovery-proof,final-recovery-proof}.json et state-backup-before-provider-recovery VERIFIED ;
première qualification matinale dans mac-alerts-32dcdff/morning-recovery-proof.json.
Snapshot final VERIFIED : mac-alerts-c613533/state-backup-after-recovery.
Rollback de code en gardant la file actuelle et ses reçus, pas de restauration
aveugle d'une ancienne file. Aucun changement des autres services/réglages.

Lot Claude actualisé : CLAUDE-NEXT-NATIVE-EDITORIAL-2026-10-07.md ; reçu 62,
documents/skills et avis ciblé sur les trois correctifs, pas de campagne payante.
Reste global : qualité/utilité Business et Finance, coût natif accessible,
prochaine nuit sous cette version, Engineering/mémoire et consolidation des PR,
puis Knowledge/Anakalypto ensemble en dernière étape. Career en pause, OVH différé.

## Historique — tri natif activé et vraie livraison, 7 octobre 2026

Décision explicite d'Ivan : ne pas utiliser Jev là où il n'est pas fiable.
Worker et plugin alertes 8364b9f actifs ; gateway Jev d35963e et hook Claude
c6ead2c conservés. Mode native-editorial, verifyNativeBrief=true ; Jev n'est plus
appelé pour trier les alertes. Contexte public v6 inchangé, relecture v1.
Lire NATIVE-ALERT-TRIAGE.md pour le parcours et les limites.

Source lue → filtres locaux → jugement/rédaction isolés → preuves contrôlées
→ relecture indépendante liée au contenu exact → digest durable. Traitement
natif par créneau de cinq minutes, quatre complétions max (les deux étapes
comptées). Abstentions Jev réexaminées une fois, deux par passage ; décisions
anciennes conservées dans evidence_revisions. Aucun envoi tenté n'est réouvert.
Rumeurs courtes et annonces Next.js de correctifs à venir : review sans modèle.
276 tests Node concernés passent, dont bascule OpenClaw et vérification.

Première preuve actuelle : le worker automatique traite deux sources en 21,526 s,
zéro Jev, trois complétions natives ; discours BCE sans intérêt macro écarté,
Next.js 16.4 retenu puis approuvé par le relecteur (12,761 s + 4,626 s).
Citations et conditions d'applicabilité relues manuellement. Digest déclenché
manuellement pour qualification, message Telegram 62 réellement reçu ; ce n'est
ni une fixture ni une livraison automatique du soir revendiquée. Trois anciens
reçus conservés ; repassage de la même page sans renvoi.

Contrôle isolé historique : deux utiles retenus, trois cas non livrés ; un bruit
bloqué par validation, pas une réussite du seul jugement natif. Relecteur réel :
refus du contexte installé inventé et du bricolage hors périmètre, deux appels.
Ces cinq cas connus et deux contre-exemples ne constituent pas un benchmark neuf.
Coût natif non exposé ; ne pas le présenter comme gratuit ni parfaitement fiable.
Jev reste 761 appels / 0,029489 EUR estimé, aucun ajout dans cette qualification.

Activation coordonnée OpenClaw/worker avec rollback et sauvegarde VERIFIED intacte.
Mémoire, destinataire, autres plugins, réglages Claude et service Jev conservés.
Preuves privées ~/.ivan-ai-os/mac-alerts-8364b9f/{native-triage-activation,
first-native-production-digest,independent-verifier-counterexamples,
native-digest-idempotency,native-final-health}.json. Sauvegarde intacte :
state-backup-before-native ; snapshot après livraison : state-backup-after-native-delivery. Branche Codex/PR #57, aucune fusion foundation/main.

Suite Claude : CLAUDE-NEXT-NATIVE-EDITORIAL-2026-10-07.md, revue du vrai reçu 62
et alignement des documents/skills qu'il possède ; pas de nouvelle campagne payante.
Reste global : qualification Business/Finance actuels, coûts natifs accessibles,
reprise après nuit Mac, Engineering/mémoire et consolidation des PR ; puis
Knowledge/Anakalypto en étape finale commune. Career en pause, OVH différé.

## Historique — lecture Next.js initialement bloquée par Jev

## État courant vérifié — revue #66 et lecture Next.js, 7 octobre 2026

Worker 9faaadb actif ; gateway/plugin d35963e conservés. #66 640e2ec repris
avec provenance en 5015a28. Lot CLAUDE-NEXT-SOURCE-QUALITY clos.
Next.js : téléchargement plafonné à 600 000 octets, texte extrait à 100 000
caractères, extrait à 1 200. Autres hôtes : téléchargement toujours 400 000.
URL Mistral /news/<slug> normalisée à un slash final ; un ancien doublon non lu
résolu avec duplicateOf, sans réévaluer la source canonique ni modifier ses reçus.
264 tests Node concernés et 15 tests Python du lecteur passent.

Lecture réelle Next.js 16.4 : 498 948 octets, 17 652 caractères extraits,
publication primaire concordante au 6 octobre. Une sélection Jev : keep/confidence
0,47 (probabilités keep 0,64/review 0,20/skip 0,16), donc SELECTION_UNCERTAIN
avec la règle qualifiée .75/.75. Aucun natif ni envoi, aucun seuil changé.
Nouveau passage : zéro lecture, aucun changement de ligne, zéro appel/envoi.
Simon le-chonk reste non lu ; ne pas confondre absence de lecture et inutilité.

Services, outil et planning sains, exit 0 ; 3 delivered, 34 review, 11 skipped,
5 expired_unsent. Reviews : 18 SOURCE_NOT_READ, 14 SELECTION_UNCERTAIN, deux
refus factuels. Un échec lecteur persiste (date Simon) ; le dernier cycle de flux
signale aussi FEED_UNAVAILABLE, sans bloquer les autres producteurs.
Jev 761 appels / 0,029489 EUR estimé, inconnus zéro ; cette qualification :
un appel / 0,000067 EUR estimé. Les trois reçus de livraison restent inchangés.
Sauvegarde avant activation ; snapshot initial utilisé pour qualification isolée,
puis snapshot final VERIFIED distinct, laissé intact pour reprise.

Preuves privées ~/.ivan-ai-os/mac-alerts-9faaadb/{worker-activation,
next-source-qualification,next-idempotency,health-after-next-reader}.json ;
snapshot de reprise state-backup-after-next-reader. Aucune fusion foundation/main.
Le pilote reste à qualifier sur utilité réelle, fiche Business actuelle,
coût natif et nuit Mac. Career/OVH différés ; Knowledge/Anakalypto étape finale.

## Historique — reprise durable des lecteurs

## État courant vérifié — #64/#65 et reprise durable des lecteurs, 7 octobre 2026

Worker ab8d294 actif ; gateway/plugin d35963e conservés, contexte v6/mode E .75/.75
inchangés. Branche agent/codex/alerts-integration, PR #57 ; aucune fusion foundation/main.
#64 repris avec provenance : 2ab7694/e369e16/4b1e2fd → 7f0efd4/a2f2be4/8127e41.
Complément #65 c6ead2c → 063d402 ; copie Claude c6ead2c active, rules.mjs identique
à la source, gate/gateway 4311 conservés. Le lot CLAUDE-NEXT-PR63 est entièrement clos.

Défaut de budget de lecture corrigé : état durable par source/code/empreinte,
erreurs structurelles suspendues jusqu'au changement du lecteur, erreurs temporaires
espacées (30 min puis 2 h), trois tentatives max. Filtre avant LIMIT : cent pages
bloquées ne masquent pas la suivante. Diagnostic CHECK_SOURCE_READS persistant,
sans texte de brouillon et sans masquer WAIT_DIGEST. 261 tests Node concernés passent.
Lire SOURCE-READER-RECOVERY.md et REVIEW-CLAUDE-PILOT-FINAL.md.

Preuve sur copie puis file réelle : deux pages échouent, zéro lecture au passage
suivant après réouverture ; état d'échec restauré sur copie, trois reçus conservés.
Zéro appel Jev/natif et zéro message dans ces vérifications. Activation du seul worker
avec sauvegarde/rollback ; Jev, OpenClaw et réglages Claude inchangés.
Santé finale : services/outil sains, planning chargé, exit 0 ; file 3 delivered,
33 review, 9 skipped, 5 expired_unsent. Deux erreurs de lecture persistées visibles.
Jev toujours 758 appels / 0,029308 EUR estimé / plafond 10 EUR, inconnus zéro.

Preuves privées ~/.ivan-ai-os/mac-alerts-ab8d294/{worker-activation,
reader-retry-qualification,live-reader-retry-proof,health-after-reader-proof}.json.
Nouveau lot Claude : CLAUDE-NEXT-SOURCE-QUALITY-2026-10-06.md (revue ciblée,
preuves de lecture de deux pages bloquées, état K09/K10), pas envoyé à l'extérieur.
Reste Codex : couverture utile, qualité d'une vraie synthèse/fiche actuelle,
coût natif si l'interface l'expose, nuit/reprise réelle ; usage quotidien et dix
abstentions annotées par Ivan, puis Knowledge/Anakalypto. Career/OVH restent différés.

## Historique — après #63 et reprise des lecteurs, 6 octobre 2026

Code actif d35963e (worker/gateway/plugin), contexte v6 et mode E .75/.75
inchangés. Branche Codex/PR #57 ; aucune fusion foundation/main. Claude #63
84d92d7 repris en 1425e86. CI 11/11 ; 241 tests Node concernés, 22 Python.
Lire CURRENT-RUNTIME-INVENTORY.md pour les autres plugins réellement épinglés,
les producteurs, les PR empilées et leurs limites : ce relais couvre tout le projet.

Livré et activé : lecteurs officiels Mistral/Cloudflare, date primaire plutôt
que repost RSS, HTML class vide accepté, commandes/nav exclues ; reprise de
candidats non lus après disparition RSS, dans le budget de lecture commun.
Tests rouges puis verts. Aucun refus éditorial ni envoi tenté n'est ainsi réouvert.
Diagnostic : toutes les actions et codes de flux/lecteur ; nouveaux refus factuels
identifient citation/chiffre/identifiant/utilité/action, sans contenu de draft.

Business v3-business-market : utilité sur le marché, hypothèse acheteur/besoin,
test de recherche de preuves publiques distinctes avant prototype. Les deux
avertissements Claude sont non bloquants et persistés dans businessEditorialWarnings.
Finance : valeurs citées sans conversion, attribution générique si intervenant
non nommé ; aucune exception de citation fondée seulement sur l'hôte éditeur.
Revue et désaccords motivés : REVIEW-CODEX-PR63-2026-10-06.md.

Deux passages réels : cinq pages lues (trois Simon, annonce Mistral, Cloudflare).
Mistral reste review Jev ; Cloudflare primaire du 2 octobre devient stale sans
appel. Deux autres lecteurs refusent date non vérifiée/corps trop volumineux.
Quatre nouveaux Jev, 0,000254 EUR estimé ; aucun natif, aucune nouvelle livraison.
Repassages idempotents : zéro appel supplémentaire et zéro message. Ne pas forcer
un keep ni rejouer un corpus pour fabriquer une preuve de livraison fraîche.

Santé finale : Jev/OpenClaw/outil sains, planning chargé, Career absent, source
d35963e ; 3 delivered / 33 review / 9 skipped / 5 expired_unsent, zéro ready.
758 Jev / 0,029308 EUR estimé / plafond 10 EUR / inconnus zéro. Catalogue Business
prod zéro. Ancien Sentinelle disabled_manually ; export distant manuel, sans schedule.
La Secrétaire, les autres rôles, la file, le budget et Obsidian sont conservés.

Sauvegarde/restauration réelle sur copie : trois reçus conservés, rien réouvert,
zéro appel/envoi. Catalogue Business WAL couvert par test. Journaux Mac consultés :
aucune longue veille récente qualifiable ; nuit réelle, coût natif et utilité
quotidienne restent ouverts. B03/reçu 61 est un test historique insuffisant selon
Claude, pas une opportunité qualifiée. Ses huit générations/B01/B03 ne sont pas rejoués.

Preuves : CURRENT-RUNTIME-INVENTORY.md et dossiers privés mac-alerts-e2446e5,
mac-alerts-0066e49, mac-alerts-d35963e sous ~/.ivan-ai-os/. Dernier lot Claude ciblé
préparé dans CLAUDE-NEXT-PR63-2026-10-06.md, pas envoyé comme message extérieur.
Défaut d'import stdin dans son skill classify.mjs laissé à son périmètre ; la
restauration a été vérifiée avec un fichier mjs, sans masquer l'erreur initiale.
#65 reprise avec provenance : e40b866/76dedb6/1c91ce3 → 54c61c9/0264ea9/ad23aa2.
Prose citée et backticks échappés corrigés ; 19/19 tests hook/adaptateur confirmés.
Copie Claude active 1c91ce3 vérifiée identique à la PR, gate/gateway 4311 conservés.
Pas de réinstallation par Codex. Quatre options Git valides restent mal classées :
--no-optional-locks, --glob-pathspecs, --noglob-pathspecs, --icase-pathspecs ; quatre
tests rouges sans exécution de stash. Hypothèses -C/dossier/-cclef=valeur retirées,
Git les rejette. Revue REVIEW-CODEX-PR65-2026-10-06.md ; complément Claude ciblé demandé.

Reste Codex : couverture de sources utile (19 non lues), cas de refus futurs
précis, qualité d'une vraie synthèse actuelle/fiche Business, coût natif si
interface disponible, nuit/reprise réelle, puis parcours final Knowledge/Anakalypto.
Career en pause, OVH reporté. Ne pas annoncer le pilote entièrement terminé.

## Historique vérifié — après #62, 6 octobre 2026

Branche agent/codex/alerts-integration, PR #57 ; aucune fusion foundation/main.
Claude #62 repris avec provenance : 48a4611 → f91bcdf, 8a958a0 → 3861850.
Runtime actif 33480ee (worker/gateway/plugin), contexte v6, mode E .75/.75 inchangé.
323 tests ciblés au correctif du chargeur ; 148 concernés après ajustement Business.
CI runtime 33480ee : 11/11 verte. Node 24.19.0 ; file/budget/Secrétaire conservés.

Livré : fiche Business dans le même appel natif, preuves liées par code, problème
dérivé du premier fait, acheteur hypothétique, objections, test réversible gratuit.
Le vrai moteur recalcule les entrées publiques explicites ; génération exploratoire
sans score inventé. Catalogue business_fiches enregistré dans la transaction ready ;
reprise sans doublon et catalogue indépendant d'une archive source manquante testés.
Tous les diagnostics actifs dans alerts.diagnoses ; compatibilité diagnosis.code.
Le diagnostic et la bascule sondent réellement ivan_alert_synthesize, avant modèle.

Défaut racine trouvé à l'activation 5518c34 : factory chargée avec require face à
une dépendance CLI à top-level await. Gateway sain, outil absent. Corrigé b860b86 :
imports différés, test rouge puis vert ERR_REQUIRE_ASYNC_MODULE, sonde obligatoire.
La tentative 5518c34 est un RPC sans complétion native (l'ancien reçu nativeAttempts
signifie seulement tentative client). Ne pas la compter comme appel modèle.
B01, premier vrai natif b860b86 : refus VALIDATE, 31 s ; pas de draft disponible.
Pas de cause précise inventée. 33480ee dérive le champ redondant et conserve
validationChecks → validation_checks → nativeFailure.checks sans texte de modèle.

B03 (autre capture publique historique), un seul natif sur 33480ee : VERIFIED,
32 064 ms, fiche 1307 caractères, aucun appel Jev, pas de score/recommandation.
Fait contrôlé contre sa citation : plainte sur prix/contacts, engagement annuel
et accès d'essai. Source du 26 août : aucune fraîcheur ni sélection Jev revendiquée.
Utilité et test proposés restent à relire par Claude ; un prototype fictif ne
prouve pas une demande solvable. Essai Telegram distinct de la production, livraison confirmée reçu 61 (pas de renvoi).
Reçus : ~/.ivan-ai-os/mac-alerts-33480ee/business-qualification/
{result.json,telegram-attempt.json,telegram-result.json} et coordinated-activation.json.

Dernière santé : outil disponible, Jev/worker/OpenClaw sains ; file prod
3 delivered / 27 review / 7 skipped / 5 expired_unsent, zéro ready/pending.
754 appels Jev / 0,029054 EUR estimé / plafond 10 EUR / inconnus 0.
Aucune hausse pendant les bascules et la qualification Business. Coût natif inconnu.
Catalogue Business prod zéro : la qualification historique n'est pas injectée en prod.
Ne pas rejouer B01/B03, les anciens benchmarks ou les huit générations.

Claude : CLAUDE-NEXT-PR62-2026-10-06.md (sortie Business, sources publiques non lues,
deux traductions Finance testables, sans modèle ni activation). Codex poursuit les
lecteurs/runtime et la vraie qualification quotidienne ; pas de nouveau seuil.
Aucun recours sur abstentions ou digest hebdomadaire optionnel activé.
Career en pause, OVH reporté, Knowledge/Anakalypto dernière étape commune.
Lire BUSINESS-RUNTIME-INTEGRATION-2026-10-06.md, REVIEW-CODEX-PR62-2026-10-06.md,
GUIDE-DIAGNOSTIC-V6.md, PROJECT-CHECKLISTS.md, MAC-ALERT-ORCHESTRATOR.md,
MAC-ALERTS-RECOVERY.md et la précédente qualification v6.

## Historique — avant intégration #62

## État courant vérifié — après #61, 6 octobre 2026

Branche agent/codex/alerts-integration, PR #57 empilée, aucune fusion foundation/main.
Claude #61 reprise avec provenance : 4ee5189/b3e9cb2/34fe457/2171549/cd7324c.
Worker, plugin System et gateway actifs 2a51fa1, même contexte v6 et mode E à .75.
File/budget/Secrétaire/roster conservés ; activation réversible sans coût fournisseur.
Services Jev, alertes et PID OpenClaw observés sur Node 24.19.0 ; terminal encore 23.9.0.

Corrections de la sonde : noms GPT-6/GLM-5.3/HTTP/2 complets, alias économiques
fermés, téléphones masqués avec le motif du gateway, incidents Codex/Claude,
diagnostic CHECK_EDITORIAL_REJECTIONS et compteur/raisons toujours exposés.
312 tests Node ciblés passent, lecteur Python 11/11 ; CI code 2a51fa1 11/11 verte.
Les preuves refusées restent en review SQLite : elles ne disparaissent pas sans trace.

Qualification six sources neuves : 4/6 exacts, bruit retenu 0, utile retrouvé 0/1.
Six Jev, zéro rédaction en mode E ; coût estimé +0,000397 EUR, 747 appels au total,
0,028596 EUR estimé ce mois, inconnus 0, plafond 10 EUR. Seuils inchangés.
Deux premières complétions natives sur abstentions Engineering sans refaire Jev :
M01 refus VALIDATE / ALERT_FACT_UNSUPPORTED ; M03 skip contre label keep de Claude.
Recours non activé ; coûts natifs indisponibles dans le SDK text-only observé.
Mesures sur captures historiques avec collecte simulée : pas de message v6 livré.
File live reste 3 delivered / 17 review / 5 skipped / 3 expired_unsent ; zéro pending/ready.
Preuves : ~/.ivan-ai-os/mac-alerts-2a51fa1/coordinated-activation.json et
qualification-pr61-v6/{results.jsonl,native-review-fallback.jsonl,isolated.sqlite}.
Ne pas refaire ce jeu, les anciens benchmarks ou les huit générations.

Business #61 en source, non activé : son vérificateur accepte score arbitraire,
citation vide, test non réversible et montant différent d'une citation avec devise.
Claude corrige ces cas et relit le jugement des deux nouvelles sorties ; Codex
prépare ensuite intégration Business et éventuel recours, après contrôle inédit.
Career en pause, OVH reporté, Knowledge/Anakalypto dernière étape commune.
Lire REVIEW-CODEX-PR61-2026-10-06.md, ALERT-V6-QUALIFICATION-2026-10-06.md,
CLAUDE-NEXT-PR61-2026-10-06.md, PROJECT-CHECKLISTS.md, MAC-ALERT-ORCHESTRATOR.md,
MAC-ALERTS-RECOVERY.md, ARCHITECTURE-BENCHMARK-2026-10-05.md et les contrats.
Reste : qualité/utilité quotidienne, coût natif, vraie veille Mac, inventaire urgence,
hook Codex source non actif, puis Knowledge/Anakalypto avec Claude.

## Historique — avant intégration #61

## État courant vérifié — 6 octobre 2026

Branche agent/codex/alerts-integration, PR #57 empilée sur #48/#47 ; aucune
fusion foundation/main. Claude #60 repris avec provenance jusqu'à 8549eac.
Worker, plugin System et gateway actifs bf2d2e1 ; contexte mac-alerts-20261006-v6,
mode jev-native-editorial, confiance keep/skip 0,75. Politique basse non active.
Activation coordonnée réversible, Node 24.19.0, runner provenance cc1d2a5.
File, budget/Trousseau, roster, personnalité/mémoire Secrétaire conservés.
Career en pause, Knowledge/Anakalypto dernière étape, OVH différé.

Six corrections Claude traitées : contexte projet/coûts exact, sigles/versions
par citation, courte rumeur tenue par code, contacts publics masqués vers Jev,
échecs COMPLETE/PARSE/VALIDATE conservés, interface HF exclue des extraits.
366 tests Node et 19 Python passent ; CI source bf2d2e1 : état des 11 jobs à contrôler sur la PR.
Relecture hors ligne reçus 59/60 : le message Next.js historique est désormais
refusé (ALERT_FACT_UNSUPPORTED). Les contrôles mécaniques ne garantissent pas
l'utilité Budget ni l'absence de faits répétés ThinkingBox. Aucun message renvoyé.
Les cinq erreurs natives historiques n'ont pas de cause rétrospective connue.

Probe du plugin réellement chargé : rumeur refusée avant toute complétion ;
lecture HF réelle : 18 967 caractères, extrait 1196, aucun en-tête détecté.
Zéro appel fournisseur et zéro envoi pour ces vérifications et la bascule.
Skill rapport-telegram 2.1.0 installé avec sauvegardes chez Business, Finance,
Knowledge et System ; pas de profil ajouté, pas de changement de rôle.
Jev/calibration 0.5.0/0.3.0 intégrés en source pour Codex/Claude uniquement.
Budget au contrôle : 741 appels / 0,028199 EUR estimé, inconnus 0, plafond 10 EUR.
File : delivered 3 / review 17 / skipped 5 / expired_unsent 3 ; zéro pending/ready.
Preuves privées : ~/.ivan-ai-os/mac-alerts-bf2d2e1/coordinated-activation.json,
editorial-live-free-probe.json et rapport-telegram-2.1.0/proof.json.

Les scores du benchmark v5 restent historiques ; aucune qualification v6 déduite.
Pas de nouvelle passe des corpus ni des huit anciennes générations.
Lire REVIEW-CODEX-EDITORIAL-FIXES-2026-10-06.md,
CLAUDE-PILOT-QUALIFICATION-2026-10-06.md, PROJECT-CHECKLISTS.md,
MAC-ALERT-ORCHESTRATOR.md, MAC-ALERTS-RECOVERY.md,
ARCHITECTURE-BENCHMARK-2026-10-05.md et les mesures éditoriales.
Reste : prochains vrais messages, utilité quotidienne, coûts natifs, Business
approfondi, vraie veille Mac, inventaire d'urgence, hook Codex source non actif,
puis Knowledge/Anakalypto avec Claude. Rien de tout cela n'est déclaré terminé.

## Historique — état antérieur conservé

## État courant vérifié — 5 octobre 2026

Branche agent/codex/alerts-integration, PR #57 sur #48/#47 ; aucune fusion foundation/main.
Worker actif 9f7f653 ; plugin System et gateway Jev 1c769a3 (inchangés par le dernier correctif).
Contexte mac-alerts-20261005-v5, mode jev-native-editorial, seuils de confiance 0,75.
Code local : 223 tests passent ; CI du code 9f7f653 : 11/11. Node 24.19.0 pour les services ; runner provenance cc1d2a5.
File/budget/Trousseau/Secrétaire/roster conservés, planning exclusif, Sentinelle distant arrêté.

Trois synthèses réelles livrées : reçu 59 (Simon budget et HF ThinkingBox, mode natif précédent),
puis reçu 60 (Next.js officiel, Jev keep 0,92 + validation native, mode conservateur courant).
Le worker conservateur a évalué quatre éléments et rédigé seulement l'élément retenu.
La page Next.js est datée du 30 septembre ; fenêtre sécurité explicite de sept jours.
Après livraison 60 : zéro pending/ready, 3 delivered, 14 review, 5 skipped, 3 expired_unsent.
Second passage digest : zéro renvoi. Budget : 740 appels, 0,028133 EUR estimé, inconnus 0.
Preuve privée : ~/.ivan-ai-os/mac-alerts-9f7f653/qualified-runtime-and-delivery.json.
Les pages devenues prêtes tardivement continuent le soir même, trois maximum ;
un reçu incertain bloque la continuation. Le test échouait avant la correction.

Benchmark Claude #60 @6c6e36a : une seule passe, 26 cas, 22 tentatives par fournisseur.
Jev .75 : 4/5 utiles, zéro faux keep ; natif seul : 4/5 mais trois faux keep.
Mode conservateur courant dérivé des mêmes sorties : 3/5, zéro faux keep ; rappel limité.
Une erreur Jev et cinq natives sont comptées ; ni qualité universelle ni fraîcheur réelle prouvées.
Coût benchmark Jev 0,001250 EUR estimé ; coût natif inconnu. Aucun label transmis.
Erreurs de contenu distinguées des pannes, reprise native avec reçu payé préservé.
Ne pas rejouer les benchmarks ni les huit exemples. Claude doit corriger #60 et
noter les sorties existantes et les trois messages réels : mission précise dans
CLAUDE-ARCHITECTURE-BENCHMARK-2026-10-05.md, terminal Cursor, son worktree et sa branche.

Reste : qualité/utilité quotidienne et Business recommandations approfondies ;
sommeil réel du Mac ; inventaire d'urgence ; hook Codex source untrusted, non actif.
Career reste en pause, OVH différé, Knowledge/Anakalypto dernière étape commune.
Lire PROJECT-CHECKLISTS.md, MAC-ALERT-ORCHESTRATOR.md, MAC-ALERTS-RECOVERY.md,
REVIEW-CODEX-ARCHITECTURE-BENCHMARK-2026-10-05.md et les mesures éditoriales.

## Historique immédiatement précédent — conservé pour provenance

## Mise à jour — mode conservateur activé (2026-10-05, 20:30 Paris)

Gateway, plugin et worker @1c769a3, contexte v5, selectionMode jev-native-editorial.
Jev confidence 0,75 puis validation/rédaction native, seulement pour keep.
Ce passage réel a évalué quatre éléments et préparé une synthèse Next.js officielle
(30 septembre, fenêtre sécurité 7 jours), avec reçus Jev et natif liés à la même preuve.
Budget après passage : 740 appels, 0,028133 EUR estimé ; aucun usage inconnu.
Reçu 59 antérieur : deux articles réellement livrés par native-editorial.
CI 1c769a3 : un test du benchmark dépendait du cwd du runner Linux ; corrigé
avec le chemin de son module, testé depuis services/alerts-runtime.
Correctif source suivant : les pages de digest prêtes après la première livraison
peuvent continuer le même soir, au plus trois pages, jamais après un envoi incertain.
221 tests passent avant ce correctif ; deux nouvelles régressions passent ensuite.
La qualification de fidélité/utilité indépendante reste à Claude ; instruction courante
CLAUDE-ARCHITECTURE-BENCHMARK-2026-10-05.md. Pas de nouvelles passes payantes.

## Historique immédiatement précédent

## État courant — pilote Mac et benchmark indépendant (2026-10-05)

Codex : agent/codex/alerts-integration, PR #57 sur #48, elle-même sur #47.
Runtime actif : a604aa6, CI 11/11 ; 212 tests locaux au moment de cette activation.
Lire PROJECT-CHECKLISTS.md, MAC-ALERT-ORCHESTRATOR.md, MAC-ALERTS-RECOVERY.md,
CLAUDE-NEXT-ACTIONS-2026-10-05.md, REVIEW-CODEX-JEV-CALIBRATION-2026-10-05.md,
REVIEW-CODEX-ARCHITECTURE-BENCHMARK-2026-10-05.md et
ALERT-EDITORIAL-GENERATION-MEASURE-2026-10-05.md. Le relais couvre le projet entier.

Worker, plugin System et gateway Jev sont tous épinglés à a604aa6.
Contexte mac-alerts-20261005-v5 ; sélection active native-editorial.
Une complétion isolée juge l'utilité et rédige uniquement pour keep ; deux appels
natifs maximum par passage. Jev n'est obligatoire ni pour les alertes ni pour
le tri intermédiaire Business/Finance ; les autres API restent disponibles sur 4311.
Le réglage probabiliste v5 reste en réserve, aucune politique keep prioritaire.
Budget commun, Trousseau, file, mémoire/personnalité de la Secrétaire conservés.
Runner Mac inchangé cc1d2a5 ; services sur Node 24.19.0. Planning exclusif,
workflow Sentinelle distant arrêté. Pas de fusion foundation/main dans cette session.

Parcours automatique réel vérifié le 5 octobre, reçu Telegram 59 : deux sources
publiques effectivement lues, jugement natif, synthèses validées et digest livré.
Articles : plafonds de dépenses (Simon Willison), ThinkingBox (Hugging Face).
Processus 25 955 ms pour deux complétions ; digest 5 187 ms. Aucun KEEP simulé.
Deux autres articles ont été écartés par le même jugement, sans prose livrée.
Budget avant/après ces vérifications : 715 appels, 0,026624 EUR estimé, inconnus 0,
plafond 10 EUR. Cela ne mesure pas le coût du modèle natif.
Preuves privées : ~/.ivan-ai-os/mac-alerts-a604aa6/{coordinated-activation,
native-editorial-cycle,native-editorial-cycle-followup}.json.
Qualité indépendante et appréciation d'Ivan encore ouvertes : la synthèse des
plafonds se focalise trop sur Jev ; son budget ne couvre pas les autres fournisseurs.

Jev v5 : 10/14 utiles dev, zéro bruit, avec gestion des probabilités contradictoires ;
à confiance 0,75 : 6/14, zéro bruit. Contrôle précédent : 11/12, positifs synthétiques.
Ni ces résultats ni la stabilité observée ne prouvent une qualification universelle.
Claude PR #60 : 26 cas nouveaux mesurés une seule fois avec v5 et natif,
labels exclus des entrées, erreurs conservées et couverture complète obligatoire.
B à confiance 0,75 : 4/5 utiles, aucun faux keep ; C/D : 4/5 mais trois faux keep.
Mode conservateur E préparé : sélection Jev 0,75 puis validation/rédaction native,
3/5 utiles sans faux keep sur ces mêmes sorties ; pas d'urgence automatique.
22 tentatives par fournisseur, 1 erreur Jev et 5 natives ; zéro livraison de benchmark.
Budget après passe : 736 appels, 0,027874 EUR estimé ; aucun coût natif inventé.
Correctifs source : erreur de contenu distincte d'une panne, reprise avec reçu payé,
scoreur strict/anti-rejeu et diagnostic selon le mode ; 221 tests locaux passent.
Ne pas refaire les 94 cas, les 83 cas dev, les huit générations ni le contrôle précédent.
Le benchmark sémantique historique ne prouve pas la fraîcheur des flux actuels.

Career en pause ; OVH différé ; Knowledge/Anakalypto dernière étape commune.
Claude #49 corrigée installée en gate projet uniquement ; hook Codex source untrusted,
pas activé. Plans Engineering externes préservés. Business recommandations/notation
approfondie, inventaire d'urgence, sommeil réel du Mac et usage quotidien restent ouverts.
Prochaine mission Claude : corriger les calculs de #60 et relire les sorties déjà
mesurées, les deux messages réels et le contexte actuel ; pas de répétition payante.

## Historique — sélection active et Sentinelle retrouvé (2026-10-05)

Cette section remplace les états historiques ci-dessous « endpoint non activé »
et « producteur inconnu ». Branche agent/codex/mac-alerts-pilot, PR #48 sur #47.
Lire docs/MAC-PILOT-OPERATIONS.md, docs/SENTINELLE-INTEGRATION.md et
docs/ALERTS-RUNTIME.md ; poursuivre docs/PROJECT-CHECKLISTS.md.

Jev /v1/alerts/select est actif sur 4311, LaunchAgent épinglé à la release
alerts-59fbd7e : gateway 59fbd7e, runner Mac cc1d2a5. Token, Trousseau et
compteur préservés ; zéro appel fournisseur à la bascule. Health et refus
Career vérifiés. Deux cas Finance synthétiques atteignent le vrai Jev via le
client du moteur ; aucun seuil réel ou conseil financier n'est revendiqué.
Preuves privées : ~/.ivan-ai-os/background-alerts-59fbd7e/{activation,live-probe,finance-probe}.json.

Sentinelle @sentinelleenginebot est produit par FreezyXV/sentinelle sur GitHub
Actions, quatre passages par jour et digest hebdomadaire, MODE=ombre confirmé.
Sa perte des dates RSS et l'absence de lecture des pages sont reproduites.
PR Sentinelle #1, codex/collector-export : export public sans profil, décision
ni message. Passage réel : 40 candidats récents, 139 anciens écartés, huit
flux accessibles. Aucun changement du workflow existant, de main ou des secrets.

Consommateur Mac : 40 ingestions, une première page réellement lue et une
sélection Jev review, sans génération ni livraison automatique. Deux refus de
date sont reproduits puis corrigés (classe HTML des notes courtes) ; un passage
sans sélection met à jour ces deux doublons : trois pages lues au total,
37 sources non supportées non lues, zéro appel Jev supplémentaire.
Premier lecteur limité aux
permaliens datés du blog Simon Willison ; date de la page et empreinte vérifiées.
La file accepte maintenant une preuve de lecture pour un doublon RSS encore
pending ou review/SOURCE_NOT_READ, sans rouvrir une tentative d'envoi.

Une prévisualisation manuelle, rédigée et relue par Codex sur cette source,
est reçue sur Secrétaire Ivan : reçu natif 57 et contrôle visuel Telegram.
Elle annonce explicitement l'essai manuel et laisse la sélection en revue.
Preuves privées : ~/.ivan-ai-os/alert-source-pilot-20261005/.
Pour naviguer dans Telegram : Cmd+K, recherche, Entrée ; Cmd+flèche droite
ouvre le profil. Les clics AX défaillants ne doivent plus être répétés.

Tests : gateway 58, managers 18, file/adaptateurs 29, diagnostic 2, lecteur
Python 4 : 111 passent. Export Sentinelle : 5 tests distincts passent.
Les tests HTTP nécessitent une permission réseau locale ; le premier lancement
sandbox a échoué sur listen EPERM, puis le relancement autorisé passe entièrement.

Reste à livrer : contrat/corpus Claude K01/K02, lecteurs supplémentaires,
récupération des exports et planning unique, générateur de synthèse, digest,
test automatique avec reçu avant de couper l'ancien mode de Sentinelle.
Career reste en pause, Workshop en propose ; Knowledge/Anakalypto à la fin,
OVH reporté. Ne pas toucher au worktree Claude ni à ses trois hooks non commités.
La prévisualisation manuelle ne constitue pas une preuve de ce parcours complet.

## Historique — pauses durables et sélection préparée (2026-10-05)

Lire docs/MAC-PILOT-OPERATIONS.md. Le registre natif révèle huit tâches après
pause complète Career : six revues Workshop sont désormais désactivées en
mode propose (runtime incompatible prouvé dans le code installé), heartbeat
et consolidation mémoire restent actifs. Six rôles actifs, sept définis dans
le projet ; définition/workspace Career conservés. Secrétaire inchangée.
Preuves privées : ~/.ivan-ai-os/pause-career-complete-20261005/result.json et
~/.ivan-ai-os/workshop-propose-20261005/result.json. Aucun nouveau modèle.
scripts/inspect-mac-pilot.mjs vérifie santé/budget et tâches par API native,
sans exposer les journaux ; ne plus déduire zéro tâche d'un ancien jobs.json absent.
Lire docs/ALERTS-RUNTIME.md : endpoint candidat /v1/alerts/select, contexte fixe,
même bearer/budget/audit ; client loopback, délais par étape, reçus conservés.
58 tests gateway, 22 file/client, deux diagnostic, 18 managers : 100 tests OK.
Sources candidat, endpoint non activé. Mac verrouillé pendant lecture
Telegram ; Sentinelle montre calibrage/liens/scores, producteur toujours inconnu.
Claude n'a pas encore publié telegram-syntheses ; ne pas toucher à ses trois
fichiers hooks/claude non commités. Son skill jev-decision garde des passages
obsolètes (« classify n'existe pas ») : à corriger dans son audit K05.
Source commit 59fbd7e et release privée alerts-59fbd7e préparés ; runner
cc1d2a5 conservé avec provenance distincte. Probe de la vraie copie figée :
health, authentification et exclusion Career OK, zéro appel fournisseur.
Candidate ~/.ivan-ai-os/background-alerts-59fbd7e/settings.json valide,
settings/plist/jeton/budget live inchangés. Pas de lecture du Trousseau.
Bascule encore à faire lorsque le Mac est déverrouillé ; ne pas reprovisionner.

## Checklists et file des alertes — Codex (2026-10-05)

Lire docs/PROJECT-CHECKLISTS.md : 25 tâches Codex et 10 tâches Claude avec
critères de fin, dépendances et zones d'écriture. Codex pilote l'intégration,
Claude démarre rapport-telegram/contrat/corpus sur sa branche séparée ;
Knowledge/Anakalypto dernière étape commune, Career suspendu, OVH différé.
Lire docs/ALERTS-RUNTIME.md : file SQLite candidate, 15 tests synthétiques,
doublons interbots, baux et crash, envoi incertain retenu sans renvoi automatique.
Sélection/synthèse/envoi injectés, aucune collecte ou livraison live raccordée.
Finance : régression prouvée sur judge (0 appels au lieu de 2), valeurs publiques
formatées désormais acceptées dans le gateway source, sans modifier le moteur
Claude. Gateway complet 53/53 tests ; file alertes 15/15 tests, CI ajoutée.
Ce lot ne remplace pas encore le service Jev actif.

## Priorités Ivan — pilote Mac et alertes utiles (2026-10-05)

Lire docs/MAC-PILOT-PRIORITIES.md et docs/HANDOFF-CLAUDE-ALERTS-2026-10-05.md.
Career en pause pour plusieurs mois, données préservées. Finaliser Knowledge/
Anakalypto à la toute fin avec Codex + Claude. OVH reporté pendant le pilote Mac.
Priorité aux synthèses Telegram sourcées et utiles au contexte, pas aux liens seuls.
Codex : pipeline/filtre/collectes/envoi ; Claude : rapport-telegram, contrat éditorial
et évaluations. Pas de modification concurrente des fichiers de l'autre.
Sentinelle non identifié dans le dépôt/LaunchAgents examinés ; ne pas annoncer
un raccordement ou des nouvelles alertes actifs avant preuve. Pause Career appliquée : retiré des allowAgents du chef, config native validée,
restart sain ; workspace Career et reste de config conservés. Préférences USER.md
ajoutées sans remplacer le contenu existant. Preuve privée :
~/.ivan-ai-os/pilot-mac-20261005/result.json. Synthèses live pas encore activées.

## Reprise Codex — capacités et skills OpenClaw (2026-10-04)

Lire docs/OPENCLAW-READ-SKILLS.md. Branche agent/codex/openclaw-capability-skills,
base foundation/v1 @454b21e. Sources Claude intactes. Adaptations Business,
Finance publique et Obsidian lecture via outils natifs ; sélection indisponible
refusée explicitement, scripts inutilisables retirés des paquets. 14/14 tests.
PR #47 : quatre paquets actifs, native config valide et restart contrôlé.
Chargement éligible + outils des quatre managers confirmés par
scripts/verify-openclaw-read-skills.mjs --installed ; main refusé en mémoire.
Aucun changement de personnalité/mémoire main, des workspaces ou des outils.
5756 caractères pour les quatre paquets ; aucun profil lu. Preuves privées dans
~/.ivan-ai-os/activation-read-skills-7b4b7c4/. Essais managers réels sans --deliver : Finance 13,5 s (brief natif), System
10,1 s (recherche/lecture mémoire, aussi route). Skills chargés dans les prompts
confirmés. CI #47 10/10 verte. Collecte/planification et écriture restent distinctes.
Le nouveau vérificateur utilise le client natif, qui résout les SecretRefs ; le
RPC tools.invoke prend name et retourne output. Aucun bearer fabriqué depuis
la référence de config. Un timeout de l'auto-review a été surmonté sans nouveau GO.
PR #46 : release mac-resilience-cc1d2a5 active sur 4311, restart natif vérifié,
jeton et compteur inchangés, zéro appel payant. CI 11/11 verte. Le timeout initial
15 s provoquait un faux échec à cause du throttle launchd 60 s ; prévoir 75 s.
Ne pas refaire de provisioning de clé. Source Mac en PR #45/#46, pas dans foundation.

## Reprise Codex — pilote mémoire et service Mac actifs (2026-09-29)

Lire docs/MEMORY-PILOT-2026-09-29.md : snapshot 8151c01 activé sur GO précis d'Ivan.
System/Knowledge recherchent et lisent la décision validée ; main/Finance refusés nativement.
Telegram → Jev/System → lecture → worker isolé → rapport vérifié observé ; reçu visible à 14:14 UTC.
Deux spawns acceptés et paquet worker reçu ; trace worker autonome nettoyée, pas revendiquée conservée.
Défaut ouvert : reprise privée du chef sans livraison au canal ; corriger sessions_yield.message
pour conserver l'obligation de livraison via message et contrôle du reçu, sans nouvelle délégation.
Jev est maintenant un LaunchAgent Mac avec Trousseau, release a58b99f, budget conservé au restart.
PR #20 agent/codex/mac-background-runtime @12a82a5 : 6 tests, preuve launchd native, CI 7/7 verte.
Career : trois questions/critères fictifs visibles sur Telegram après reprise et reçu.
Retours Claude publiés sur #14/#17/#18/#19 après GO précis ; table #17 non activée, runtime reste Jev.
Le hook Claude reste shadow ; ni son worktree ni AGENTS/constitution n'ont été modifiés.
Ces états remplacent les paragraphes historiques « mémoire/service non activés » ci-dessous.

## Reprise Codex — correction mémoire après revue Claude (2026-09-29)

#13 et #15 sont fusionnées par Claude sur GO d’Ivan : foundation/v1 @c23597a.
Le hook Claude est confirmé actif en shadow, dans ce projet, depuis son snapshot fd2ea04.
#16 est intégrée avec provenance dans la branche de #14 : le nouveau test échoue avant
(MEMORY_INDEX_LIMIT), puis 10/10 passent. Les journaux ne saturent plus la recherche ;
connaissances/decisions précèdent inbox ; dépassement signalé par index_truncated.
La configuration mémoire privée a été validée mais reste non activée et son snapshot
initial a660d81 doit être remplacé par la version corrigée avant le pilote.
Calibration Jev publiée sur #11 : training 18/19, holdout 17/19 (53 % REVIEW), environ
0,0011 EUR estimé pour les deux jeux. Aucun doublon exécuté par Codex.
Le routage par table #17 et sa leçon skills #18 attendent la revue ; le runtime reste Jev.
Le ticket #19 est reçu : node --test/npm test exécutent du code, et ne constituent pas
une liste de lectures sûres. Le shadow reste actif ; le mode ask ne devient pas enforcement.

# Session handoff — 2026-09-29

## Dernière continuation — Codex — questions Jev actives sur Mac

`foundation/v1` est à `0b2d93d` après les fusions Claude. La PR #35
`agent/codex/classify` ajoute `/v1/classify` pour les dix questions
réellement déclarées dans le client, avec bearer, budget commun et audit
sans entrée brute ; 52/52 tests et 6/6 CI passent. Le commit de correction
`6d2add2` adapte la réponse Noul TypeSafe réelle, sans champ `confidence`.
Source PR encore non fusionnée. L'ancien travail non suivi
`services/linux-runtime/` est préservé.

Sur GO d'Ivan, copie figée `~/.ivan-ai-os/releases/classify-6d2add2`
activée par LaunchAgent sur 4311. Keychain, jeton et budget conservés ;
ancien plist sauvegardé dans `~/.ivan-ai-os/background-classify-6d2add2/`.
Une première bascule a rencontré une course de `launchctl bootstrap`,
l'ancien service a été rétabli, puis la bascule réessayée avec attente et
contrôles a réussi. Jev réel : `sujet.captivant` 0,86 sur La pile de Volta,
`sujet.domaine` sciences-fondamentales, `publication.prete` 0,75 sur la
fiche de verre. 56 appels, 0,001549 € estimés au dernier relevé.
Le lot privé Anakalypto a reçu un `.jev.json` créé sans écrasement ;
`valider_lot.py` passe. **Aucune publication externe**. Voir
`docs/CLASSIFY-GATEWAY.md` et `docs/REVIEW-CODEX-CLAUDE-2026-09-29.md` :
le validateur #26 accepte aussi un reçu forgé, donc l'automatisation de
publication attend une vérification de provenance codée. #28/#31 relues,
pilotage gate acceptable. Les PR #14/#20/#21 restent ouvertes et relues.
Prochains travaux : renforcer la provenance du reçu, planifier les moteurs,
accès des managers aux outils sans exec, hook Codex, skills OpenClaw, Linux/OVH.

## 2026-09-29 — Codex — lecture mémoire préparée après activation

Branche agent/codex/obsidian-read-tool ; dépend de la livraison d'activation PR #13 @0b6d1c2.
Lire hooks/openclaw/ivan-memory/README.md : deux outils optionnels, system/knowledge seulement.
9/9 tests ; chargeur natif 2026.9.5 vérifié en état isolé avec coffre synthétique, aucun modèle.
Lecture locale de la décision de fusion désignée : valide/interne, une source, corps non affiché.
Le coffre n'a pas été modifié. Notes personnelles hors Ivan AI OS non explorées ; aucun appel Jev.
Plugin mémoire non activé, filesystem/exec inchangés. Sources de Claude et fichiers partagés intacts.
PR #13 : six jobs CI verts ; Jev 4311 et sept rôles actifs, parcours Engineering vérifié.
Claude informé pour consigne de reprise, hook shadow et deux calibrations ; pas de duplication.
Prochaine action : revue Claude du plugin mémoire, puis proposition privée épinglée et pilote ciblé.

## 2026-09-29 — Codex — Linux/OVH runtime candidate

Branch `agent/codex/linux-runtime-v2`, PR #37, based on `foundation/v1`.
`services/linux-runtime/` adds a systemd Jev launcher, a private credential
contract, persistent budget/audit paths and an authenticated startup probe.
Four local tests pass, including a real mock gateway on loopback with
authenticated usage and unauthorized rejection. No real TypeSafe or OVH call,
purchase, host provisioning or Telegram move. CI includes a Linux test job.
Read `docs/OVH-DEPLOYMENT-PROPOSAL.md` before a host choice or cutover.
Important: the Mac and VPS budget files must not count separate 10 EUR monthly
allowances during migration. The initial VPS proposal is a candidate, not GO
to purchase. This branch is independent of PRs #35 and #36.

## 2026-09-29 — Codex — Business/Finance read tools and restart recovery

Branch `agent/codex/engine-read-tools`, PR #36. A pinned private copy of
`ivan-ai-os-engine-briefs` is active on the Mac OpenClaw gateway. Native
`tools.invoke` returned `READY` for `ivan_business_brief` as `ivan-business`
and `ivan_finance_brief` as `ivan-finance`; `main` was denied. Neither response
included the private Business profile or personal Finance allocation. Jev 4311,
the seven roles and Telegram configuration were preserved. No model call was
needed for these checks. The source CI had seven green jobs at commit 5224721.

The `openclaw gateway restart --preserve-definition` path took about five
minutes: log evidence shows an active root request during internal shutdown,
then delayed startup. The gateway recovered without deleting state or locks.
Direct `launchctl kickstart -k gui/501/ai.openclaw.gateway` was tested:
command returned in 3.1 s, TCP listened in 12.2 s, authenticated health in
21.7 s. Future private config switches should use
`scripts/switch-openclaw-config.mjs` with an expected source hash and a private
backup directory; it validates first, restarts via launchd, checks health and
restores the exact prior config on failure. Do not copy config contents into Git
or logs. An end-to-end switch on a semantically identical private candidate
returned `ACTIVE`; JSON config equality against its exact backup was true and
both scoped tools still returned `READY`. This is a bounded rollout path, not
proof that OpenClaw never stalls.
Separate non-delivered model turns completed for `ivan-business` and
`ivan-finance`; each `toolSummary` included its own brief tool and both runs
ended normally. This verifies manager-side discovery in addition to direct RPC;
no Telegram message was sent by these tests.

## 2026-09-29 — Codex — activation locale sur GO d'Ivan

Lire docs/ACTIVATION-2026-09-29.md : ce bloc remplace les états inactifs plus anciens ci-dessous.
Branche agent/codex/activation-preflight, base foundation/v1 @fd2ea04 ; aucun changement sur main.
Gateway privé 4311 réel Jev et budget estimé 10 EUR/mois actifs ; plugin runtime épinglé hors checkout.
OpenClaw redémarré, sept rôles configurés, Telegram connecté, appel natif provider jev vérifié.
Workspace main préservé : à la bascule, 4 fichiers de contexte / 12 fichiers mémoire inchangés.
Test DM IVAN-ACT-20260929-C : Jev → Engineering → worker isolé → rapport vérifié → Telegram,
11:04:14–11:04:49 UTC, trois assertions vérifiées, tests proposés non exécutés, aucun exec/write.
Deux essais ont révélé NO_REPLY ; message de sessions_yield, pas acknowledgment, corrige la reprise.
Contrat installé dans six espaces générés, sauvegardes privées ; 11/11 tests runtime passent.
Claude informé pour orchestrateur-ia, deux calibrations séparées et activation de son hook shadow.
Ne pas modifier son worktree, skills/agents/CLAUDE/.claude/hooks/claude, AGENTS ou constitution.
Retour arrière validé : configuration privée rollback + plugin legacy épinglé 963860a + service 4310.
Ne pas afficher ces configurations/credentials ni effacer le budget. Aucun nouveau modèle configuré.
Ouvert : confirmation des métriques Claude/shadow, autres domaines, mémoire OpenClaw, service permanent/OVH.
Prochaine action : construire l'outil de lecture Obsidian borné pour system/knowledge, sur branche Codex.

## État actuel après GO #6 → #7 → #8

Les trois PR sont réellement fusionnées dans foundation/v1 @f6bb2e3. Les paragraphes plus anciens
qui les disent en attente sont historiques. Lire `docs/COORDINATED-ACTIVATION.md` en premier.
Ivan a choisi le coffre unique `~/Ivan AI OS Brain/Obsidian/Ivan AI Os Notes`, déclaré dans
`~/.ivan-ai-os/config.json` ; l'ancien chemin Documents n'est plus la cible. Pas de recréation.
La capture utilisateur montre la décision de fusion validée ; aucune lecture de note personnelle.
Codex prépare la suite sur agent/codex/coordinated-runtime : workspace actuel de main conservé,
memoire-obsidian exclu d'OpenClaw, proposition privée validée nativement, runtime versionné hors
checkout. Sept artefacts sous ~/.ivan-ai-os/managers-f6bb2e3-coordinated ; aucun rôle activé.
Quatre fichiers de contexte et douze fichiers mémoire de main inchangés ; corps mémoire non lus.
Base fusionnée 88 tests ; résultat Codex 95 tests. Aucun appel modèle/TypeSafe payant.
Les défauts synthétiques credentials/mode du helper mémoire #8 subsistent : relayés à Claude.
Bascule live, clé privée TypeSafe, rotation credentials et GO d'activation restent à accomplir.
Le pilote Claude sera shadow et vise le gateway 4311 ; ne pas changer son worktree/settings ici.
PR #9 est l'ancien seed/contrat mémoire : ne pas appliquer ses chemins ou relais devenus obsolètes.

Livraison effective : PR #10, commit runtime 151b2b1, CI 6/6 verte. Snapshot préparé dans
~/.ivan-ai-os/releases/151b2b1 ; chargeur natif sur cette copie vérifié, authentification et
métadonnées uniquement, zéro appel TypeSafe réel. Candidate privée
~/.ivan-ai-os/activation-151b2b1/openclaw.proposed.json validée : ne jamais afficher ce fichier,
il conserve les credentials de la configuration existante. Source/context fingerprints associés.
Le GO d'activation a été demandé ; ne pas assimiler son absence à une autorisation.
Claude doit relire #10 ; après bascule seulement, son hook vise 4311 en shadow dans ce projet.
PR #11 indépendante, agent/codex/jev-holdout @d484849 : 19 cas de validation disjoints,
13 multi-tâches, priorités inversées, six managers ; 48 tests gateway et CI 6/6 verts.
Labels écrits avant toute prédiction ; revue Claude demandée. Aucune mesure live ni seuil modifié.
Le runner de #11 accepte --holdout ; 19 + 19 appels réels éventuels, avec le budget commun.
La quatrième question action.permission exige toujours un corpus distinct.

## Dernière continuation : sept espaces et revue Claude

Calibration livrée séparément sur `agent/codex/jev-calibration` : lire `docs/JEV-CALIBRATION.md`.
19 catégories étiquetées, quatre tests de métriques/transport synthétiques, zéro appel payant.
PR #6 (040a9f9) et #7 (0cb3e68) poussées, six jobs CI passent pour chacune ; les jobs Claude
restent conditionnels tant que leurs sources ne sont pas fusionnées. Une copie d'intégration
isolée combine notre branche, skills/agents fa9c9e0 et hooks Claude dad877d7 : 83/83 tests passent.
Ce n'est ni une fusion Git ni une activation. Revues favorables/commentaires publiés sur #3/#5,
questions de calibration livrées à Claude ; #6/#7 attendent sa revue. Aucun contenu Obsidian lu ;
configuration Obsidian locale et recherche par nom n'ont pas trouvé le chemin du coffre.
Le runner live passe par le gateway authentifié et son budget ; aucun nouveau endpoint ni
qualité Jev live revendiquée. Claude peut préparer calibration-jev sur les questions disponibles.
Services existants 4310 et 18789 répondent à /health ; aucune bascule effectuée.

Lire `docs/MANAGER-RUNTIME.md`. Source Codex sur `agent/codex/manager-runtime` : 60 tests
gateway/route/observer/managers passent. Les défauts signalés sur le taux 1.005 et les chemins
absolus via alias sont corrigés avec tests de régression (échec observé avant correction).
Le verrou abandonné reste un refus conservateur documenté, pas une récupération automatique.
Claude PR #3 relue @fa9c9e0 : corrections acceptées, 13 tests. PR #5 relue @dad877d7 : six tests
contre un vrai gateway local synthétique passent, aucun appel payant ; shadow reste consultatif.
Les PR #2/#3/#4/#5 ne sont pas encore fusionnées ; GO de fusion demandé à Ivan.
Sept espaces privés réellement préparés sous ~/.ivan-ai-os/managers, fragment validé par le
vrai OpenClaw 2026.9.5 dans un état temporaire. Aucun agent activé ni modèle démarré.
Ivan a changé le périmètre Finance : Claude pour le contexte personnel, OpenClaw pour la veille
et les opportunités publiques. Finance OpenClaw a recherche-sourcee/rapport-telegram sans profil.
Le plan de dispatch est vérifié mais reste une proposition : prochain jalon, activation coordonnée
et preuve Telegram → manager → worker → résultat. Ne pas confondre préparation et fonctionnement.
AGENTS/constitution et le worktree Claude n'ont pas été modifiés.

## Continuation Codex — API privée, collaboration et entreprise virtuelle

Lire `docs/SECURE-GATEWAY.md` et `docs/REVIEW-CODEX-SKILLS-2026-09-29.md`.
Source sur `agent/codex/secure-gateway` : 54 tests, vérification native isolée, zéro appel payant.
Bearer sur route/evaluate-tool/decide/usage ; routage uniquement par enums ; decide devient alias
concret ; budget durable estimé 10 EUR/mois choisi par Ivan, aucune limite de 500 appels.
Provisionnement mock testé en répertoire/port temporaires. Bascule live non effectuée : contrat
incompatible, plugin lié au checkout, ancien service/bot à préserver jusqu'à activation coordonnée.
Claude PR #3 relue @e6eea34 : 16 skills, 7 managers, 9/9 tests ; corrections de packaging demandées.
Codex PR #2 corrigée @84d2bc0 : faux positifs sensibles levés sans exceptions globales, 44 tests.
Neuf skills career/knowledge/system installés hors Git dans ~/.openclaw/skills, profils réduits,
aucun repli vers le profil privé complet. Ni configuration ni restart du gateway modifiés.
Ivan a réaffirmé les sept rôles : chef de cabinet + six managers et workers temporaires.
Conserver cette architecture entière ; préparer tous les espaces et un dispatch vérifié.
Le manager Finance est inclus, avec données personnelles réservées au contexte privé Claude.
Les fichiers managers sont des définitions, pas une preuve d'agents actifs ou de dispatch.
AGENTS/constitution/CLAUDE et le worktree Claude restent inchangés par Codex.

## Mission
Build Ivan AI OS in private repository `FreezyXV/Ivan-AI-Os`, branch `foundation/v1`. Read `docs/ROADMAP.md`, `docs/USER_ACTIONS.md`, `docs/DECISION-PLANE.md`, and `hooks/openclaw/ivan-route/README.md` first. Continue implementation and verify real behavior with the least necessary changes. Ivan authorized work on his Mac when a local session has access; never presume a cloud session's loopback points to his Mac.

**Latest local continuation, 2026-09-29:** Telegram end-to-end routing remains verified; read `docs/TELEGRAM-VERIFICATION.md`. Observer milestone `4d432b7` was tested and pushed to `foundation/v1`, followed by a conflict-free merge/push of Claude's two reviewed commits in `0ee3363` (40 tests). Follow-up source on `agent/codex/review-hardening` has 43 passing tests, improved path protection and nonthrowing optional observer registration; it awaits Claude's PR review before merge. Read `docs/RESPONSE-TO-CLAUDE-2026-09-29.md` for the complete response, evidence and unapplied policy proposals. Neither evaluator nor observer is activated in the existing Mac service, and neither enforces permissions. Preserve the full project vision and later workstreams below.

**Coordination:** Codex leads the global plan and owns the decision plane/OpenClaw adapter; Claude owns skills, agent definitions and the Claude adapter, and reviews Codex's PR. New work uses `agent/<name>/<topic>`. Do not edit Claude's worktree or overlap his files. `AGENTS.md` and constitution changes require mutual agreement plus Ivan's GO. Ivan requested lower token overhead: use targeted reads/tests, defer standalone packaging, exact-time expiry and advanced historical HMAC verification; keep checks focused on functional behavior, private credentials, provider consumption and irreversible actions. No blanket security-policy waiver is inferred.

Ivan's current objective explicitly includes agents, skills, bot, OpenClaw and OVH. Evaluate OVH as the VPS target when preparing the private runtime proposal; no server was purchased or provisioned, and no OVH plan/price is yet approved. Optimize one verified end-to-end workflow before adding parallel engines.

## Working environment and boundaries
- Ivan's Mac runs OpenClaw 2026.9.5 as a LaunchAgent, Gateway on local loopback, Telegram bot `@secretaireivanbot` routed to agent `main`. The `ivan-ai-os-route` plugin is linked from this repo, inspected as loaded, and exposes `ivan_route`.
- The TypeSafe/Jev API key exists on the Mac. `bash scripts/mac-jev-smoke.sh --stay` prompts for it privately and runs Jev Gateway on `http://127.0.0.1:4310` while that terminal remains open. Do not read, copy, display, or commit keys, tokens, cookies, or secret store values.
- Telegram DMs use an allowlist. OpenClaw `tools.deny` contains `exec`; host exec policy is allowlist with approval. The plugin invokes an HTTP service; it does not need to grant shell access to the Telegram agent.
- Obsidian vault is named `Obsidian Notes`; path and permissions are unconfirmed.
- No additional AI subscriptions beyond ChatGPT Plus and Claude Pro. Ivan permits research, source changes, GitHub pushes and Obsidian work; purchases, payments, transactions, external contact and applications require his approval. Never message job prospects.
- A previously shared terminal transcript exposed a Telegram credential and an earlier screenshot showed a Gateway credential. The project docs note future replacement. Never reproduce values in chat or repo.

## Proven as of 2026-09-28
1. Live TypeSafe smoke: HTTP 200, `provider: "jev"`, engineering route for a synthetic Node.js task.
2. `openclaw plugins inspect ivan-ai-os-route --runtime`: plugin loaded with tool `ivan_route`.
3. `openclaw channels status --channel telegram --probe`: Telegram default reported running and connected to `@secretaireivanbot`.
4. Direct OpenClaw Gateway RPC succeeded after using an explicit timeout. The exact Mac command was:
   ```bash
   openclaw gateway call tools.invoke --json --timeout 45000 --params '{"name":"ivan_route","agentId":"main","args":{"text":"Écris un test unitaire pour une fonction Node.js fictive"}}'
   ```
   Result: `ok: true`, `source: "plugin"`, `output.details: {"status":"ROUTED","manager":"engineering","manager_confidence":1,"urgency":0,"needs_details_probability":0.84,"provider":"jev"}`.
5. A preceding RPC without `--timeout` expired after the CLI's 10000 ms default, despite Jev health returning OK. The plugin client was recently changed to allow a 35-second request; the 45-second CLI timeout resolves this direct test.
6. Repo source and tests for Jev Gateway and plugin are in the branch. The latest Mac fast-forward before this handoff pulled commit `7ce24b0` (the handoff commit may be newer).
7. Local Codex fast-forwarded the Mac from `7ce24b0` to `963860a`, preserving the existing untracked `hooks/openclaw/ivan-route/package-lock.json` byte-for-byte. It then verified a Telegram-originated `ivan_route` call at 19:26:54 UTC and a successful Jev result at 19:26:55 UTC. The effective default model is `openai/gpt-5.6-terra`, fallback `openai/gpt-5.6-sol`; exec remains denied. The new evaluator source and tests are described in `docs/TRUSTED-EVALUATION.md`.
8. Commit `d0adb4f` was pushed to `origin/foundation/v1` after explicit user approval. The next continuation built an inactive `ivan-ai-os-observer` plugin and HMAC action bindings. A temporary authenticated mock evaluator and isolated registry using the installed hook runner verified two correlated calls, one detected parameter rewrite, and skipped observation when an earlier hook blocks. No live plugin was installed, no setting/credential changed, and no model, Telegram or TypeSafe call was made for this milestone.

## Resolved verification: model-visible tool in Telegram
A screenshot of an earlier OpenClaw conversation showed a Telegram prompt asking the bot to call `ivan_route`, followed by `{"error":"ivan_route unavailable"}`. The direct Gateway RPC success above happened later, so that screenshot is **not** proof of a continuing failure. The direct RPC demonstrates plugin execution, but it does **not** demonstrate that the language model discovers the tool in a live Telegram conversation.

A fresh local test at 15:36 UTC reproduced the unavailable response. A second diagnostic explicitly permitted dynamic-tool discovery under `openclaw`; this succeeded at 19:26 UTC without configuration changes. The actual runtime event and Telegram response both contain the live Jev engineering route. Do not infer absence from `context.compiled.tools`: the recorded array is truncated. Use the repeatable discovery-aware prompt and scoped evidence in `docs/TELEGRAM-VERIFICATION.md`. The tool remains advisory, not an automatic decision gate or permission system.

## Local-session startup
In the ChatGPT desktop app on Ivan's Mac, choose Codex and attach/select the local folder `~/Ivan-AI-Os` as a local project, keeping the existing checkout instead of creating a detached clone. Open a new chat within that project. If available, use New chat to add the earlier ChatGPT conversation for background, and ask the assistant to read this handoff and the docs named above. First run `pwd`, `uname -s`, `git status --short --branch`, and check whether the Jev Gateway and OpenClaw Gateway are reachable locally. A Linux or cloud shell is not access to Ivan's Mac. Preserve any local uncommitted files (npm install previously dirtied the checkout) and avoid overwriting them.

## Full project vision and product boundaries

Ivan AI OS is Ivan Petrov's private, long-term personal operating system for productive autonomous work, using his Mac and Telegram today and potentially an always-on VPS later. The design is **neurosymbolic**: LLMs perceive, reason and create; TypeSafe/Jev classifies, scores, selects and checks; deterministic code executes; Obsidian stores validated knowledge; Ivan sets strategy and approves consequential actions. The goal is useful outcomes with minimal premium token use, verifiable provenance and a narrow approval boundary. This is the intended architecture, **not** a claim that the later components already run.

Ivan's environment: MacBook Pro 16-inch M1 Pro with 16 GB RAM, iPhone, Cursor/VS Code, OpenClaw, Telegram, GitHub and Obsidian. Current paid AI products are ChatGPT Plus and Claude Pro; assume **no additional recurring AI subscription budget**. A 24/7 VPS around €10–15/month is acceptable *in principle*, with provider, plan, billing and implementation undecided. Local MLX/Ollama is a possible low-cost option subject to quality measurements; do not assume a subscription grants API credits, background execution or suitable commercial terms. Jev API access was confirmed and the live smoke ran, but ongoing usage and cost should be measured.

A six-domain control-plane concept lives in `README.md` and `docs/ARCHITECTURE.md`: OpenClaw as Chief of Staff receives requests, deterministic rules and Jev select a manager, managers delegate bounded jobs to ephemeral workers, tools execute subject to policy, results are checked, and validated evidence is written to memory. The managers are Business/Opportunity, Career, Finance, Knowledge/Anakalypto, Engineering and System. Persistent managers are a target architecture; the current `ivan_route` plugin is **only a model-visible advisory tool**. It does not select the conversation model, automatically route every message, spawn workers, enforce permissions or intercept tool calls. Do not present any target diagram as implemented.

The intended decision cascade is deterministic code → Jev → qualified local model → premium model → Ivan for actions requiring his approval. Context delivery is metadata filtering → targeted retrieval → relevance selection → compact evidence for the worker. Claude Code and Codex are peer builder and independent reviewer, with Jev assessing findings and disagreements; avoid duplicate writing or invoking both by default. Use observed accuracy, cost, latency and outcome to revise routing. A Jev probability is evidence for classification and never independently grants permission.

## A-to-Z workstreams and acceptance criteria

The order below follows `docs/ROADMAP.md`; detailed designs are still provisional. Build incrementally, keep the roadmap factual, and mark a phase complete only after a real workflow has been observed and checked.

| Phase | Intended work | Evidence required |
| --- | --- | --- |
| 0 — Foundation | Versioned constitution, policies, repository layout, schemas, basic service and CI; later private always-on runtime. | Source and CI already exist. VPS and persistent secret handling remain open; do not mark them done. |
| 1 — Decision plane | Jev System One adapter; six-way intent routing; risk classification and policy selection from **trusted local metadata**; authentication, bounded audit, confidence calibration and failure handling. | Live routing is proven. An authenticated shadow endpoint derives conservative categories, rejects caller flags/policies and records redacted audit with a keyed action binding. An inactive native observer is verified in isolation. Live capture, calibration, persistent deployment and enforcement remain pending. |
| 2 — Agent integration | Telegram/OpenClaw, runtime decision hooks and Codex/Claude adapters, manager dispatch, exact-action human approvals. | Fresh DM through `@secretaireivanbot` called `ivan_route` and returned `provider: jev`, verified in UI and runtime events. Next demonstrate a real policy hook and approval flow; advisory routing does not authorize execution. |
| 3 — Memory | Locate `Obsidian Notes` vault and define read/write/sync permissions; Markdown knowledge with provenance, search and deduplication; optional embeddings/pgvector after measuring retrieval; supervised Dream consolidation. | Retrieve a sourced note, update it safely and reject/flag an unsupported or conflicting memory. Protect personal notes and secrets. |
| 4 — Business Engine | Find, deduplicate and evaluate market signals; distinguish near-term **Cash** opportunities (roughly 1–30 days) from **Venture** opportunities (roughly 6–24+ months); send useful briefs to Telegram. | Trace a recommendation to evidence, assumptions, work estimate and possible return; research and drafts can run autonomously, prospect contact needs Ivan's approval. CatalogDrive may be a candidate, not an automatic commitment. |
| 5 — Career Engine | Find Product Owner, AMOA/Business Analyst and related freelance opportunities, match Ivan's actual profile, prepare tailored CV/materials and track outcomes. | Show sourced offers and truthful tailored drafts; Ivan approves each application/recruiter contact. Relevant profile includes TotalEnergies digital PO/AMOA work, technical delivery and earlier automotive sales; check current CV for exact claims before using numbers. |
| 6 — Finance Engine | Monitor ETF/DCA, macro signals, portfolio allocations and drift; assess crypto as market context where relevant. | Provide sourced scenarios and risk assumptions only. Ivan's stated personal investment preference excluded crypto unless he changes it. No trades, transfers or payments without explicit approval. |
| 7 — Engineering Factory | Decompose a scoped task, select a builder (Claude/Codex) and independent reviewer as justified, run meaningful tests, document evidence, propose branch/PR. | A branch/PR with passing checks, clear review findings and bounded tool access; no automatic production deployment. |
| 8 — Anakalypto | Turn topics into sourced claims, fact checks, visual pedagogy and interactive learning content. | Every important assertion traceable to source; factual and UX review before publication. |
| 9 — System Steward | Observe policy drift, unsafe skills/MCP, prompt bloat, tool and model errors, token/cost telemetry and controlled resets. | Measurable diagnostics and reversible improvements; policy changes require review rather than autonomous relaxation. |
| 10 — ROI scheduler | Schedule jobs by expected value, cost and measured success; reduce duplicate research and noisy alerts. | Demonstrate useful work per euro and per unit time, with a record of skipped, retried and completed tasks. |

The later phases are a roadmap, **not** ten parallel builds. Finish the narrow end-to-end route and trustworthy decision boundary before scaling autonomous workflows. Architecture proposals (PostgreSQL + pgvector, queue/Redis, VPS, private encrypted Mac/VPS networking) remain proposals until deployed and verified.

## Confirmed autonomy and safety rules

- Ivan authorizes research, local project development, drafts, Obsidian notes and GitHub pushes/PR preparation. He wants autonomy for routine implementation and Telegram reports.
- His explicit approval is required for **payments/purchases/subscriptions, financial transactions, messages or applications to third parties, publication under his identity and destructive production actions**. Sending a Telegram message to Ivan as a report is within the intended system; messaging prospects is not.
- Preserve the current `tools.deny: ["exec"]` for the Telegram agent unless Ivan explicitly changes the policy through a scoped decision. A local Codex session acting in its own authorized workspace is a different process from an OpenClaw agent granted host shell access.
- `constitution/CONSTITUTION.md`, relevant policies and `AGENTS.md` govern implementation. Never copy secrets into Git, prompts, logs, Obsidian or a transcript. Rotate previously exposed Telegram and Gateway credentials before broadening integration. Never expose the unauthenticated Jev endpoint publicly.
- The existing `/v1/route` classifier and `ivan_route` are advisory. In particular, `REVIEW` means no authorization. Build hard-rule checks, trusted policy lookup, authentication, redacted audit and exact-action approval tokens before making an enforcement claim.

## Concrete continuation for local Codex

1. Verify the execution host is Ivan's Mac (`pwd`, `uname -s`), the checkout and uncommitted files (`git status --short --branch`), and the branch head. Fetch carefully after reviewing local changes. Read `AGENTS.md`, `constitution/CONSTITUTION.md`, `docs/ARCHITECTURE.md`, this handoff, `docs/ROADMAP.md`, `docs/USER_ACTIONS.md`, `docs/DECISION-PLANE.md` and the plugin README. Treat source and current runtime state as authoritative where the handoff ages.
2. Inspect local processes without exposing secrets. Check whether `bash scripts/mac-jev-smoke.sh --stay` is **still** running and `http://127.0.0.1:4310/health` is reachable; if it has stopped, use the hidden prompt workflow when a real Jev test is necessary. Do not assume this cloud session's localhost is Ivan's Mac.
3. Read the recorded successful Telegram verification. A retest is only needed if runtime/source changes justify it; use explicit dynamic-tool discovery and correlate the actual `ivan_route` event/result. Preserve the Telegram allowlist and `tools.deny: ["exec"]`. No discovery-related config change was needed.
4. Review the evaluator/observer and their tests. The installed native hook contract is now inspected: each before handler sees the original parameters, so priority cannot guarantee a final executed snapshot. The observer detects rewrites at completion; its hashes do not grant permission. Next add labeled calibration and exact-action human approval against the host's frozen approval snapshot, then run a scoped live observer pilot after private secret provisioning and credential replacement. Plan a persistent private deployment and precise recurring costs only when reviewable. Source and isolated runtime tests do not mean the live service is deployed.
5. Continue phases in order, incrementally; record each milestone, unresolved assumption, test and next action in repository docs. Do not demand the whole project be finished in one session, and do not silently mark planned components complete.

## Broader roadmap
Phase 0 foundation and Phase 1 advisory Jev routing are largely implemented. A shadow evaluator adds repository policies, authentication, conservative classification and bounded audit. An inactive native observer correlates before/after captures and detects rewrites against the installed runtime in isolation. Persistent private activation, calibration, live capture and enforcement remain pending. Phase 2 has a proven Telegram route; exact-action approvals and enforcement hooks remain open. Later phases add Obsidian memory, business and career engines, financial analysis without automatic trading, an engineering factory, Anakalypto, and ROI/maintenance workflows. See `docs/ROADMAP.md` for checkboxes and precise scope.
