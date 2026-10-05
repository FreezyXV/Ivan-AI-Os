# Lot Claude courant — architecture et benchmark

Les anciens lots K01–K07 ci-dessous ont été livrés et intégrés sur la branche
Codex ; ne pas refaire les huit générations ni les mesures de pertinence.
La mission courante est [CLAUDE-ARCHITECTURE-BENCHMARK-2026-10-05.md](CLAUDE-ARCHITECTURE-BENCHMARK-2026-10-05.md).
Dans Cursor / Claude Code : worktree `~/Ivan-AI-Os-claude`, branche
`agent/claude/architecture-benchmark` depuis `origin/agent/codex/alerts-integration`.
Noter le SHA examiné. Runtime actif `a604aa6`, contexte v5, mode native-editorial.
Deux synthèses automatiques sont livrées (reçu 59). Codex maintient le runtime.
PR #60 est livrée : ne pas recréer le benchmark ni refaire les anciennes passes.
Lire REVIEW-CODEX-ARCHITECTURE-BENCHMARK-2026-10-05.md ; corriger le calcul
des seuils contradictoires, puis relire les mesures et les vrais messages.

Priorité Ivan : fiabilité, puis Business et Finance. Jev est facultatif et doit
être qualifié par tâche. Comparer règles, Jev et complétion native regroupant
jugement éditorial et prose. Livrer benchmark indépendant, recommandations,
contrats métier et relecture de la vraie synthèse ; Codex intègre le runtime.
Career reste en pause, OVH différé, Knowledge/Anakalypto en dernière étape.

## Ancienne mission — conservée pour provenance

# Lot Claude restant — après intégration Codex

À donner dans le terminal Claude Code de Cursor, worktree `~/Ivan-AI-Os-claude`.
Codex reste responsable du runtime et de l'activation. Claude reste responsable
des skills, contrats métier et de la relecture indépendante. Aucun travail
supplémentaire sur Knowledge/Anakalypto avant la fin du pilote actif.

Vérifier `pwd`, `uname -s`, `git status --short --branch`, puis `git fetch origin`.
Conserver les modifications locales. Ne pas utiliser stash/reset/clean ni forcer
un checkout. Poursuivre chaque correction sur sa branche d'origine ; un nouveau
lot part de `origin/foundation/v1` sur `agent/claude/alerts-qualification` dans un
checkout propre séparé si nécessaire. Ne pas changer le worktree de Codex.

Lire AGENTS.md, constitution/CONSTITUTION.md, docs/ARCHITECTURE.md, puis les
versions **distantes actuelles** de ces documents sur `origin/agent/codex/alerts-integration` :
SESSION_HANDOFF.md, PROJECT-CHECKLISTS.md, REVIEW-CODEX-K04-K07-2026-10-05.md,
ALERT-EDITORIAL-GENERATION-MEASURE-2026-10-05.md et MAC-ALERTS-RECOVERY.md.
Leur état courant prime sur la revue #56 des anciens commits. PR Codex #57 existe
et ses correctifs de digest, releases, installation et extrait entier sont testés.
Source qualifiée 49060ea : CI 11/11 ; worker 0b098d7, plugin 23cf0be,
gateway 9136f58. Vérifier le nouveau HEAD si un commit documentaire suit.

## 1. K04 — corriger puis terminer #54

Retirer ou qualifier l'attribution à l'énergie de l'écart inflation totale/
sous-jacente : cet écart ne prouve pas une contribution respective sans décomposition.
Conserver le filtre Kraken sur les horodatages, testé avec/sans le retrait runtime.
Relire des synthèses Business/Finance : preuve vs hypothèse vs recommandation,
pas de revenu attendu ou de paiement inventé, veille publique sans transaction.
Fournir à Codex les commits exacts et les tests ; il intègre le parser et retire
son adaptation devenue inutile après cette intégration, pas avant.

## 2. K06 — noter les huit sorties déjà produites

Baselines : `~/.ivan-ai-os/mac-alerts-9136f58/editorial-samples-current.jsonl`.
Compactes : `~/.ivan-ai-os/mac-alerts-23cf0be/editorial-samples-compact.jsonl`.
Corpus #55 @ba9fbe80 : mêmes I01/I02b/I12/I13 ; I12 est synthétique.
Les deux variantes ont passé les contrôles mécaniques. Noter indépendamment
fidélité, utilité, action et effort (0–2), avec erreurs précises et citations.
Ne pas ajouter de KEEP fictif : ces sorties mesurent seulement la prose.
Corriger `evaluer.mjs` : sans sélection mesurée, afficher N/A et exclure ce cas
du dénominateur de pertinence ; tester sorties de prose seules et sorties mêlées.
Comparer les variantes en masquant leurs noms si possible. Le gain observé est
de 27–33 % en caractères ; ni tokens facturés ni vitesse causale ne sont mesurés.
La compacte reste réservée aux évaluations, jamais active en production.
Rendre les vingt répétitions ThinkingBox proportionnées, pas un seuil universel.
Actualiser #55 : le protocole ancien de douze sélections est déjà exécuté.
Ne faire aucun nouvel appel payant pour reproduire ces huit sorties.

## 3. K03/K06 — nouveau jeu de pertinence réellement indépendant

Créer 12–16 cas nouveaux, disjoints des corpus et articles déjà utilisés.
Identifier publiquement la source, la date, l'extrait réellement lu et sa couverture.
Inclure usages clairement actifs, bruit promotionnel, intérêt plausible insuffisant,
article utile mais ancien, source inaccessible, Career en pause, tâches mêlées et
urgence qui dépend d'un inventaire réel. Séparer cas synthétiques et sources réelles.
Étiqueter avant la mesure, argumenter KEEP/REVIEW/SKIP et désaccords possibles.
Ne pas supposer qu'un avis Next.js concerne une installation qui utiliserait Next.js.
La v3 reçoit 1200 caractères, pas 500 ; ne pas calibrer seulement sur les abstentions.
Livrer fixtures et labels séparés, empreintes et protocole. Codex réalise une passe
payante coordonnée après correction du classifieur ; aucune calibration parallèle.
Les seuils se valident sur ce jeu neuf, ils ne se baissent pas pour forcer un reçu.

## 4. K07 — relire le HEAD précis de #57

Noter le SHA avant chaque constat. Relire file/digest, archivage et restauration,
publication atomique des blobs, conservation des envois incertains, dédoublonnage
exact interproducteur et des aliases acquis après lecture, refus d'une calibration
répétée avant tout appel, isolement du prompt compact et rollback d'installation.
Contester avec une commande ou un test ; ne pas recopier une observation obsolète.
Ne pas modifier services/, shared/, scripts runtime ou hooks/openclaw/ de Codex.

## 5. K05/K09 — compétences et exploitation

Relire les skills réellement compatibles avec le plan natif ; Career reste en pause,
Engineering reste prévu sur Codex/Claude. Ne pas remettre des consignes shell chez
un rôle sans shell. Les sept définitions sont conservées, pas sept agents permanents.
Le hook Claude #49 @277588c est installé : ne pas revenir à shadow pour contourner
une validation. Codex a préparé un adaptateur natif réutilisant cette même copie ;
PreToolUse ask n'est pas supporté par Codex, son adaptateur refuse explicitement ce
cas. Relire ce raccord ; aucune installation globale ni contournement de confiance.
Relire MAC-ALERTS-RECOVERY.md, préparer K09/K10 avec les limites encore ouvertes.

Livrer les corrections sur leurs propres branches, tests, commits et PR brouillon
vers foundation/v1 ; aucune fusion ou activation. Pas de nouvelle demande de GO
pour le travail réversible déjà autorisé. Faire une passation indiquant précisément
ce qui est évalué, ce qui est source et ce qui fonctionne dans le runtime réel.
