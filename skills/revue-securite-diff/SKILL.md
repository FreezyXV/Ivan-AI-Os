---
name: revue-securite-diff
description: Checklist de sécurité proportionnée pour un diff ou une PR (secrets, chemins, authentification, appels payants, actions irréversibles, dépendances, données personnelles) - rapide, sans excès, chaque constat prouvé. Utiliser avant tout commit, push ou fusion qui touche du code, de la configuration, un workflow CI, un hook ou une dépendance, ou quand Ivan dit "c'est sûr ?", "vérifie la sécurité", "relis cette PR".
compatibility: "claude-code, codex"
metadata:
  version: "1.0.0"
  famille: engineering
  manager: engineering
  risque: lecture
  profil: "non"
  statut: actif
  provenance: "Ivan-AI-Os, revues PR #2/#3 et consigne d'Ivan (sécurité non abusive) 2026-09-29"
---
# Revue sécurité d'un diff

Principe d'Ivan : protéger fort ce qui coûte cher (secrets, argent, irréversible, tiers), ne pas
bloquer le reste. Un faux positif qui gêne le travail est aussi un défaut.

## Checklist (dans cet ordre, s'arrêter à ce qui s'applique)
1. **Secrets** : scan de l'index qui n'affiche que `fichier:ligne type`, jamais la ligne trouvée :
   ```bash
   for rule in 'cle-api=(sk|pk|rk)-[A-Za-z0-9_-]{16,}' 'jeton-github=gh[pousr]_[A-Za-z0-9]{20,}' \
     'cle-aws=AKIA[0-9A-Z]{16}' 'cle-privee=BEGIN [A-Z ]*PRIVATE KEY' \
     'mot-de-passe=(password|passwd|secret)[[:space:]]*[:=][[:space:]]*[^[:space:]]{8,}'; do
     git grep --cached -nIE "${rule#*=}" | cut -d: -f1,2 | sed "s/\$/  ${rule%%=*}/"
   done
   ```
   Fichiers `.env*` (hors `.example`), clés, dumps de config ajoutés ?
2. **Données personnelles** : noms de clients, finances, e-mails, téléphones dans le dépôt, les
   journaux ou un prompt envoyé à un tiers ?
3. **Appels payants** : nouvel appel à une API facturée (TypeSafe/Jev, modèles) sans plafond,
   sans délai d'expiration ou dans une boucle ?
4. **Actions irréversibles ou vers des tiers** : envoi, paiement, suppression, publication,
   `push --force`, migration destructive sans GO explicite ?
5. **Surface d'accès** : endpoint sans authentification, écoute hors `127.0.0.1`, CORS ouvert,
   redirection suivie avec des identifiants ?
6. **Chemins et commandes** : entrée utilisateur dans un chemin (traversée, lien symbolique) ou
   une commande shell ?
7. **Dépendances** : nouveau paquet — utile, maintenu, verrouillé (lockfile) ? Script `postinstall` ?
8. **Garde-fous** : un test prouve-t-il le refus attendu ? Une règle bloque-t-elle des fichiers
   légitimes (exécuter le classifieur sur 3 chemins ordinaires du dépôt) ?

## Sortie
- `RAS` si rien ne s'applique, en une ligne.
- Sinon, par constat : niveau (bloquant / à corriger / remarque), fichier:ligne, preuve (commande
  + sortie), correctif proposé en une ligne.
- Ne jamais afficher la valeur d'un secret trouvé : seulement fichier, ligne et type.
