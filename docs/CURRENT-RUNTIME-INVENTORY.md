# Inventaire vérifié du pilote Mac — 6 octobre 2026

Source Codex : branche agent/codex/alerts-integration, code actif d35963e.
Référence distante foundation/v1 : 454b21e. Aucune fusion de ce lot.
CI code actif : 11/11 succès ; 241 tests Node ciblés et 22 Python.

| Composant | Release réellement configurée | Provenance |
|---|---|---|
| Gateway Jev 4311 | orchestrator-d35963e | gateway d35963e, runner Mac cc1d2a5 conservé |
| Worker alertes, toutes les 5 minutes | orchestrator-d35963e | d35963e, file et créneaux conservés |
| Plugin ivan-ai-os-alerts | orchestrator-d35963e | d35963e ; sonde réelle avant complétion |
| Plugin ivan-ai-os-route | fd2ea04 | fd2ea0447ba0b5cd18980704138d6483d0b677a4 |
| Plugin ivan-ai-os-memory | 8151c01-memory | 8151c01192add035fb8523e8375d6105753962cb |
| Plugin ivan-ai-os-engine-briefs | engine-briefs-5224721 | 5224721e2c88d635ecb7419b3afff582437c3d7e |

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
