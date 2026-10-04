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
Activation des paquets privés et vérification native consignées dans le relais.

Le service Jev Mac a déjà été basculé sur mac-resilience-cc1d2a5 (PR #46) :
9 tests Mac, CI 11/11, reprise Trousseau et restart natif, compteur inchangé.
Le délai launchd de 60 s exige un timeout kickstart d'au moins 75 s.
