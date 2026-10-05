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
  Lecture réelle d'un article Sentinelle et preuve de date/empreinte conservées ;
  premier adaptateur blog et consommateur `ingest-alert-candidates.mjs` testés.
  Autres sites et consommation planifiée de l'artifact encore à réaliser.
- [ ] **C06** : file durable commune, dédoublonnage entre bots, filtre de
  fraîcheur/périmètre, reprise après panne et réservation des tâches.
  Fin : preuves de concurrence, de redémarrage et de doublon interproducteur.
  Source testée en #48 ; sélection/synthèse/envoi bornés, reçus Jev conservés.
  Intégration aux producteurs réels et rétention encore ouvertes.
  Régression corrigée : une entrée RSS non lue acquiert sa preuve de page sans
  perdre le dédoublonnage ni rouvrir un envoi incertain.
- [ ] **C07** : sélection Jev sur un contexte public compact ; pas de Jev pour
  les exclusions évidentes. Corriger les contrats cassés des moteurs, dont
  les valeurs Finance « 12 % » / « ±10 % sur 7 jours ».
  Fin : requêtes du vrai client acceptées et budget commun conservé.
  API `/v1/alerts/select` active sur 4311, reçu Jev réel vérifié ; vrai client
  Finance contre ce gateway : les deux formats acceptés. Budget conservé.
  Calibration indépendante de la pertinence encore requise.
- [ ] **C08** : synthèse après sélection, consommant le contrat Claude K01/K02.
  Fin : faits étayés, utilité liée à une priorité active, action ou rien à faire,
  limites et lien final ; pas de génération pour les éléments écartés.
- [ ] **C09** : digest pour l'ordinaire, urgence justifiée pour l'immédiat,
  reçu Telegram, absence de renvoi automatique après un envoi incertain.
  Fin : un même élément livré une fois, même si les deux bots le proposent.
  Adaptateur natif livré, reçu réel 57 et contrôle visuel. Digest et bascule
  vers la file commune restent à terminer ; aperçu manuel distinct du tri.
- [ ] **C10** : parcours réel source → filtre → synthèse → Telegram pour
  Sentinelle puis Secrétaire, avec K03. Fin : reçu et appréciation d'Ivan ;
  distinguer test synthétique, source réelle et test Telegram.
  Article réellement lu → aperçu manuel Codex → Secrétaire Ivan reçu ;
  chaîne automatique Sentinelle et contrat Claude K01/K02 encore ouverts.

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
- [ ] **C14** : vue locale de santé et diagnostic exploitable : services,
  tâches, backlog, erreurs, dernière livraison, coût estimé.
  Fin : cause et prochaine action compréhensibles, sans inspection manuelle
  de multiples journaux ni contenu privé dans les messages d'état.
  Premier diagnostic natif : `scripts/inspect-mac-pilot.mjs` ; backlog et reçus
  des nouveaux producteurs encore à brancher.

### 4. Engineering et System

- [ ] **C15** : parcours tâche → builder → reviewer → tests → branche/PR,
  sans double travail Codex/Claude. Fin : une tâche réelle livrée et relue,
  provenance et limites d'exécution enregistrées.
- [ ] **C16** : déterminer le contrat de hook réellement supporté par Codex,
  puis adapter les mêmes règles que Claude si possible. Fin : preuve native ;
  si aucune interface existe, documenter la limite et le contrôle alternatif,
  sans annoncer un hook fictif ni contourner les approbations existantes.
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
- [ ] **C25** : bilan final et reste à faire explicite : livré, limité, différé.
  Career réactivable sur demande ; OVH réévalué seulement après le bilan Mac.

## Checklist Claude — travail en parallèle, sans toucher au runtime Codex

Les cases ci-dessous sont les tâches attribuées, pas une affirmation que Claude
les a commencées. Son premier lot reste `agent/claude/telegram-syntheses`.
Pour les suivants : une branche par sujet, même worktree séparé.

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
