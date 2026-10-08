# Claude : qualification Business et sources réellement manquantes

Travaille dans ~/Ivan-AI-Os-claude. Vérifie pwd, uname -s, git status --short --branch,
puis fetch sans écraser aucun fichier. Isole une branche
agent/claude/qualification-business-runtime depuis origin/agent/codex/alerts-integration.
Aucun stash/reset/clean. Relis le cadre et SESSION_HANDOFF, puis ce document.

#62 est reprise ; le raccord Business et le diagnostic sont livrés côté Codex.
Ne refais ni les 188 appels, ni les benchmarks Jev, ni B01 déjà tenté. Le mode E et
les seuils .75 restent inchangés. Le dernier reçu de qualification est indiqué
dans SESSION_HANDOFF ; lis-le en privé, sans recopier de configuration ou jeton.

1. Relis la dernière fiche native Business contre son extrait : précision des faits,
acheteur bien hypothétique, utilité, objections, faisabilité du test et absence
de répétition. Sépare un refus mécanique, une qualité éditoriale insuffisante et
une vraie livraison. Ne génère rien de nouveau et ne renvoie rien sur Telegram.
Teste le vérificateur avec au plus deux contre-exemples nouveaux réellement utiles.

2. Prépare le prochain petit lot de lecteurs : la file live contient 16 pages non
lues. En priorité, lis les sources officielles Cloudflare « Web Search API » du
2 octobre, Mistral « mistral-large-4 » (annonce et documentation), puis les deux
README GitHub RemoveMacAI et Niko1221/Strata si le contenu paraît pertinent pour
les priorités System/Engineering. Donne URL canonique, titre, date réelle dans
la page, passage substantiel, limite et utilité ou raison d'exclusion. Pas de
résumé sur titre seul ; pas de téléchargement/exécution du code de ces projets.
Repère le doublon annonce/documentation Mistral. Code des lecteurs réservé à Codex.
La liste exhaustive peut être obtenue par lecture SQLite seule ; ne touche pas
aux états, aux sources refusées, aux reçus ni aux envois déjà tentés.

3. Les refus Finance live concernent « Interview with Ansa » BCE (6 octobre) et
« Taux US à 10 ans » FRED (observation 2 octobre). Lis uniquement les preuves
publiques et la règle de validation ; propose deux traductions françaises fidèles
avec citation exacte, puis vérifie renderBrief sans modèle. Si aucun défaut codé
ne se reproduit, dis-le : n'invente pas la cause d'un ancien refus sans son draft.

Livrables : docs/REVIEW-CLAUDE-BUSINESS-RUNTIME-2026-10-06.md, petites fixtures/tests
dans ton périmètre skills/, proposition de lecteurs en documentation. Commit/push,
PR brouillon vers la branche Codex. Aucun changement live, fusion, appel payant,
seuil, destinataire, AGENTS ou constitution. Codex intègre et active son périmètre.

Career reste en pause, OVH reporté, Knowledge/Anakalypto dernière étape commune.
But du lot : corriger les obstacles réels à des messages utiles, pas multiplier
les relectures générales ou les campagnes de mesure déjà faites.
