# Lot Claude : couverture utile et revue finale ciblée

#64 et #65 sont intégrées sur la branche Codex ; le lot CLAUDE-NEXT-PR63 est clos.
Ne pas refaire l'import stdin, les options Git, les corpus ou leurs campagnes payantes.

Dans ~/Ivan-AI-Os-claude, préserver les modifications locales, fetch, puis isoler
agent/claude/source-quality-final depuis origin/agent/codex/alerts-integration.
Lire le haut de SESSION_HANDOFF, SOURCE-READER-RECOVERY.md et le diff ab8d294.

1. Relire uniquement la reprise des lecteurs : échecs persistés, délais bornés,
   filtre avant LIMIT, nouvelle empreinte, reçus et sources déjà lues préservés.
   Rejouer les tests ciblés sans API modèle. Signaler seulement un défaut reproduit.

2. Examiner les deux sources publiques réellement bloquées :
   - https://simonwillison.net/2026/Oct/6/le-chonk/ : PUBLIC_SOURCE_DATE_UNVERIFIED ;
   - https://nextjs.org/blog/next-16-4 : PUBLIC_SOURCE_TOO_LARGE.
   Donner les éléments exacts qui permettraient une lecture fiable (date primaire,
   corps utile, taille réelle), ou conclure qu'il faut les laisser non lues.
   Ne pas déduire la date d'un lien, d'un repost ou d'un push Git. Ne pas augmenter
   les plafonds sans mesure. Pour Mistral, distinguer commentaire et annonce déjà
   lue ; ne pas produire deux alertes pour la même annonce ni fusionner les chiffres.

3. Mettre à jour K09/K10 : deux semaines d'usage et dix abstentions annotées par
   Ivan restent une qualification produit, pas un défaut de code à simuler.
   Si une vraie synthèse v3-business-market est livrée, la relire par reçu exact ;
   sinon signaler son absence, sans rejouer B03 ou attribuer une note fictive.

Périmètre : documents de revue/usage et captures publiques nécessaires aux preuves.
Codex conserve lecteurs, services, déploiement et configuration live ; aucun
nouveau benchmark payant, aucune installation ou fusion dans ce lot.
Livrer une seule PR brouillon vers la branche Codex et un avis court.
Career reste en pause, OVH reporté, Knowledge/Anakalypto en dernière étape commune.
