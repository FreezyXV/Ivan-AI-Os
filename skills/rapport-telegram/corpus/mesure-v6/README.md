# Mesure v6 — 6 sources neuves (prête, non mesurée)

Sources réelles du 2026-10-06 (lecteur de production @d1893b6), jamais utilisées dans un corpus,
benchmark ou exemple. Labels figés avant toute passe (`labels.json`, empreinte des fixtures).
Collecte simulée à `publishedAt + 2 h`. Un seul keep attendu (M03) : ce jeu sert à vérifier
l'absence de bruit en v6, pas le rappel. Passe unique par Codex :
`node skills/rapport-telegram/corpus/pertinence-v1/assembler.mjs skills/rapport-telegram/corpus/mesure-v6 > corpus.json`
puis l'évaluation du mode E (6 sélections Jev au plus, 1 à 2 rédactions natives).
