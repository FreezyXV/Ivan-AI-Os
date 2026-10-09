# Skills adaptés aux capacités natives — 2026-10-04

Les sources complètes de Claude restent inchangées. L'installateur Codex produit
un paquet public court pour trois skills, lorsque leurs outils sont disponibles :

| Skill | Managers | Outils |
|---|---|---|
| business-engine | Business | ivan_business_brief |
| finance-engine | Finance | ivan_finance_brief |
| memoire-obsidian | System, Knowledge | ivan_memory_search, ivan_memory_read |

Ces adaptations lisent des résultats préparés ; elles ne collectent pas de
nouvelles données, ne font pas de transaction et n'écrivent aucune note.
Un relevé ancien reste daté et signalé. EMPTY/UNAVAILABLE n'est pas un résultat.
La collecte, la planification et les propositions d'écriture restent distinctes.

`installOpenClawSkills` accepte `availableTools`, `selectedNames` et
`profileMode: "none"`. Une sélection explicite indisponible lève désormais
SKILL_CAPABILITY_UNAVAILABLE, au lieu de réussir avec une liste vide.
Les paquets adaptés ne contiennent ni profil ni dossier scripts ; les métadonnées
indiquent lecture sans profil. Les sources et évaluations de Claude sont conservées.

`createManagerPlan` accepte `availableToolsByRoute` fourni par l'opérateur après
vérification native. Les seuls ajouts permis sont les outils du tableau, pour le
rôle indiqué. Finance ne reçoit jamais veille-investissements ; main n'acquiert
aucun accès à la mémoire ou aux briefs. Les plugins doivent être déjà configurés.
L'option omise conserve le comportement antérieur pour les outils indisponibles.

Validation : 14/14 tests du runtime managers. Les deux régressions échouaient
avant correction : instructions sans outil exploitable et omission silencieuse
d'un skill demandé. Tests synthétiques, aucun profil réel ni appel modèle.
Activation effectuée : quatre paquets dans les espaces Business, Finance, System et
Knowledge actuels, 5756 caractères au total. La configuration native valide et le
redémarrage contrôlé sont passés. `node scripts/verify-openclaw-read-skills.mjs
--installed` confirme les quatre skills éligibles et leurs outils ; main est refusé
pour la mémoire. Zéro appel modèle et zéro message pour cette vérification.
Le CLI natif résout les SecretRefs ; le RPC tools.invoke exige `name`, et retourne
`output`. Ne pas fabriquer un bearer depuis l'objet de référence de configuration.
Preuves privées dans ~/.ivan-ai-os/activation-read-skills-7b4b7c4/.
La source est en PR #47 ; source Mac #45/#46 reste séparée, sans fusion automatique.

Le service Jev Mac a déjà été basculé sur mac-resilience-cc1d2a5 (PR #46) :
9 tests Mac, CI 11/11, reprise Trousseau et restart natif, compteur inchangé.
Le délai launchd de 60 s exige un timeout kickstart d'au moins 75 s.

Essais managers réels sans livraison Telegram : Finance termine en 13,5 s,
avec finance-engine chargé et ivan_finance_brief appelé. System termine en
10,1 s, avec memoire-obsidian chargé et recherche/lecture mémoire appelées
(ivan_route apparaît aussi dans son résumé). Deux sessions distinctes ; réponses
conservées uniquement en preuve privée. La CI #47 passe ses 10 jobs.
Descriptions des skills dans ces prompts : Finance 2055 caractères, System 3344.
Cela mesure le contexte skills, pas l'intégralité des tokens du workflow.
