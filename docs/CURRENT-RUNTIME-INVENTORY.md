# Inventaire vérifié du pilote Mac — 6 octobre 2026

Source Codex : branche agent/codex/alerts-integration ; worker actif ab8d294,
gateway/plugin d35963e conservés. Le correctif lecteur ne les modifie pas.
Référence distante foundation/v1 : 454b21e. Aucune fusion de ce lot.
CI d35963e : 11/11 succès. Dernier lot : 261 tests Node concernés passent.

| Composant | Release réellement configurée | Provenance |
|---|---|---|
| Gateway Jev 4311 | orchestrator-d35963e | gateway d35963e, runner Mac cc1d2a5 conservé |
| Worker alertes, toutes les 5 minutes | orchestrator-ab8d294 | ab8d294, file/réglages/créneaux conservés |
| Plugin ivan-ai-os-alerts | orchestrator-d35963e | d35963e ; sonde réelle avant complétion |
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
→ file SQLite commune → filtres déterministes → Jev → jugement/rédaction natifs
si keep qualifié → digest via Secrétaire Ivan. Collecte six heures, Finance matin,
Business semaine et suivi de preuve, digest 19:30 Paris ; créneaux durables.

Ancien producteur : FreezyXV/sentinelle, bot @sentinelleenginebot. API GitHub
vérifiée : workflow Sentinelle disabled_manually. L'export candidat reste actif
au sens GitHub mais uniquement workflow_dispatch sur codex/collector-export,
sans schedule, sans Jev et sans envoi. Le Mac lit les flux directement, sans
attendre un artifact et sans second responsable de livraison.

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
