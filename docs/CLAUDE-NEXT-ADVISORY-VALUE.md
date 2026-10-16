# Lot Claude : qualifier les pistes utiles, sans réécrire le runtime

Base à relire : `origin/agent/codex/advisory-value`, après fetch sans écrasement.
Worktree Claude séparé ; branche `agent/claude/advisory-value-review`.
Lire les instructions du dépôt, le haut du relais, ADVISORY-VALUE-2026-10-16.md
et le diff du lot. Pas de modification services/, shared/, scripts/ ni du live.

1. Contester les critères sur six cas neufs : deux douleurs Business (dont une
   résolue par une procédure gratuite), deux pistes Finance (deux horizons
   différents, dont un cas où une annonce macro ne suffit pas), deux mécanismes
   techniques (dont une annonce sans application concrète). Sources publiques
   réellement lues, attentes fixées avant mesure, provenance et dates. Aucun
   besoin d'appeler un modèle : ne pas fabriquer de score de qualité non mesuré.
2. Proposer deux familles gratuites de sources hors HN pour les douleurs de
   professionnels/petites entreprises, et deux pour les pistes Finance.
   Montrer comment vérifier le fait, les alternatives, les frais/inconnues et
   l'invalidation. Une source primaire et un regard indépendant par piste ; aucun
   portefeuille privé, aucun rendement promis, aucune inscription ni dépense.
3. Relire les sorties natives isolées conservées par Codex : technique utile ou
   simple reformulation ? Signal Business ou offre déjà résolue ? Pas de note sur
   un message qui n'a pas réellement été livré. Les anciennes notes v0/v1 ne
   doivent pas être recalculées sous un nouveau rendu.
4. Livrer une note de revue et les contre-exemples sur sa branche, tests du lot
   documentaire si nécessaires, commit/push/PR brouillon vers la branche Codex.
   Ne fusionner, installer, activer ni contacter personne. Pas de boucle de calibration.

Le retour d'Ivan « peu utile » est un verdict réel. Les horizons court/moyen/long
sont ouverts ; ne pas lui redemander ce choix ni en déduire son appétit au risque.
Le prochain correctif Codex doit assembler des preuves supplémentaires, plutôt
que multiplier des résumés d'un même extrait.
