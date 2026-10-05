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

## Avancement du 5 octobre — intégration des alertes

PR #57 : worker/plugin actifs @23cf0be, gateway @9136f58, contexte v3.
CI 23cf0be : 11/11. Livraison suivante : 189 tests affectés ; CI à confirmer.
Planning exclusif, workflow Sentinelle distant désactivé. Digest paginé, lecture par
passages, erreurs de releases isolées, reprise/idempotence d'installation vérifiées.
Jev reçoit les 1200 caractères lus ; confiance de livraison conservée à 0,75.
C10 reste ouvert : source réelle → vrai Jev keep 0,26 → review, aucun message forcé.
Le reçu 58 antérieur est un test de transport avec tri simulé ; ce n'est pas C10.
C08/K06 : huit sorties natives isolées, quatre par variante ; contrôles Claude OK.
Prompt compact : 27–33 % de caractères en moins. Qualité indépendante et tokens
facturés inconnus ; aucune accélération démontrée. Production current conservée.
C14 : diagnostic enrichi avec les raisons du backlog et la prochaine action.
C18 : compteur partagé 262 appels / 0,005123 EUR estimé ; coût prose non exposé.
C15 : plan source respectant runtimes/compatibility, Engineering externe conservé ;
son agent live reste intact, pas d'usine native prétendument exécutée.
Claude a proposé #50–#56. Revue détaillée : REVIEW-CODEX-K04-K07-2026-10-05.md.
#49 corrigée et installée en gate (12/12), permissions conservées. Exemple #54 à corriger.
Les cases finales restent ouvertes lorsqu'une preuve source/test ne remplit pas
le critère de qualité ou d'usage réel défini ci-dessous.

## Checklist Codex — responsable de la réalisation et de l'intégration

### 1. Périmètre et état réel

- [x] **C01 — activé** : Career absent du registre actif, des délégations et des
  tâches ; workspace/définition conservés. Préparation future sensible aux pauses.
  Preuve : `~/.ivan-ai-os/pause-career-complete-20261005/result.json` ;
  voir `MAC-PILOT-OPERATIONS.md` et les tests de non-réactivation.
- [x] **C02 — consigné** : OVH reporté, Knowledge/Anakalypto finalisé en dernier ;
  mémoire System maintenue. Voir `MAC-PILOT-PRIORITIES.md`.
- [ ] **C03** : consolider les versions réellement actives et les PR encore
  ouvertes (#21, #45, #46, #47 notamment), vérifier les écarts source/runtime
  et préparer leur intégration après revue. Fin : provenance de chaque release,
  CI et état de fusion enregistrés ; aucune activation attribuée à une PR seule.

### 2. Alertes Telegram — première priorité

- [ ] **C04** : identifier les producteurs, dossiers, horaires et canaux réels
  de Sentinelle et de la Secrétaire. Fin : carte source → producteur → bot et
  point d'intégration confirmé ; aucune seconde collecte du même moteur.
  Sentinelle identifié : dépôt FreezyXV/sentinelle, GitHub Actions, MODE=ombre,
  quatre passages/jour + digest. Carte et export PR #1 dans
  `SENTINELLE-INTEGRATION.md` ; Secrétaire/collectes finales restent à consolider.
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
  Référence indépendante v2 mesurée et insuffisante (3/7 Jev) ; v3 à améliorer
  puis mesurer sur un nouveau jeu, en gardant les exclusions locales séparées.
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
  Article réellement lu → vrai Jev keep 0,26 → review en v3. Pas de génération
  ni reçu forcés ; la chaîne réelle retenue reste à prouver. Le contrat est intégré.

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
