# Relecture Claude — corrections éditoriales v6 (`bf2d2e1`, branche @`d1893b6`)

Runtime actif d'après le diagnostic en lecture seule du 2026-10-06 : `bf2d2e1`, contexte v6,
mode E. File : 3 livrés (les seuls de tout le pilote : reçus 59 et 60), 17 en revue,
0 synthèse v6 depuis l'activation.
Suite runtime à ce SHA : `node --test services/alerts-runtime/test/*.test.js` → 126/126.
Preuve reproductible, sans réseau : `node skills/rapport-telegram/scripts/sonde-v6.mjs`.

Contrôles mécaniques et qualité éditoriale restent distincts : ce qui suit porte sur les
contrôles. Aucun message v6 réel n'existe encore pour juger la qualité.

## Conforme
- **Contexte v6** : les deux faits fautifs sont remplacés par le texte proposé (Next.js =
  nouveaux projets, inventaire inconnu ; plafond dur = TypeSafe seulement).
- **Phases d'erreur** : `COMPLETE`, `PARSE` et `VALIDATE` sont propagées. Une erreur de
  contenu (`*_INVALID`) n'est pas rejouée ; seules les pannes transitoires le sont, une fois
  (`retryTransient`).
- **Masquage côté Jev seulement** : l'extrait et les citations d'origine sont conservés pour la
  prose et l'audit, comme demandé.
- **Lecteur Hugging Face** : en-tête exclu structurellement (tests Python).
- **Rumeurs courtes** : nuance de Codex acceptée. La longueur seule ne suffit pas ; une
  observation officielle courte, venant d'un hôte officiel, reste utilisable.

## Contestations (sonde)

1. **Faux rejet des identifiants à trait d'union — majeur pour la veille IA.**
   Un fait « GPT-6 Luna coûte moitié moins cher » est refusé (`ALERT_FACT_UNSUPPORTED`) alors
   que sa citation contient « GPT-6 Luna » ; idem pour « GLM-5.3 ». `factIdentifiers` capture
   `GPT`, puis `hasFactIdentifier` refuse un `-` après le sigle. Comme
   `ALERT_FACT_UNSUPPORTED` n'est jamais rejoué, l'article utile est perdu définitivement.
   Proposition : capturer l'identifiant entier, puis le chercher tel quel.
   ```js
   const factIdentifiers=v=>v.match(/\b(?:CVE-\d{4}-\d+|GHSA-[a-z\d]{4}(?:-[a-z\d]{4}){2}|v\d+(?:\.\d+){1,3}(?:-[a-z\d.-]+)?|[A-Z][A-Z\d]{2,}(?:-[A-Za-z\d]+(?:\.\d+)*)?)\b/g)??[];
   ```
   Tests à ajouter : `GPT-6`, `GLM-5.3`, `HTTP/2` acceptés quand ils sont présents dans la
   citation ; `SSRF` absent toujours refusé.
2. **Sigles traduits refusés — moyen (Finance).** « IPCH » dans le fait, « HICP » dans la
   citation BCE : refus. L'alias ne couvre que BCE/ECB. Proposition, liste fermée :
   `{BCE:['ECB'], IPCH:['HICP'], PIB:['GDP'], FMI:['IMF'], UE:['EU']}`.
3. **Masquage incomplet — moyen.** `redactPublicContacts` masque les adresses, mais pas les
   numéros de téléphone que refuse aussi `CONTACT` dans le gateway. Le texte masqué est encore
   rejeté (`isPublicClassificationText` → `false`), ce qui reproduit l'erreur A10 dès qu'une
   page publie un numéro. Proposition : masquer avec **le même motif `CONTACT` exporté par
   le gateway**, plutôt qu'un second motif, avec ce test : projection masquée ⇒
   `isPublicClassificationText(projection,1200) === true`.
4. **Rumeurs non tenues — mineur.** « Codex is down… » et « Claude errors with at capacity,
   anyone else? » passent à Jev. Le motif ne couvre que `GitHub|OpenAI|service|server|API`
   devant `down`. Proposition : `\b[A-Z][\w.]*\s+(?:is\s+)?(?:down|at capacity|unavailable)\b`
   combiné à une question ou à « anyone else », hors hôtes officiels.

## Effet attendu
Les corrections 1 et 3 évitent des pertes silencieuses d'articles utiles (refus définitif) et
des erreurs de sélection ; 2 et 4 améliorent Finance et le bruit. Aucune ne touche à la
politique Jev ni au mode E.
