# Revue Codex #62

48a4611 et 8a958a0 repris avec provenance sur la branche Codex, sans fusion
foundation/main ni modification du worktree Claude. Les quatre contre-exemples
Business sont désormais refusés ; score arbitraire et JSON incomplet couverts.
Accord sur le maintien du mode E : aucun nouveau seuil ou recours activé.
M03 : l'étiquetage faible est documenté, le label figé n'est pas retouché.
Pas d'activation du digest hebdomadaire optionnel « à regarder ».

Diagnostic : reproduction avant correctif de l'absence d'une liste de codes ;
alerts.diagnoses conserve maintenant tous les codes simultanés. Le premier code
reste compatible. Les synthèses prêtes ne sont pas cachées par un refus.

Business : raccord natif dans le même appel, validation du contrat Claude, champs
factuels dérivés et catalogue transactionnel SQLite, puis digest commun. Reprise
testée sans second envoi ; catalogue lisible même sans archive source.
Le moteur recalcule les entrées explicites ; aucune recommandation inventée sans
critères publics. La génération automatique reste exploratoire.

Défaut d'intégration découvert et corrigé : import de CLI à top-level await dans
une factory chargée avec require par OpenClaw. Test rouge ERR_REQUIRE_ASYNC_MODULE,
puis vert ; import différé dans execute. Sonde réelle d'outil ajoutée au contrôle
de bascule et au diagnostic : la santé générale du gateway ne suffit plus.
323 tests ciblés au correctif du chargeur ; 148 tests concernés après ajustement
du format et des motifs de validation. Les CI et reçus privés fixent la version active.

La validation mécanique ne prouve pas l'utilité ni la fidélité éditoriale. Un essai
natif historique refusé n'est pas une livraison ; le refus reste explicite.
Suite Claude : CLAUDE-NEXT-PR62-2026-10-06.md, sans nouveau benchmark Jev.
