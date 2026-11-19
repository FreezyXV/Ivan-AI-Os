# Benchmark d'architecture — où mettre code, Jev, LLM et humain (Claude, 2026-10-05, révisé)

**Code examiné** : `agent/codex/alerts-integration` @`752bded` (fusionné dans cette branche).
**Runtime actif** (relais Codex, non relu par Claude) : worker `9f7f653`, gateway/plugin `1c769a3`,
**mode conservateur E** = Jev v5 avec la règle 0,75, puis jugement et rédaction natifs, en digest
seulement. Trois messages réellement livrés : reçu 59 (Simon Willison, ThinkingBox) et reçu 60
(Next.js). Aucun appel payant et aucune nouvelle passe pour cette révision.

## 0. Correction de la version précédente (6c6e36a)

J'affirmais que la politique v5 « P(keep) ≥ 0,10 / P(skip) ≥ 0,20 » retenait 25 cas de bruit.
**C'était faux.** Mon calcul hors ligne donnait la priorité à keep quand les deux seuils étaient
atteints, alors que `selectionOutcome` (runtime @752bded) rend **review** dans ce cas. Recalculé avec
la fonction du runtime sur dev (83 cas) : **10/14 utiles, 0 bruit, 58/83 exacts**, ce qui confirme
la revue de Codex. La recommandation « ne pas activer cette politique » est retirée ; Codex la
garde de toute façon en réserve (1 faux keep sur le benchmark).

## 1. Mesures sur dev (calibration-jev-v1, labels figés, `selectionOutcome` du runtime)

| Politique | Utiles | Bruit | Écartés | Exact |
|---|---|---|---|---|
| Règles seules (A) | 8/14 | 9 | 6 | 64/83 |
| Jev v3, 0,20/0,25 | 2/14 | 0–1 | 0 | ≈ 34/83 |
| Jev v5, 0,75 | 6/14 | 0 | 0 | 46/83 |
| Jev v5, P(keep) ≥ 0,10 / P(skip) ≥ 0,20 | **10/14** | **0** | 0 | **58/83** |

## 2. Passe unique sur le benchmark neuf (26 cas, labels figés, par Codex @a604aa6)

Rescorée par Claude avec le scoreur strict (couverture complète vérifiée) :

| Mode | Utiles /5 | Bruit retenu | Utiles écartés | Abstention | Exact /26 | Erreurs |
|---|---|---|---|---|---|---|
| A. Règles | 3 | 2 | 2 | 8 % | 19 | 0 |
| B. Jev v5, 0,75 | **4** | **0** | 0 | 54 % | 19 | 1 Jev |
| C. Natif juge et rédacteur | 4 | 3 | 0 | 27 % | 19 | 5 natives |
| D. Jev skip, puis natif | 4 | 3 | 0 | 27 % | 19 | 5 natives |
| E. Jev keep, puis natif (**actif**) | 3 | **0** | 0 | 58 % | 18 | 1 + 1 |

Temps : Jev 402 ms en médiane, 645 ms au p95 ; natif 9349 ms en médiane, 17 464 ms au p95.
Coût Jev de la passe : 0,00125 € estimé par le gateway ; coût natif non exposé.
Urgence : 0/1 dans tous les modes (aucun inventaire n'est branché), ce qui est attendu.
Les dates de collecte sont rejouées : ce benchmark ne prouve **pas** la fraîcheur d'une veille
quotidienne réelle.

### Cas à expliquer
- **A02** (attaque d'agents contre Hugging Face, label keep) : Jev v5 répond review à 0,12
  (P(keep) = 0,28). Le natif le retient avec un brief juste. C'est un vrai utile manqué par B et
  E : Jev sous-estime les incidents de sécurité d'agents qui ne nomment pas un composant du
  pilote.
- **A03** (AGENTS.md 100 % contre skills 79 %, label keep) : Jev keep à 0,91, mais **erreur
  native** (`ALERT_ASSESSMENT_UNAVAILABLE` après 18 s, avant le délai de 60 s). C'est la seule
  raison de l'écart entre E (3/5) et B (4/5). 5 erreurs natives sur 22 (23 %), toutes entre
  7 et 18 s : l'étape en échec n'est pas enregistrée dans la passe, donc la cause est inconnue.
- **A07** (moratoire sur les descriptions de PR générées, label review) : le natif retient, avec un
  brief fidèle et une action testable. **Désaccord de label défendable**, pas du bruit inutile ;
  le label figé reste review.
- **A10** (annonce « correctifs plus tard aujourd'hui », label review) : Jev en erreur, parce que
  l'extrait contient l'adresse de contact publique `security@…` et que le gateway refuse tout texte
  avec une adresse. Le natif retient. C'est du **bruit réel** : l'annonce est remplacée par la
  publication effective (A01), dont elle est un doublon sémantique non détecté.
- **A18** (« GitHub down again? », 67 caractères, label skip) : le natif retient sur une seule
  phrase non vérifiée. **Bruit réel** : il manque une preuve minimale.
- **A24** (synthétique, faille OpenClaw exploitée, label keep immédiat) : retenu en digest, avec
  une action conditionnelle correcte. L'immédiat dépend d'un inventaire local (version installée,
  exposition réseau) qui n'existe pas : rester en digest est le bon comportement en attendant.

## 3. Qualité des sorties keep (fidélité / utilité / action / lisibilité, 0–2)

| Sortie | F | U | A | L | Constat précis |
|---|---|---|---|---|---|
| A01 Next.js août | 1 | 1 | 2 | 2 | F1 ajoute « désactivent l'optimisation AVIF », présent dans l'extrait mais **pas dans sa citation** ; utilité « les projets d'Ivan utilisent Next.js » (non établi) |
| A02 Attaque Hugging Face | 2 | 2 | 2 | 2 | action conditionnelle et proportionnée |
| A04 Next.js 16.3 IA | 2 | 2 | 2 | 1 | trois faits denses ; conditionnel correct (« si un projet passe à 16.3 ») |
| A07 Varda (désaccord) | 2 | 2 | 2 | 2 | utile pour l'usine logicielle ; label review maintenu |
| A10 Annonce Next.js | 2 | 1 | 2 | 2 | fidèle mais redondant avec A01 ; « utilisent par défaut » |
| A18 GitHub en panne | 2 | 0 | 1 | 2 | rumeur d'une ligne promue en alerte |
| A24 OpenClaw (synth.) | 2 | 1 | 2 | 2 | « si OpenClaw est utilisé » alors qu'il est au cœur du pilote : l'inventaire doit trancher |
| **Reçu 59 — plafonds budget** | 2 | **0** | **1** | 1 | voir ci-dessous |
| **Reçu 59 — ThinkingBox** | 2 | 2 | 1 | 1 | F0 et F1 répètent « état final et effets de bord » ; « vingt fois » reste un fait, pas une exigence (bien) ; action « flux envisagés » un peu vague |
| **Reçu 60 — Next.js septembre** | **1** | 1 | 2 | 1 | F0 affirme « dont une SSRF haute sévérité » alors que sa citation ne parle que des versions ; F0 et F1 se recouvrent ; « les projets d'Ivan utilisent Next.js » |

Reçu 59, plafonds budget, détail :
- F0 est une généralité sans valeur (« des API payantes peuvent générer des coûts »).
- L'utilité « le plafond mensuel partagé de Jev peut être protégé… » se trompe de cible : Jev
  (TypeSafe) est **déjà** plafonné en dur par le gateway, et ce plafond ne couvre rien d'autre.
- L'action « services payants utilisés par Jev » est mal cadrée, puisque Jev n'utilise que TypeSafe.

Version attendue, sans inventer de configuration :
- *Utilité* : « Le pilote a un seul plafond dur connu : Jev/TypeSafe dans le gateway. Les autres
  postes payants (complétions natives, abonnements Claude/Codex, API externes éventuelles) n'ont
  pas de plafond imposé par Ivan AI OS ; leurs limites dépendent des offres des fournisseurs. »
- *Action* : « Lister une fois chaque service payant du pilote avec son type de limite (dure,
  alerte, aucune) ; ne rien activer sans ton GO. »

Moyennes : fidélité 1,8 · utilité 1,2 · action 1,7 · lisibilité 1,6. La fidélité est bonne mais
a deux fuites hors citation ; l'utilité reste l'axe faible.

## 4. Causes et corrections

| Défaut observé | Cause | Correction (périmètre) |
|---|---|---|
| « Les projets d'Ivan utilisent Next.js » (A01, A10, reçu 60) | fait de contexte v5 : « Les projets web utilisent par défaut Next.js » | **Codex, `context.js`** : « Les nouveaux projets web partent par défaut sur Next.js/TypeScript ; l'inventaire des projets existants et de leurs versions n'est pas connu du système. » |
| Utilité budget centrée sur Jev (reçu 59) | fait v5 : « Les services payants sont mesurés ; Jev partage un plafond mensuel » (seul Jev est mesuré) | **Codex, `context.js`** : « Jev (TypeSafe) a un plafond dur mensuel appliqué par le gateway. Les complétions natives et les autres services payants ne sont ni plafonnés ni mesurés par Ivan AI OS. » |
| Affirmation hors de sa citation (A01 F1, reçu 60 F0) | le contrôle des nombres n'inspecte pas les identifiants | **Codex, `pipeline.js renderBrief`** : refuser un fait dont un sigle ou identifiant (≥ 3 majuscules, `CVE-…`, `GHSA-…`, `v1.2.3`) est absent de sa citation (« SSRF » et « AVIF » auraient été refusés) ; **Claude** : règle ajoutée au contrat et au skill |
| Faits répétés ou génériques (reçu 59 ×2, reçu 60) | prompt | **Claude** : contrat § 3 et skill ; **Codex** : reprendre la règle dans `synthesisPrompt` |
| Rumeur d'une ligne promue (A18) | pas de seuil de preuve | **Codex** : extrait de moins de 200 caractères avec une seule affirmation non attribuée → review sans appel natif |
| Annonce remplacée par la publication (A10/A01) | pas de dédoublonnage sémantique | **Claude** : critère au contrat (une annonce « publiera plus tard » sans correctif = review) |
| Erreur Jev sur adresse publique (A10) | le gateway refuse tout texte contenant une adresse | **Codex** : remplacer côté client, **avant** l'appel Jev et pour les seules sources publiques lues, les adresses de contact par `[adresse de contact publique]` ; le refus du gateway reste en place pour tout le reste ; aucune donnée privée ajoutée |
| 23 % d'erreurs natives sans étape connue | journal de passe incomplet | **Codex** : enregistrer l'étape (`COMPLETE`, `PARSE`, `VALIDATE`) et le code d'erreur de validation (déjà annoncé dans sa revue) |
| Chrome de page dans la citation (ThinkingBox « Back to Articles … ») | lecteur Hugging Face | **Codex** : nettoyer l'en-tête dans `read-public-alert.py` |

## 5. Recommandation par tâche (révisée)

| Tâche | Recommandé | Preuve |
|---|---|---|
| Exclusions (différé, non lu, ancien, injection, doublon exact) | **Code** | déterministe, 0 coût |
| Routage | **Code (table active)** | table 19/19 contre Jev 17/19 ; aucun appel `/v1/route` présenté comme mesure Jev |
| Retenir pour le digest | **Jev v5, 0,75** (B/E) | 4/5 puis 3/5, 0 bruit ; natif seul (C/D) : 3 bruits |
| Rédiger | **Natif**, seulement après Jev keep (E) | évite 3 bruits ; ≈ 9 s par synthèse |
| Juger l'utilité par le natif seul | **Non recommandé** | C/D : A07 défendable, mais A10 et A18 sont du bruit réel |
| Urgence immédiate | **Code + inventaire**, jamais un modèle | A24 |
| Vérifier la synthèse | **Code** (citations, nombres, **identifiants**) + **humain** par échantillon | A01, reçu 60 |
| Business, Finance (`signal.pertinent`, `alerte.importante`) | **Non qualifiés** | jamais mesurés sur un jeu figé |
| Reprise, reçus, dédoublonnage | **Code** | tests existants |
| Agir, dépenser, publier | **Humain** | constitution |

## 6. Jev qualifié, non qualifié, inutile

| Usage | Statut |
|---|---|
| Sélection de veille, question `alerts.pertinence.mac-v3`, contexte v5, règle 0,75 | **Qualifié (rappel limité)** : 4/5 et 6/14 utiles, 0 bruit mesuré ; manque des incidents de sécurité génériques (A02) |
| Même question avec P(keep) ≥ 0,10 / P(skip) ≥ 0,20 | **Réserve** : 10/14 et 0 bruit sur dev, mais 1 faux keep sur le benchmark |
| Routage, `signal.pertinent`, `preuve.suffisante`, `alerte.importante`, `source.fiable`, `sujet.*`, `publication.prete` | **Non qualifiés** |
| Urgence, autorisation, reprise, dédoublonnage | **Inutile** (code) |

## 7. Ce qui n'est pas prouvé
Fraîcheur en veille réelle ; comportement pendant le sommeil du Mac ; coût des complétions
natives ; utilité perçue par Ivan des trois messages livrés (à lui demander) ; un seul annotateur
pour tous les labels (proposer à Ivan d'étiqueter 10 cas).
