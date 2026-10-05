# Mesure Codex — sorties éditoriales natives

Source et services : 9136f58, contexte mac-alerts-20261005-v3.
Corpus Claude PR #55 @ba9fbe80, fixtures I01/I02b/I12/I13, capturées par Claude.
Commandes : generate-alert-editorial-samples.mjs --live <corpus> <sorties privées>,
puis evaluer.mjs noter <sorties privées> depuis l'archive isolée de la PR #55.
Sorties : ~/.ivan-ai-os/mac-alerts-9136f58/editorial-samples-current.jsonl.
Aucun label transmis au modèle. Dates de lecture historiques conservées.
I12 est explicitement synthétique ; aucun incident réel OpenClaw n'est revendiqué.

| Cas | Durée totale | Prompt, caractères | Message, caractères | Contrôles Claude |
|---|---:|---:|---:|---|
| I01 Next.js | 20 359 ms | 4069 | 1002 | OK |
| I02b BCE | 14 908 ms | 3772 | 1146 | OK |
| I12 scénario OpenClaw | 10 378 ms | 2967 | 950 | OK |
| I13 ThinkingBox | 42 495 ms | 4142 | 1026 | OK |

Quatre complétions natives, zéro sélection Jev et zéro message Telegram.
Les durées comprennent l'appel CLI/RPC et la génération ; elles ne mesurent pas
le temps du modèle seul. Aucun usage facturé ni tarif natif disponible.
Le score de pertinence « 0/8 » du vérificateur est inapplicable à ces lignes :
elles n'ont pas de champ selection, puisqu'elles mesurent uniquement la prose.
Ce score ne doit être ni présenté comme une sélection ratée, ni rempli avec un KEEP fictif.

Revue Codex qualitative, provisoire : citations liées à l'extrait ; limites
d'installation explicites pour Next.js ; BCE sans portefeuille ni prédiction ;
pas d'incident attribué à l'installation dans le scénario I12. I13 recommande
vingt répétitions d'après le benchmark : rendre cette action proportionnée au
workflow mesuré, plutôt que transformer un protocole d'article en seuil universel.
La notation indépendante fidélité/utilité/action/effort reste à Claude/Ivan.
Variante compacte non exécutée : aucun gain A/B ou qualité préservée revendiqués.

Essai distinct, source Next.js réellement retéléchargée après correctif v3 :
4315 caractères lus, 1193 dans l'extrait ; vrai Jev keep 0,26, puis review du pipeline.
Une sélection payante, zéro génération et zéro livraison. File de vérification isolée,
file de production intacte. Ce diagnostic sur une source déjà connue n'est pas
une nouvelle validation indépendante et ne justifie pas d'abaisser le seuil seul.
Preuve : ~/.ivan-ai-os/mac-alerts-9136f58/real-source-v3/proof.json.
