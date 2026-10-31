# Claude — revue du moteur de recherche, sans double construction

## Priorité du 31 octobre — explication avant jugement utilisateur

Ivan trouve le catalogue brut confus. Les fiches doivent présenter en français le
sujet, son intérêt, l’utilité personnelle, un usage concret et la source fiable.
L’avis utile/inutile/creuser reste son jugement, pas celui du modèle. V3 ne doit
pas devenir une sélection restrictive de marchés déjà validés ; elle vérifie
les faits, l’attribution et la clarté. Une fiche technique ne doit pas demander
à Ivan de faire les tâches ordinaires des agents ni promettre un outil non intégré.

Code d9e2b62 actif, 282 tests concernés. Une vraie qualification a montré que des
fiches factuellement correctes restaient trop génériques : Codex les a réécrites,
fait relire puis a livré deux fiches Business/Finance. La piste FTS5 est restée
rejetée, sans contournement. L’approbation native n’est pas un substitut à la lecture
du destinataire ; ne pas noter des exemples comme découvertes automatiques.
Preuves privées mac-opportunity-d9e2b62/editorial-review.json et corrected-delivery.json.
Harvest : passages exacts lus via l’outil Web Codex, pas lecture HTTPS automatique.
SQLite/Insee : pages lues par le lecteur HTTPS ; aucune note de lecture paraphrasée
prise comme citation primaire. Aucun appel payant de benchmark demandé à Claude.

Revue utile : suivre les premières sorties vraiment automatiques v3 et leur clarté,
diversifier les sources fiables, relever les généralités et affirmations cachées
dans l’utilité. Codex garde services/shared/scripts/hooks OpenClaw. Ne pas rétablir
le catalogue brut ni toucher au live. Aucun avis individuel d’Ivan inventé.

## Historique — radar large et feedback du 30 octobre

## Priorité actualisée — radar large et feedback

Ivan veut désormais beaucoup de sujets et donner lui-même l’avis utile/inutile/
creuser. Ne pas reconstruire un filtre LLM d’admission à sa place. Code f2268d3
actif :20 sujets réellement livrés dans quatre catalogues73–76, six Business,
six Finance, six Engineering, deux System. Ce ne sont pas vingt dossiers validés.
Lire RADAR-USER-FEEDBACK.md puis relire le catalogue et le mécanisme d’avis :
clarté des titres attribués/non lus, diversité, charge de notation, conservation
et usage réel des retours. Aucun avis utilisateur n’existe encore ; ne pas l’inventer.
Les tests natifs /avis passent ; son entrée Telegram réelle reste à observer.

Codex a séparé préférence utilisateur et fidélité documentaire. Creuser déclenche
la recherche avec budget actuel, pas achat/contact. Ne pas confondre choix de sujet
et preuve. La source originale d’un titre seul doit être lue avant toute analyse.
Les raisons servent de mémoire ; le classement actuel apprend domaines et mots
des titres, pas une sémantique complète ni un modèle réentraîné. Proposer ensuite
des ajustements fondés sur les vrais avis, sans nouvelle passe payante par défaut.
La contre-revue radar a fait corriger un cycle incertain marqué sain ; sonde
rejouée en échec visible, aucun renvoi. Les notes ajoutées ne sont jamais écrasées.

## Mission précédente — toujours utile pour les approfondissements

Codex livre `agent/codex/research-engine`, basé sur `agent/codex/advisory-value`.
Lire RESEARCH-ENGINE-MAC.md et le début du relais ; vérifier le commit actif avant
relecture. Worktree Claude séparé, aucune modification de la configuration live.

Priorité : relire un vrai dossier livré, citations et meilleur contre-argument,
utilité pour Ivan, alternatives déjà suffisantes et indépendance des témoignages.
Ne pas noter des fixtures comme s'il s'agissait de propositions réellement reçues.

Tester ensuite, sans modèle, `/recherche` (contexte natif autorisé), preuve de source,
reprise et absence de doublon. Proposer des sources de douleurs hors des seuls
logiciels d'automatisation et e-commerce : premiers témoignages datés, alternatives,
public concerné, preuve de demande éventuelle. Aucun achat ni contact.

Finance : relever les données manquantes pour une thèse sur un token et sa capture
de valeur ; contester une valorisation prétendue. Le collecteur actuel fournit des
observations, aucune juste valeur qualifiée. Pas de benchmark payant ou nouvelle
question Jev sans question précise et résultat mesurable attendu.

Lot Claude : note de revue et corpus indépendant, skills/contrat éditorial si écart
prouvé. Codex garde services/, shared/, scripts/, hooks/openclaw/. Préparation
Knowledge différée ; Career et VPS restent en pause. PR brouillon, pas de fusion.

Preuves au 30 octobre : reçu71 = correctifs OpenClaw ; aucune proposition Finance
livrée. Bitcoin a répondu research sur six sources, WooCommerce a produit un
rapport puis un contradicteur research et un approfondissement en file. Ne pas
qualifier ces abstentions de messages livrés. L'abstention initiale de l'analyste
ne conserve pas encore de questions structurées : Codex doit corriger ce manque.
Relecture utile : ce qui manque vraiment aux deux dossiers et quelles sources
ciblées l'établissent, sans nouvelle passe de modèles ni changement de seuil.

PR du lot : https://github.com/FreezyXV/Ivan-AI-Os/pull/71 (base advisory-value).
Avant de déclarer le moteur qualifié : vérifier l'admission/rétention des travaux
non traités et le rafraîchissement d'une cotation quand un dossier attend longtemps.
Ces contrôles ne sont pas une invitation à relancer les envois incertains.

Mise à jour30/10 soir : worker db08a22, research-analysis-v2, raisons/questions
et un approfondissement liés au parent. Revoir les nouvelles sources et calculs,
pas relancer les mêmes appels : Finance dirigée refusée en VALIDATE ; Dolibarr
rejeté pour une condition ajoutée à la citation. Dumps privés sous
~/.ivan-ai-os/mac-opportunity-db08a22, pas de données personnelles à copier.
Clarification Ivan :43 était la collecte, pas le nombre de messages. Deux envois
confirmés aujourd'hui (71/72), aucun dossier dirigé livré. Ne pas demander43 posts.
