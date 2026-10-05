# Mesure Codex — sorties éditoriales natives

Référence current : 9136f58 ; variante compacte : 23cf0be. Contexte v3.
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
Variante compacte exécutée une fois sur les mêmes quatre fixtures, sans label
fourni au modèle, sans Jev et sans Telegram. Sorties privées :
~/.ivan-ai-os/mac-alerts-23cf0be/editorial-samples-compact.jsonl.

| Cas | Durée compacte | Prompt, caractères | Message, caractères | Réduction prompt |
|---|---:|---:|---:|---:|
| I01 | 13 002 ms | 2964 | 1133 | 27,2 % |
| I02b | 15 088 ms | 2656 | 1323 | 29,6 % |
| I12 synthétique | 25 779 ms | 1991 | 953 | 32,9 % |
| I13 | 40 813 ms | 2989 | 1331 | 27,8 % |

Contrôles mécaniques Claude : zéro échec pour chaque sortie compacte. Huit
complétions natives au total ; ne pas répéter les appels pour remplir le protocole.
Le prompt compact précise aussi la proportionnalité des actions : la comparaison
ne mesure donc pas seulement une compression. Un passage par cas ne démontre
ni accélération, ni qualité préservée, ni économie de tokens facturés. La notation
indépendante reste ouverte. compact-v1 est réservé à editorial-evaluation ; le
mode de production reste current.

Essai distinct, source Next.js réellement retéléchargée après correctif v3 :
4315 caractères lus, 1193 dans l'extrait ; vrai Jev keep 0,26, puis review du pipeline.
Une sélection payante, zéro génération et zéro livraison. File de vérification isolée,
file de production intacte. Ce diagnostic sur une source déjà connue n'est pas
une nouvelle validation indépendante et ne justifie pas d'abaisser le seuil seul.
Preuve : ~/.ivan-ai-os/mac-alerts-9136f58/real-source-v3/proof.json.
