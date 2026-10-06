# Checklists Codex et Claude — jusqu'à la livraison du pilote Mac

Décision Ivan du 5 octobre 2026. Codex pilote l'ensemble et l'intégration ;
Claude construit les skills et les contrats métier, puis relit le runtime.
Ce fichier est le suivi commun. Une case est cochée seulement avec une preuve
et indique si le résultat est **source**, **activé** ou **vérifié de bout en bout**.
Une PR verte seule ne prouve pas le fonctionnement sur Telegram.

## Ce que signifie « projet terminé »

Le pilote Mac est terminé lorsque les parcours ci-dessous fonctionnent avec
des résultats utiles, datés et traçables ; les reprises après panne sont testées ;
les coûts et la charge sont mesurés ; Ivan peut utiliser et maintenir le système
sans interventions répétées de Codex ou Claude. Knowledge/Anakalypto constitue
la dernière étape de cette livraison. La pause Career et le report OVH ne
bloquent pas cette définition. Ne pas annoncer un service permanent pendant
le sommeil du Mac sans en avoir mesuré le comportement.

## Intégration #63 et lecteurs — 6 octobre

- [x] **Activé d35963e** : Mistral et Cloudflare lus, date primaire conservée,
  reprise après disparition RSS, refus de lecteur/faits explicités, avertissements
  Business durables et prompt centré sur une demande de marché.
- [x] **Reprise réelle** : cinq pages lues, quatre Jev ; contrôles suivants sans
  dépense ni renvoi. Sauvegarde et restauration sur copie, trois reçus préservés.
- [ ] **Qualification éditoriale fraîche** : aucune nouvelle synthèse native dans
  ce lot. Mistral incertain et Cloudflare ancien ne sont pas forcés en alertes.

241 tests Node, 22 Python et CI 11/11. Inventaire actuel complet et limites dans
CURRENT-RUNTIME-INVENTORY.md ; Claude #63 reprise avec provenance, aucune fusion
foundation/main. Mission suivante : CLAUDE-NEXT-PR63-2026-10-06.md.

## Intégration #62 — 6 octobre

- [x] **Activé 33480ee** : fiches Business exploratoires, même appel natif,
  vérificateur Claude corrigé, score explicite recalculé, catalogue transactionnel
  et digest commun ; reprise et archive manquante testées sans second envoi.
- [x] **Activé** : tous les codes diagnostic simultanés ; sonde réelle de l'outil
  de rédaction. Défaut require/ESM asynchrone reproduit puis corrigé ; la bascule
  refuse désormais un gateway sain sans outil chargé.
- [x] **Qualification historique** : B03, un natif réel, 32 s, fiche validée
  1307 caractères ; aucun Jev ni sélection/fraîcheur de production revendiqués.
- [ ] **Qualification quotidienne** : fiche utile fraîche, avis indépendant Claude,
  coût natif réel et vraie veille du Mac. Le test historique ne coche pas C10/C12.

CI runtime 11/11 ; 323 tests ciblés au correctif du chargeur, 148 concernés après
ajustement final du format. Seuils et mode E conservés. Catalogue prod encore zéro.
Mission Claude : CLAUDE-NEXT-PR62-2026-10-06.md ; aucun nouveau benchmark.

## Intégration #61 — 6 octobre

Code actif 2a51fa1, CI 11/11 ; noms complets et alias corrigés, masque téléphone
partagé, refus de contenu visibles. Les cinq commits Claude sont repris.
Six nouvelles sources : zéro bruit mais 0/1 utile retenu ; deux premières
complétions sur abstentions ne récupèrent pas cet utile. Recours non activé.
Mesure détaillée : ALERT-V6-QUALIFICATION-2026-10-06.md ; ne pas rejouer ce jeu.
Business : contrat/corpus source intégré, vérificateur non qualifié (quatre
contre-exemples) ; aucune recommandation automatique activée. Claude corrige,
Codex raccorde après revue. Coût natif/qualité quotidienne/veille réelle ouverts.

## Corrections activées — 6 octobre 2026

Worker/gateway/plugin bf2d2e1, contexte v6, mode conservateur inchangé (.75).
366 tests Node / 19 Python ; six corrections détaillées dans
REVIEW-CODEX-EDITORIAL-FIXES-2026-10-06.md. Lecture HF réelle sans en-tête,
probe du plugin sans complétion ; budget inchangé pendant cette activation.
Rejeu hors ligne Next.js ancien : refus pour sigle absent de sa propre citation.
La qualité générale et l'utilité des prochains messages restent à mesurer.
Les trois messages reçus sont des preuves de livraison, pas trois preuves de qualité.
Claude #60 intégrée jusqu'à 8549eac ; sa correction du scoreur acceptée.
rapport-telegram 2.1.0 installé chez les quatre rôles existants avec sauvegardes.
Claude poursuit CLAUDE-PILOT-QUALIFICATION-2026-10-06.md, sans rejouer les mesures.

## Avancement du 5 octobre — intégration des alertes

PR #57 : worker @9f7f653, plugin/gateway @1c769a3, contexte v5, jev-native-editorial actif.
223 tests locaux passent. Source Next.js officielle → vrai Jev keep 0,92 →
validation native → digest page 2, reçu 60 ; aucun renvoi ni nouvel appel au second passage.
Benchmark neuf : Jev .75 trouve 4/5 sans faux keep ; natif 4/5 avec trois faux keep.
Mode conservateur E : 3/5 sans faux keep, rappel limité conservé dans le rapport.
CI 11/11 à cette activation ; 212 tests locaux. Planning exclusif et file conservés.
C10 technique : trois vraies sources livrées, reçus 59 et 60.
Appréciation d'Ivan/qualité indépendante restent ouvertes ; aucun KEEP simulé.
C07 : Jev reste consultatif et facultatif ; probabilités contradictoires → review.
C08 : une seule complétion pour utilité et prose ; au plus deux par passage.
C08/K06 : huit sorties antérieures notées 27/32 par Claude ; utilité insuffisante.
Production current conservée ; les deux messages réels demandent une revue neuve.
C14 : diagnostic tient compte du mode actif, distingue backlog natif et anciennes reviews Jev.
C18 : après deux livraisons, 715 appels / 0,026624 EUR Jev estimé ; prose non facturée ici.
C15 : Engineering Codex/Claude conservé ; pas d'usine native prétendument exécutée.
#50–#55/#58/#59 intégrées avec provenance sur la branche Codex, sans fusion foundation/main.
#49 installée en gate (12/12), permissions conservées. #60 : benchmark indépendant en cours.
Business collecte/tri public et Finance snapshots fonctionnent ; opportunités approfondies,
une vraie nuit de veille, qualité quotidienne et inventaire d'urgence restent à qualifier.

## Checklist Codex — responsable de la réalisation et de l'intégration

### 1. Périmètre et état réel

- [x] **C01 — activé** : Career absent du registre actif, des délégations et des
  tâches ; workspace/définition conservés. Préparation future sensible aux pauses.
  Preuve : `~/.ivan-ai-os/pause-career-complete-20261005/result.json` ;
  voir `MAC-PILOT-OPERATIONS.md` et les tests de non-réactivation.
- [x] **C02 — consigné** : OVH reporté, Knowledge/Anakalypto finalisé en dernier ;
  mémoire System maintenue. Voir `MAC-PILOT-PRIORITIES.md`.
- [x] **C03 — consolidé** : consolider les versions réellement actives et les PR encore
  ouvertes (#21, #45, #46, #47 notamment), vérifier les écarts source/runtime
  et préparer leur intégration après revue. Fin : provenance de chaque release,
  CI et état de fusion enregistrés ; aucune activation attribuée à une PR seule.
  CURRENT-RUNTIME-INVENTORY.md : marqueurs des releases, quatre plugins, runner,
  six rôles actifs, source d35963e CI verte et ordre des PR. Fusions encore ouvertes
  explicitement distinguées de l'activation ; leur GO n'est pas présumé.

### 2. Alertes Telegram — première priorité

- [x] **C04 — cartographie vérifiée** : identifier les producteurs, dossiers, horaires et canaux réels
  de Sentinelle et de la Secrétaire. Fin : carte source → producteur → bot et
  point d'intégration confirmé ; aucune seconde collecte du même moteur.
  Sentinelle identifié : dépôt FreezyXV/sentinelle, GitHub Actions, MODE=ombre,
  quatre passages/jour + digest. Carte et export PR #1 dans
  `SENTINELLE-INTEGRATION.md` ; état final dans CURRENT-RUNTIME-INVENTORY.md :
  Mac → file commune → digest Secrétaire ; ancien Sentinelle désactivé, export
  distant uniquement manuel vérifié, heartbeat/mémoire distincts de la veille.
- [ ] **C05** : brancher la collecte et la lecture effective des sources.
  Fin : dates et extrait vérifiés, accès incomplet visible, source inaccessible
  jamais transformée en résumé supposé.
  Planning et lecteurs bornés activés : Simon, HF, Next.js, BCE et Ask HN ;
  preuve réelle Next.js v3 conservée. Les sites hors périmètre restent non lus.
  Réception directe des flux publics sur Mac ; aucun artifact distant à attendre.
- [ ] **C06** : file durable commune, dédoublonnage entre bots, filtre de
  fraîcheur/périmètre, reprise après panne et réservation des tâches.
  Fin : preuves de concurrence, de redémarrage et de doublon interproducteur.
  Source testée en #48 ; sélection/synthèse/envoi bornés, reçus Jev conservés.
  Capacité fondée sur les tâches actives ; doublons de preuve exacte lus avant Jev.
  Archives terminales, expiration des reviews anciennes et restauration sur copie
  testées. La qualification sur les producteurs réels reste ouverte.
  Régression corrigée : une entrée RSS non lue acquiert sa preuve de page sans
  perdre le dédoublonnage ni rouvrir un envoi incertain.
- [ ] **C07** : sélection Jev sur un contexte public compact ; pas de Jev pour
  les exclusions évidentes. Corriger les contrats cassés des moteurs, dont
  les valeurs Finance « 12 % » / « ±10 % sur 7 jours ».
  Fin : requêtes du vrai client acceptées et budget commun conservé.
  API `/v1/alerts/select` active sur 4311, reçu Jev réel vérifié ; vrai client
  Finance contre ce gateway : les deux formats acceptés. Budget conservé.
  Jev facultatif : contexte v5 mesuré, contrôle antérieur insuffisant pour une
  qualification universelle ; #60 compare les architectures sur un jeu neuf.
- [ ] **C08** : synthèse après sélection, consommant le contrat Claude K01/K02.
  Fin : faits étayés, utilité liée à une priorité active, action ou rien à faire,
  limites et lien final ; pas de génération pour les éléments écartés.
  Générateur/contrat activés ; quatre sorties natives K06 réelles contrôlées,
  sans sélection ni envoi. La mesure indépendante de fidélité/utilité reste ouverte.
- [ ] **C09** : digest pour l'ordinaire, urgence justifiée pour l'immédiat,
  reçu Telegram, absence de renvoi automatique après un envoi incertain.
  Fin : un même élément livré une fois, même si les deux bots le proposent.
  Digest paginé, reçu technique 58 et file commune actifs ; test de reprise
  sans doublon. Urgence liée à l'inventaire reste ouverte ; aperçu manuel distinct du tri.
- [ ] **C10** : parcours réel source → filtre → synthèse → Telegram pour
  Sentinelle puis Secrétaire, avec K03. Fin : reçu et appréciation d'Ivan ;
  distinguer test synthétique, source réelle et test Telegram.
  Parcours technique réel vérifié : trois articles publics, reçus 59/60, avec
  vrai Jev puis validation native pour Next.js dans le mode courant.
  La case reste ouverte jusqu’à la revue de qualité et l’appréciation d’Ivan.

### 3. Moteurs Business / Finance et cycle Mac

- [ ] **C11** : plannings locaux Business et Finance, exclusifs et bornés ;
  reprise du Mac sans rattrapage qui inonde Telegram ; état de dernière réussite.
  Fin : un cycle réel de chaque moteur, puis un cycle manqué/repris contrôlé.
- [ ] **C12** : parcours Business preuves → recommandation → synthèse ; Finance
  veille publique → changement pertinent → explication. Fin : outils natifs,
  données fraîches et cohérence métier relue par Claude K04.
- [ ] **C13** : fixer les causes récurrentes d'arrêt et de non-livraison,
  notamment reprise du chef (#21), redémarrage, Trousseau, timeouts et versions.
  Fin : reproduction avant correctif et vérification après panne simulée,
  sans effacer le budget, la mémoire ou la personnalité de la Secrétaire.
  Career/maintenance Workshop corrigés et vérifiés nativement ; #21 reste ouvert.
- [x] **C14 — diagnostic vérifié** : vue locale de santé et diagnostic exploitable : services,
  tâches, backlog, erreurs, dernière livraison, coût estimé.
  Fin : cause et prochaine action compréhensibles, sans inspection manuelle
  de multiples journaux ni contenu privé dans les messages d'état.
  `scripts/inspect-mac-pilot.mjs` : services, budget, cycles, backlog, raisons,
  prochaine action et reçu. Santé native 14:11 UTC, worker 9136f58, sortie 0.
  Queue prod 14 review/3 skipped, zéro reçu ; symptômes distingués de la santé des services.

### 4. Engineering et System

- [ ] **C15** : parcours tâche → builder → reviewer → tests → branche/PR,
  sans double travail Codex/Claude. Fin : une tâche réelle livrée et relue,
  provenance et limites d'exécution enregistrées.
  Plan source conforme à compatibility/runtimes ; Engineering Codex/Claude
  conservé, passation explicite. Son worker natif live n'est pas migré implicitement.
- [ ] **C16** : déterminer le contrat de hook réellement supporté par Codex,
  puis adapter les mêmes règles que Claude si possible. Fin : preuve native ;
  si aucune interface existe, documenter la limite et le contrôle alternatif,
  sans annoncer un hook fictif ni contourner les approbations existantes.
  Interface PreToolUse native découverte dans Codex 0.160.0 ; adaptateur source
  testé (4 cas), règles Claude réutilisées. Découverte untrusted, pas activé.
  ask est non supporté : traduit en blocage, jamais en autorisation.
- [ ] **C17** : contrôle proportionné des outils OpenClaw, observation et
  décisions humaines liées à l'action exacte quand nécessaire.
  Fin : pilote ciblé mesurant blocages utiles, faux refus et latence ;
  aucun appel Jev ajouté aux opérations ordinaires déjà classées par code.
- [ ] **C18** : métriques par workflow : temps, appels, tokens disponibles,
  coût estimé, doublons et résultat utile ; reprise/contexte maîtrisés.
  Fin : mesures sur usages réels, budget Jev commun 10 €/mois, optimisations
  prouvées avant/après avec Claude K06.
- [ ] **C19** : mémoire Obsidian System : lecture ciblée fiable, propositions
  de consolidation, contradictions et éventuelle écriture séparée.
  Fin : provenance, doublons/conflits testés, aucune proposition présentée
  comme décision validée ; aucune écriture nouvelle activée implicitement.

### 5. Dernière étape — Knowledge/Anakalypto avec Claude

- [ ] **C20** : fournir les outils et le runtime du parcours Knowledge/Anakalypto,
  puis l'intégrer avec K08. Attendre les étapes précédentes.
- [ ] **C21** : lier les reçus Jev Anakalypto aux décisions effectives du gateway.
  Fin : le reçu forgé décrit dans `REVIEW-CODEX-CLAUDE-2026-09-29.md` est refusé ;
  validation humaine avant publication externe.
- [ ] **C22** : vérifier ensemble un parcours complet sujet → sources → faits →
  pédagogie/visuels → QA → brouillon prêt. Fin : revue indépendante Claude/Codex
  et validation Ivan ; la publication elle-même nécessite son GO.

### 6. Livraison finale du pilote

- [ ] **C23** : campagne des parcours actifs, modes dégradés et reprises,
  pendant une période de pilote convenue avec Ivan. Enregistrer aussi échecs,
  utilité, charge et coûts ; ne pas fixer une réussite artificielle par le seul
  nombre de tests.
- [ ] **C24** : guide d'exploitation Mac, diagnostic, sauvegarde/restauration,
  arrêt/reprise et mises à jour vérifiés avec Claude K09.
  Guide MAC-ALERTS-RECOVERY.md, sauvegarde SQLite/WAL et archives vérifiées ;
  restauration sur copie sans renvoi d’un envoi interrompu. Revue K09 ouverte.
- [ ] **C25** : bilan final et reste à faire explicite : livré, limité, différé.
  Career réactivable sur demande ; OVH réévalué seulement après le bilan Mac.

## Checklist Claude — travail en parallèle, sans toucher au runtime Codex

K01–K03 : PR #50 relue, contrat repris au runtime ; intégration finale ouverte.
K05 : propositions #51–#53 relues ; raccord capability fait côté Codex en source.
K04 : #54 relue, parser compatible, déduction économique de l'exemple à qualifier.
K06 : #55 relue, huit sorties automatiques remises ; noter leur qualité puis
construire un nouveau jeu indépendant. Ne pas refaire la référence déjà payée.
K07 : #56 relue, défauts de collecte/installation traités et testés côté Codex.
K08 attend la dernière étape ; K09/K10 peuvent préparer la clôture après ces preuves.
Aucune PR Claude fusionnée ici. Installation privée du hook #49 corrigé uniquement ;
aucune modification de ses sources ou de son worktree.

### 1. Contrat éditorial et évaluations — commencer maintenant

- [ ] **K01** : adapter `skills/rapport-telegram/` pour une synthèse autonome,
  constructive et contextualisée, sans longueur imposée artificiellement.
- [ ] **K02** : livrer `docs/ALERT-EDITORIAL-CONTRACT.md` et le workflow associé :
  données d'entrée, faits/sources, contexte compact, utilité, action, incertitude,
  silence/digest/immédiat ; exemples exploitables par Codex C08.
- [ ] **K03** : corpus synthétique puis jeu indépendant : contenu utile, bruit,
  doublons, ancienneté, Career suspendu, source inaccessible, pertinence douteuse
  et tâches mêlées. Fin : critères de jugement explicites, erreurs relevées,
  aucune confusion entre conformité du format et bonne compréhension.

### 2. Métier et compétences utiles — en parallèle de C11–C19

- [ ] **K04** : adapter les contrats Business/Finance à la lecture native et
  aux synthèses ; différencier preuve, hypothèse et recommandation.
  Fin : cohérence des exemples réels, aucune transaction, aucune priorité
  personnelle inventée ; toute personnalisation privée reste locale et ciblée.
- [ ] **K05** : auditer managers/skills réellement sélectionnés : pause Career,
  périmètres, outils présents, déclenchements, arrêt/escalade et cohérence.
  Fin : pas d'instruction inexécutable, pas de skill chargé inutilement.
- [ ] **K06** : mesurer et proposer les réductions de contexte/tokens, contrôler
  les déclenchements et la calibration sur un jeu indépendant.
  Fin : gain mesuré et qualité préservée ; aucun doublon des calibrations live.
- [ ] **K07** : relire chaque lot runtime Codex, en priorité file/envoi, reprise,
  contexte public et contrats entre moteurs. Fin : constats prouvés,
  tests utiles et avis sur les commits exacts ; aucune correction simultanée
  dans les fichiers possédés par Codex.

### 3. Knowledge/Anakalypto — seulement à la fin

- [ ] **K08** : terminer les skills/workflows Knowledge/Anakalypto avec Codex :
  sources, affirmations vérifiées, pédagogie, visuels, qualité et mémoire.
  Fin : le parcours C22 est relu, le reçu falsifié est refusé, le brouillon
  ne prétend pas avoir été publié. Ne pas reprendre ce chantier avant le reste.

### 4. Clôture et exploitation

- [ ] **K09** : relire les parcours réels et la documentation d'exploitation,
  vérifier que les skills chargés correspondent aux capacités actives.
- [ ] **K10** : contre-revue finale indépendante : utilité des alertes,
  fiabilité, erreurs résiduelles, coût et maturité des managers.
  Fin : rapport distinguant résultat prouvé, limite et chantier différé.

## Coordination et fichiers

| Zone | Écriture principale | Relecture |
|---|---|---|
| `services/`, `hooks/openclaw/`, `shared/`, scripts runtime/collecte/envoi | Codex | Claude |
| `skills/`, `agents/`, `hooks/claude/`, `CLAUDE.md`, `.claude/`, workflows métier | Claude | Codex |
| `docs/ALERT-EDITORIAL-CONTRACT.md`, corpus éditorial | Claude | Codex |
| Cette checklist, roadmap, handoff et docs runtime | Codex | Claude |
| `AGENTS.md`, constitution | Accord ciblé des deux + GO Ivan | Les deux |

Worktrees séparés : Codex `~/Ivan-AI-Os`, Claude `~/Ivan-AI-Os-claude`.
Chaque lot : source → tests → commit/push → PR → revue → fusion autorisée →
activation préparée → preuve native → preuve de bout en bout.
Ne pas demander de nouveaux GO pour éditer/tester/pousser sa propre branche.
Les pauses et reports ne sont pas des suppressions. Aucun achat OVH prévu.
Le contrat éditorial peut avancer avant l'identification de Sentinelle ;
son raccordement réel et le test C10 en dépendent.

## Preuves et mise à jour

À chaque lot, associer ses identifiants C/K aux fichiers et tests dans la PR.
Consigner commit, résultat et limite dans `SESSION_HANDOFF.md`, puis cocher
ici le critère réellement satisfait. Les preuves privées restent hors Git.
Les objectifs de fréquence, fraîcheur et pertinence du pilote doivent être
mesurés avant de devenir des seuils déclarés fiables.
