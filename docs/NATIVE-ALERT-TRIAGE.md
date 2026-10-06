# Tri des alertes sans Jev — décision d'Ivan, 7 octobre 2026

Jev n'est plus un préalable à la pertinence éditoriale. Le tri natif utilise le
contexte public v6 ; les usages distincts de Jev ne sont pas qualifiés par ce lot.
La constitution et les frontières d'autorisation restent inchangées.

Parcours : source réellement lue → filtres locaux → jugement/rédaction isolés
→ contrôles de preuves → seconde lecture indépendante → digest avec reçu.
La seconde lecture examine la fidélité de chaque fait, le lien concret avec une
priorité active, l'utilité et l'action. Elle ne voit ni conversation ni profil privé.
Elle reçoit la source et la proposition, et renvoie seulement une décision et des
codes. Son reçu est lié au contenu exact, au contexte et à la version de contrôle.
Ce contrôle supplémentaire réduit les erreurs ; deux modèles ne constituent pas
une garantie de vérité et la qualification quotidienne reste nécessaire.

- Mode : native-editorial, verifyNativeBrief=true. Aucun appel Jev dans cette chaîne.
- Créneau durable de cinq minutes ; un même créneau ne se rejoue pas.
- Quatre complétions au plus par passage, rédacteur et relecteur compris ; pas
  de deuxième rédaction automatique après un refus de contenu. Le coût natif
  reste non exposé par le SDK : ne pas le présenter comme gratuit.
- Une indisponibilité peut être réessayée une seule fois après délai. Un refus,
  un JSON invalide ou une preuve incorrecte ne déclenche pas une boucle payante.
- Les abstentions Jev encore fraîches sont soumises à un nouveau jugement,
  deux au plus par passage, une seule fois pour le contexte. Leur décision
  d'origine reste dans evidence_revisions ; aucune décision native ni livraison
  déjà tentée n'est réouverte.
- Les rumeurs courtes non attribuées et annonces Next.js de correctifs à venir
  sont retenues pour revue par code, sans modèle. Un correctif annoncé comme
  désormais disponible peut suivre le parcours normal.
- Le digest reste le mode de livraison ; aucun avis du modèle ne crée une urgence.

Contrôle ciblé avant bascule, historique et isolé : A02 et A04 deviennent des
messages mécaniquement valides ; A10 est une annonce future, A18 une allégation
sans preuve suffisante ; A20 est arrêté par validation. Trois appels natifs,
aucun Jev ni envoi. A18 reste review plutôt que le skip attendu, et A20 révèle
une tentative de sélection hors périmètre : ce résultat motive la seconde lecture.
Ce n'est ni un benchmark indépendant neuf ni une qualification de production.

Tests : verification.test.js (liaison exacte, décisions contradictoires, refus,
panne contre contenu invalide, plafond des deux étapes) et native-pipeline.test.js
(migration unique, créneaux, rumeurs et annonces futures). Activation et preuves
réelles seront consignées dans SESSION_HANDOFF et CURRENT-RUNTIME-INVENTORY.
