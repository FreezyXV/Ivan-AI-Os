# Relecture ciblée des fusions Claude du 29 septembre

Base examinée : `foundation/v1` à `0b2d93d`. Cette note couvre les
priorités #28, #31 et #26 de la passation, pas les autres PR fusionnées.

## #28 et #31 — hook Claude Code

Le mode `gate` applique bien la liste `never` avant tout appel réseau,
laisse passer le travail `autonome`, et ne renvoie jamais une permission
`allow`. #31 corrige le faux refus des mots interdits simplement cités
dans un corps de commentaire ou de commit, tout en conservant le refus
des commandes exécutées par un interpréteur. Les cinq tests ciblés
`hooks/claude/test/rules.test.mjs` passent.

Avis : favorable pour le pilote actuel. Le code traite `node --test` et
`git fetch` comme `autonome` ; cette catégorie signifie « exécutable sans
avis Jev », pas « lecture seule » au sens strict. La documentation dit
déjà que le hook échoue ouvert si le gateway ou le jeton manque : il ne
faut pas le présenter comme une barrière d'exécution complète.

## #26 — porte Jev Anakalypto

Le format v2, les dix-neuf domaines, les seuils et l'échec fermé quand le
client Jev est indisponible sont cohérents. Les six tests ciblés du skill
Anakalypto passent. **Constat à corriger avant toute publication
automatique** : `valider_lot.py` accepte n'importe quel `request_id` non
vide dans un fichier `<lot>.jev.json`. Une décision fabriquée avec
`request_id: "fake"` et `decision: 1` est donc acceptée sans appel ni
preuve Jev. Preuve exécutée sur un lot synthétique temporaire :

```text
python3 [import de valider_lot.py ; faux .jev.json ; verifier_jev(article, ['demo'])]
[]
```

La sortie `[]` signifie zéro erreur de vérification. Il faut lier chaque
`request_id` à une décision effective du gateway (journal privé ou reçu
signé), avec la question, le slug et le score exacts. Les brouillons
restent utilisables ; la publication conserve la validation humaine.

## Client `classify.mjs`

Le client refuse les questions inconnues, les champs hors liste et les
réponses malformées. Le serveur nouvellement poussé sur
`agent/codex/classify` vérifie à nouveau les entrées et n'accepte que les
questions inscrites. La passation annonce onze questions mais le code
client en déclare dix, vérifié par un test de parité. La protection
client contre les clés n'identifie pas le préfixe `apikey_` ; le serveur
le rejette désormais avec un test synthétique. Aucun texte libre ne
doit être envoyé depuis un moteur sans validation de son caractère public.
