---
name: job-application-optimizer
description: Analyse complète d'une offre d'emploi pour Ivan, positionné Business Analyst Métier (BA fonctionnel, AMOA, consultant fonctionnel, PO fonctionnel) à Paris et au Luxembourg - score de fit, écarts, CV ciblé, lettre, réponses aux questions. Utiliser dès qu'Ivan colle une offre, un lien d'annonce, demande "est-ce que je postule", "adapte mon CV", "lettre de motivation", ou transfère une offre de la Secrétaire.
metadata:
  version: "1.1.0"
  famille: career
  manager: career
  risque: brouillon
  profil: "oui"
  statut: actif
  provenance: "skill claude.ai d'Ivan job-application-optimizer v1, profil externalisé Ivan-AI-Os 2026-09-29"
---
# Job application optimizer — Business Analyst Métier

## Profil
Lire `profil.md` (profil privé : à côté de ce fichier une fois empaqueté, sinon `~/.ivan-ai-os/profil.md`) : positionnement, compétences cibles,
expériences à mobiliser, langues. Absent → demander à Ivan ; ne rien supposer. N'utiliser un atout
que s'il est pertinent pour l'offre.

## Tri en volume
Plusieurs offres d'un coup (ex. transfert de la Secrétaire) : pré-trier par Jev (skill
`jev-decision`, question `noul` « l'offre vise-t-elle un poste BA métier compatible ? ») sur les
seules métadonnées de l'offre (titre, lieu, contrat, langues), puis analyser en détail le top 3.

## Méthode
1. **Extraire** de l'offre : missions, compétences exigées vs souhaitées, secteur, langues,
   séniorité, localisation, type de contrat.
2. **Score de fit /10** avec justification en 3 lignes, puis **avis tranché** : postuler / postuler
   en adaptant / passer.
3. **Écarts** : chaque exigence non couverte + comment la traiter (reformuler une expérience
   réelle, formation courte, ou l'assumer). Signaler les points bloquants (ex. allemand ou
   luxembourgeois obligatoire, certification exigée).
4. **CV ciblé** : titre "Business Analyst Métier" + secteur de l'offre ; accroche de 3 lignes ;
   expériences réordonnées et reformulées avec les mots-clés de l'offre (ATS) ; résultats chiffrés
   quand Ivan les a fournis.
5. **Lettre ou message** : 150 à 200 mots, structure douleur de l'entreprise → preuve →
   proposition d'échange.

## Règles
- Ne jamais inventer une expérience, un chiffre, un diplôme ou une certification : demander à
  Ivan s'il manque une preuve.
- Luxembourg : vérifier les langues exigées et le secteur (banque, fonds, assurance très demandés).
- Livrer le CV en fichier si Ivan le demande (skill de format adapté), sinon dans le chat.
- Candidature envoyée par Ivan lui-même, jamais par l'agent.
