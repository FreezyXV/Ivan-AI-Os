# Fiches Business raccordées au pilote Mac

Claude #62 repris avec provenance (48a4611 et 8a958a0). Aucun seuil Jev changé.
Le mode E conserve les abstentions ; aucun nouvel agent ou modèle supplémentaire.

Après sélection, le même appel natif évalue et rédige une fiche si l'objectif est
Business : problème, acheteur hypothétique, preuves, objections, hypothèse, test
local gratuit et réversible, statut et limites. Les citations sont liées par code
aux passages numérotés ; URL/date/nombre de sources sont fournis par le code.
Le problème reprend les faits déjà vérifiés : pas de deuxième affirmation libre.

Le vérificateur Claude et une borne runtime contrôlent chaque fiche. Un score
déclaré ne suffit pas : les entrées publiques explicites sont recalculées par
signals.mjs#scoreOpportunity. Un profil privé n'est pas une entrée de ce pilote.
Sans critères documentés, la fiche reste exploratoire ; le modèle est instruit
de ne créer ni score ni recommandation. Aucun test proposé n'est exécuté.

La transaction SQLite qui rend la synthèse prête conserve également la fiche et
le score éventuel dans business_fiches. Pas de double écriture fichier/base ni de
second appel. L'identité source et les reçus du digest empêchent les doublons.
Le catalogue Business survit aux redémarrages et à une archive source manquante.
businessCycle et le diagnostic exposent les comptes réels, au lieu d'un score
toujours déclaré nul. L'historique reçu n'est ni reclassé ni renvoyé.

Le diagnostic expose toutes les actions actives dans alerts.diagnoses ; le premier
code reste compatible avec les anciens clients. Une synthèse prête reste visible
même lorsqu'une autre source a été refusée. Le reçu incertain reste prioritaire.

Preuve avant correctif : le test Business acceptait un champ non validé mais sans
nombre de sources lié ; le test diagnostic ne trouvait aucune liste de codes.
Après correctif : 319 tests Node ciblés, dont les parcours fiche → SQLite → digest,
reprise sans second envoi, archive manquante, refus citation/score/paiement/profil.
Cette preuve avec doubles de modèle/Telegram ne mesure pas la qualité rédactionnelle.
Une évaluation native isolée, explicitement historique, peut vérifier le nouveau
format sans être présentée comme une alerte fraîche ou un résultat de sélection Jev.
