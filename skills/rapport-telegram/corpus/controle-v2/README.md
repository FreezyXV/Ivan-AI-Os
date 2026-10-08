# Contrôle v2 — 12 sources neuves (qualification finale)

Disjoint de tout ce qui a déjà été mesuré (pertinence-v1, calibration-jev-v1, corpus #50 :
vérifié par test). Labels **fixés avant mesure** dans `labels.json`, séparés des entrées
(`fixtures.jsonl`, empreinte `0a429f15…`). Réels V01–V08 (lecteur de production @23cf0be),
synthétiques V09–V12 (URL fictives `example.org`, couverture déclarée).

Essai hors ligne @d63a0c3 (0 appel) : 7 cas tranchés par le code, tous conformes. Les sujets
HN des 1–3 octobre dépassent déjà 72 h au moment de la lecture : seuls V01 et V09–V12 iront à Jev.
C'est aussi une observation de production : les positifs récents sont rares dans les flux.

Passe coordonnée (Codex, **une fois**, après intégration de #59 et de la politique calibrée) :
`node skills/rapport-telegram/corpus/pertinence-v1/assembler.mjs skills/rapport-telegram/corpus/controle-v2 > corpus.json`
puis `scripts/evaluate-alert-corpus.mjs --live corpus.json <sortie privée>` — 5 appels Jev au plus.
Critère de réussite proposé : aucun faux keep (V01–V08, V11), aucun keep écarté (V09, V10),
V12 jamais immédiat.
