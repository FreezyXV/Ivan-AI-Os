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

## Usage vérifié

Le worker démarre avec la session Mac et traite la file toutes les cinq minutes.
Le digest ordinaire reste à 19:30 Paris. Rien de retenu signifie aucun message.
Le premier digest de qualification a été déclenché manuellement : Next.js 16.4,
reçu 62, après génération automatique et relecture. Le second passage n'a rien
renvoyé. Les deux contre-exemples de contexte inventé/hors périmètre sont refusés.

Diagnostic en lecture seule depuis le dépôt :

```sh
/Users/yoanpetrov/.openclaw/tools/node-v24.19.0/bin/node scripts/inspect-mac-pilot.mjs
```

Le diagnostic liste toutes les actions : une page non lue n'arrête pas les autres.
La file peut encore contenir les abstentions Jev en cours de migration ; elles ne
doivent pas être forcées à keep. Les refus factuels restent à examiner séparément.

Pour évaluer l'utilité, donner le numéro du message et utile/inutile/trop vague,
avec ce qui manquait. Cette appréciation n'est pas encore enregistrée automatiquement
par un outil Telegram ; la seconde lecture ne remplace pas cette mesure produit.

Un retour de version conserve la file actuelle. Après la livraison 62, préférer
le snapshot VERIFIED state-backup-after-native-delivery ; restaurer aveuglément
le snapshot antérieur ferait perdre ce reçu et pourrait permettre un doublon.
Les messages reçus après n'importe quel snapshot doivent être rapprochés avant
une restauration d'état. La reprise après une vraie nuit Mac reste à mesurer.
