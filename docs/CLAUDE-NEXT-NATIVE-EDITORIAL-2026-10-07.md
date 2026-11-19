# Lot Claude : livraisons utiles et documentation alignée

Codex a appliqué la décision d'Ivan : Jev ne trie plus les alertes. Worker
c613533 et plugin 8364b9f actifs, mode native-editorial avec relecture indépendante ;
NATIVE-ALERT-TRIAGE.md et haut de SESSION_HANDOFF décrivent le résultat vérifié.
La première vraie synthèse actuelle est Next.js 16.4, message Telegram 62.
Elle est produite automatiquement ; son digest de qualification a été déclenché
manuellement. Ne pas confondre avec les anciens reçus 59/60 ou le test B03/61.

Dans ~/Ivan-AI-Os-claude : pwd, uname -s, git status ; fetch sans écrasement.
Isoler agent/claude/native-editorial-review depuis origin/agent/codex/alerts-integration.
Préserver tout travail local ; aucun stash/reset/clean ni modification du checkout Codex.

1. Relire une seule fois le vrai message 62 sur les cinq axes éditoriaux, à partir
   de sa propre source et de ses citations. Le reçu et la vérification sont dans
   ~/.ivan-ai-os/mac-alerts-8364b9f/first-native-production-digest.json ; l'item et
   le brief correspondants se lisent dans la file privée, sans écrire ni afficher
   des identifiants de destinataire. Distinguer qualité du message et bénéfice
   quotidien réel ; ne pas donner une note à un message qui n'existe pas.

2. Aligner tes fichiers : workflows/alert-editorial.md, contrat éditorial, skills
   rapport-telegram, jev-decision et calibration-jev. Le tri quotidien est natif,
   suivi d'une seconde lecture isolée ; Jev n'est plus un passage obligé pour les
   alertes. Ses autres questions restent non qualifiées sauf preuve spécifique.
   Garder le schéma existant, aucune seconde file ni politique concurrente.

3. Mettre à jour le guide d'usage dans docs/MAC-PILOT-OPERATIONS.md : digest,
   reçu, lecture partielle, refus du relecteur, diagnostics simultanés et reprise.
   Documenter comment Ivan peut noter simplement utile/inutile/trop vague sur un
   vrai message. Préparer dix abstentions réelles à lui faire étiqueter, sans les
   trancher à sa place ni refaire de benchmark. Éviter les consignes obsolètes
   de confirmation répétée ou de redémarrage systématique pour les skills.

4. Revue runtime ciblée : liaison du reçu de relecture au brief exact ; limite
   des deux étapes ; migration unique des abstentions ; créneaux ; pas de renvoi
   après un envoi incertain. Ajouter priorité des sources nouvelles/interrompues,
   réconciliation des cycles expirés et pause du passage au premier échec du
   fournisseur (commits 32dcdff et c613533, MAC-NATIVE-RECOVERY.md).
   Signaler seulement des défauts reproduits, sans nouvelle campagne payante.

5. Contrôle qualité des vrais briefs prêts : morning-recovery-proof.json dans
   ~/.ivan-ai-os/mac-alerts-c613533 donne les sources et les propositions. Une
   synthèse BCE Finance attend le digest ; le catalogue Business est toujours
   vide. Relire leurs preuves/utilité sans les appeler « messages livrés ».
   Six échecs du matin viennent de model/list timed out, avant la rédaction :
   ne pas les noter comme six jugements faux. Ne rien réessayer sur la file live.

Périmètre Claude : documentation, skills et tests associés. Codex garde services,
hooks/openclaw, scripts de runtime et activation. Ne rien installer/fusionner,
ne faire aucun appel modèle et ne rejouer ni les 94 cas ni les corpus historiques.
Commit/push sur ta branche, une PR brouillon vers la branche Codex, puis un avis
court. Career reste en pause, OVH reporté, Knowledge/Anakalypto étape finale commune.
