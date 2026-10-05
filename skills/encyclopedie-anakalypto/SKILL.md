---
name: encyclopedie-anakalypto
description: Moteur de contenu Anakalypto - trouver beaucoup de sujets captivants (pages les plus consultées + série « Après l'apocalypse »), les faire trier et classer par Jev dans les 19 domaines en priorisant les domaines sous-couverts, rédiger des fiches courtes (≤ 2 min de lecture) centrées sur un visuel ou une interaction, vérifier les faits par code et publier seulement avec la décision Jev. Utiliser dès qu'Ivan parle d'Anakalypto, de fiches, d'un "nouveau lot", de sujets à couvrir, de la série reconstruction, ou d'une fiche de connaissance.
compatibility: "claude-code, codex"
metadata:
  version: "2.0.0"
  famille: knowledge
  manager: knowledge
  risque: brouillon
  profil: "non"
  statut: actif
  provenance: "skill claude.ai d'Ivan encyclopedie-anakalypto v1 ; v2 (format court, visuel, Jev obligatoire, 19 domaines, série reconstruction) décidée par Ivan le 2026-09-29"
---
# Anakalypto — fiches courtes, visuelles, vérifiées

Format : [format.md](format.md). Domaines et couverture : [domaines.json](domaines.json).
Série transversale : [serie-reconstruction.md](serie-reconstruction.md).
**Jev est obligatoire** : sans ses décisions, aucun sujet n'est retenu et aucun lot n'est publiable.

## 1. Sujets (0 token jusqu'à Jev)
- `node scripts/sujets.mjs --source tout --max 150 --jev` : flux scientifiques (`sources.json` : The
  Conversation, Sciences et Avenir, Futura, Inserm, NASA, ESA, Nature ; promotions écartées par code)
  et pages Wikipédia les plus vues, nettoyées,
  intérêt soutenu sur plusieurs jours, sujets déjà couverts exclus
  (`~/.ivan-ai-os/anakalypto/couverts.txt`). Jev décide `sujet.captivant` puis `sujet.domaine` ;
  les retenus sont triés par déficit de leur domaine.
- Série reconstruction : prendre les sujets amorcés du domaine le plus en déficit, les soumettre
  au même `sujet.captivant`.
- `en_attente_jev` = Jev indisponible : ne rien rédiger, le signaler.

## 2. Écrire pour capter (≤ 2 min)
- **Accroche** (≤ 160 car.) : une question qui intrigue ou un fait chiffré surprenant, vérifié.
- **L'essentiel** : 3 à 5 puces, une idée chacune, verbes concrets, zéro jargon non expliqué.
- **Le visuel porte la fiche** : choisir d'abord l'interaction (quiz, curseur, comparateur, carte,
  timeline, diagramme) avec `affirmations.mjs visuels`, puis écrire le texte autour. Direction
  artistique : skill `design-original`.
- Pas de remplissage, pas de superlatif non prouvé ; un exemple du quotidien par fiche.

## 3. Vérifier (code)
- Registre `<lot>.claims.json` (skill `verification-affirmations`) : `verifier` doit passer.
- `faits` → « Faits clés » et « Sources » ; `python3 scripts/valider_lot.py <lot>.md --brouillon`.

## 4. Porte Jev de publication (obligatoire)
- `node scripts/porte_jev.mjs <lot>.md` → `<lot>.jev.json` (`publication.prete` par fiche, sans
  aucune donnée privée). Puis `python3 scripts/valider_lot.py <lot>.md` sans `--brouillon` : c'est
  lui qui autorise la livraison. Publication sous l'identité d'Ivan : son GO (constitution).
- Après publication : ajouter les titres à `couverts.txt`, mettre à jour `domaines.json`.

## Économie de tokens
- Le code trie, vérifie et valide ; Jev choisit ; le LLM n'écrit que les fiches retenues.
- Lots de 10 à 20 fiches ; ne pas réafficher les fiches dans le chat, livrer le fichier.
