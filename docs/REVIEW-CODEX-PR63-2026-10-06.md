# Revue et intégration de #63

Claude 84d92d7 repris avec provenance en 1425e86, sur la branche Codex ;
aucune fusion foundation/main. Revue du diff, fixture B03 et sonde Finance.

## Décisions

- Accord sur B03 : fidélité mécanique acquise, utilité Business insuffisante.
  Le reçu historique 61 demeure une preuve de livraison, pas de qualité ou de
  découverte d'un marché. Aucun nouvel appel ni renvoi de cette fixture.
- Accord sur les deux avertissements de qualiteFiche : ajoutés aux métadonnées
  durables de la synthèse comme businessEditorialWarnings, conservés après reprise.
  Le prompt demande un acheteur et un besoin, puis d'autres témoignages publics
  distincts avant un prototype ; utilité centrée sur le marché, pas l'usage d'Ivan.
  Ils restent non bloquants parce que ce sont des heuristiques lexicales non
  qualifiées. Des tests qui échouent seraient à eux seuls un motif insuffisant
  pour refuser une meilleure règle : ils pourraient refléter une mauvaise fixture.
- Cloudflare et annonce Mistral effectivement lus par les nouveaux adaptateurs.
  Date primaire conservée ; Cloudflare du 2 octobre devient SOURCE_STALE, sans Jev.
  Mistral du 6 reste SELECTION_UNCERTAIN : réponse skip 0,28, P(skip)=0,52,
  P(keep)=0,20. La proposition keep de Claude n'est pas substituée au reçu.
  Aucun nouveau seuil ni recours natif sur abstention.
- Documentation Mistral : pas de fusion automatique des nombres contradictoires.
  Annonce et documentation partagent un événement mais pas nécessairement les mêmes
  faits. La documentation reste non lue par le runtime ; aucun second message.
- Désaccord sur la date README proposée : création/push du dépôt ne date pas le
  contenu lu. Une future lecture doit épingler le blob à un commit et distinguer
  date de capture, date de commit et date de publication inconnue. Ne pas promouvoir
  une actualité sur la date de création du dépôt.
- Finance : les traductions fidèles sont acceptées sans assouplir le vérificateur.
  L'hôte éditeur seul ne prouve pas que la BCE, plutôt qu'un journaliste/intervenant,
  affirme chaque phrase. Le prompt préfère « l'entretien indique » quand l'identité
  n'est pas dans la citation, et interdit la conversion en points de base. L'angle
  mort des noms propres reste une limite, sans reconstruction des anciens drafts.

Preuve exécutée : node skills/rapport-telegram/scripts/sonde-finance-v6.mjs :
traduction FRED ACCEPTÉ ; deux traductions Ansa ACCEPTÉ ; attribution BCE hors
citation REFUSÉ ; nom Lane absent ACCEPTÉ. Aucun modèle ni réseau.

## Causes racines supplémentaires corrigées

Un candidat quittant son RSS restait non lu pour toujours, même avec son nouvel
adaptateur. Test en échec, puis correction : la file reprend cent candidats au plus,
dans le budget commun de huit lectures et les mêmes exclusions. Aucun envoi tenté
ni refus éditorial n'est rouvert. Reprise réelle : Mistral et Cloudflare récupérés.

Les erreurs de lecteur ont désormais leurs codes dans le diagnostic, séparés des
erreurs de flux. Les nouveaux refus factuels gardent le champ et le contrôle exact,
sans brouillon : citation, chiffre, identifiant, utilité/action.

241 tests Node concernés, 22 Python ; sauvegarde/restauration réelle sur copie avec
trois reçus préservés, aucun travail réouvert ni message. Veille longue et qualité
quotidienne restent à mesurer. Pas de nouvelle synthèse fraîche dans ce lot.
