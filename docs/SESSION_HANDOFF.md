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
