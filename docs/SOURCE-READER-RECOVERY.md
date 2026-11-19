# Reprise des lectures publiques

Le budget reste de huit lectures par collecte, partagé entre catégories actives.
La file mémorise les échecs par identifiant de source : code, nombre de tentatives,
horodatage, prochain essai et empreinte du lecteur Python/de sa validation JS.
Elle ne conserve ni exception brute ni contenu de page dans cet état de reprise.

- Taille, date non vérifiable/invalide, contenu inexploitable, redirection, entrée
  ou preuve invalide : aucun nouvel essai avec le même lecteur.
- Panne réseau, délai et autre erreur inconnue : nouvel essai après trente minutes,
  puis deux heures ; trois tentatives au maximum avec la même version du lecteur.
- Une modification du lecteur ou de sa validation autorise un nouveau passage
  borné. Un changement de documentation ou du hook ne réinitialise pas ces compteurs.
- Une lecture valide efface son état d'échec ; une source déjà lue ou terminale
  n'est jamais rouverte par cette politique. La sélection et l'envoi restent séparés.

Le filtre de reprise s'applique avant la limite des cent candidats de l'arriéré :
cent pages bloquées ne peuvent pas masquer la page lisible suivante. Les réservations
Business/Finance/System/Engineering s'appliquent ensuite aux sources éligibles.
Les erreurs persistées restent visibles via CHECK_SOURCE_READS, même lorsqu'une
collecte ultérieure réussit. WAIT_DIGEST et les autres diagnostics restent affichés.

Migration additive : source_read_failures est créée dans SQLite à la première
ouverture. Les lignes alerts, les reçus, archives, créneaux et décisions ne sont
pas réécrits. Une ancienne release peut encore lire la base ; elle ignore toutefois
les délais nouveaux. Sauvegarder la file avant activation comme pour toute release.

Preuves de régression : scripts/ingest-alert-fairness.test.mjs (échecs initiaux
reproduits, redémarrage, délais, nouvelle version et cent pages bloquées) et
scripts/inspect-mac-pilot.test.mjs (visibilité persistante sans masquer le digest).
Cette correction ne qualifie pas à elle seule l'utilité éditoriale quotidienne.

## Taille et variantes d'URL — revue #66

Next.js : plafond de téléchargement 600 000 octets, contre 400 000 pour les
autres hôtes. Le texte de l'article extrait par read_article est limité séparément
à 100 000 caractères ; l'extrait transmis reste limité à 1 200 caractères avec
couverture déclarée. Ni scripts ni navigation ne deviennent des preuves. Python
et validation du reçu JS appliquent le même plafond propre à l'hôte.
Mesure réelle : Next.js 16.4, 498 948 octets HTML et 17 652 caractères de texte
extrait par notre lecteur, date de page concordant avec celle du flux.

Mistral : les chemins /news/<slug>, /news/<slug>/ et /news/<slug>// ont une
identité canonique à un seul slash final. Les anciennes variantes encore non lues
sont classées DUPLICATE_SOURCE_URL seulement si la source canonique active a déjà
été lue. Leur identité d'origine et le lien duplicateOf sont conservés ; les sources
lues, les envois tentés, les archives et les sujets différés ne sont pas réécrits.
Les chemins d'autres sites ne sont pas simplifiés arbitrairement.

Simon /le-chonk/ reste non lu : son suffixe de date est identifié, mais son apport
doit être relié à l'annonce Mistral avant d'étendre ce lecteur. Il n'est pas
automatiquement classé comme inutile et aucune relation d'événement n'est inventée.
