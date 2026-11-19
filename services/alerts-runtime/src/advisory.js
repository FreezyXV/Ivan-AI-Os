import {fail} from './context.js';
export const ADVISORY_VERSION='advisory-v1';
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);
export function validateAdvisory(brief,{required=false}={}){
 const a=brief?.advisory;
 if(a===undefined){if(required)fail('ADVISORY_RESEARCH_REQUIRED');return;}
 const kind={business:'business',finance:'investment',engineering:'technical',system:'technical'}[brief.goal];
 if(!kind||!Array.isArray(brief.facts)||brief.facts.length<1||!a||Array.isArray(a)||typeof a!=='object'||a.kind!==kind||
  Object.keys(a).some(k=>!['kind','proposal','basis_fact','invalidation','horizon'].includes(k))||
  !text(a.proposal,220)||!text(a.invalidation,180)||!Number.isInteger(a.basis_fact)||a.basis_fact<0||a.basis_fact>=brief.facts?.length||
  (kind==='investment'?(!['short','medium','long'].includes(a.horizon)||!text(brief.uncertainty,300)):a.horizon!==undefined))
   fail('ADVISORY_RESEARCH_REQUIRED');
 return a;
}
export function advisoryParagraphs(brief){
 const a=validateAdvisory(brief);if(!a)return [];
 const label={business:'Piste Business',investment:'Piste d’investissement à étudier',technical:'Piste technique'}[a.kind];
 const horizon=a.horizon?` (${ {short:'court terme',medium:'moyen terme',long:'long terme'}[a.horizon]})`:'';
 return [`\n${label}${horizon} — hypothèse : ${a.proposal}`,`Invalider si : ${a.invalidation}`];
}
export const ADVISORY_PROMPT=`Barre d'utilité validée par Ivan : une veille d'actualité seule est insuffisante. Business : problème subi, acheteur plausible, solution à éprouver et alternatives existantes. Finance : piste d'investissement argumentée, mécanisme, déclencheur, risque et condition d'invalidation ; un chiffre macro seul ne suffit pas. Court, moyen et long terme sont tous ouverts, sans allocation ni tolérance au risque présumées. Engineering/System : technique applicable à Jarvis, au code, aux applications ou aux sites, avec composant ciblé et test concret ; une annonce ou une maintenance ordinaire ne suffit pas.
Une simple demande « quelqu'un a utilisé X plutôt que Y ? », avec promesse de rapidité/prix non vérifiée, n'établit ni douleur vécue ni occasion commerciale. Ne transforme pas une demande d'avis sur un produit en projet de comparateur. Il faut un problème actuel décrit, une contrainte concrète ou un contournement subi ; sinon review ou skip.
Pour keep, ajoute dans brief : "advisory":{"kind":"business|investment|technical","proposal":"proposition précise à étudier ≤220 caractères","basis_fact":0,"invalidation":"condition observable qui invaliderait la proposition ≤180"}. basis_fact est l'index du fait de brief.facts qui justifie la piste, pas l'index evidence. kind correspond à goal : business→business, finance→investment, engineering/system→technical. Seulement pour investment, ajoute "horizon":"short|medium|long" et donne le risque principal dans uncertainty. Aucun autre champ advisory. La proposition est une hypothèse, jamais une promesse ni une opération autorisée. Aucun nombre nouveau dans proposal/invalidation.
Action : plus petit test utile ou recherche de preuves, jamais achat, transaction ou contact. Si les preuves ne permettent pas cette proposition, réponds review ; si c'est du bruit, skip. Ne fabrique pas d'opportunité pour remplir un quota. Une procédure gratuite existante qui résout déjà une friction affaiblit l'idée Business. Une information sur un outil tiers ne prouve pas qu'Ivan l'utilise. Une comparaison, des frais, un prix ou des conditions de marché absents restent inconnus. Une source seule ne prouve ni marché, ni paiement, ni rendement. Contrat ${ADVISORY_VERSION}.`;
