import {verifierFiche,qualiteFiche} from '../../../skills/business-engine/scripts/fiche.mjs';
import {scoreOpportunity} from '../../../skills/business-engine/scripts/signals.mjs';
import {fail} from './context.js';

// A single read source, not a fabricated market survey. Evidence identity and date
// are code-owned. The existing queue owns persistence, leases and delivery receipts.
export function bindBusinessFiche(item,raw,spans){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!Array.isArray(raw.preuves))fail('ALERT_BUSINESS_FICHE_INVALID');
 return {...raw,sourcesDistinctes:1,preuves:raw.preuves.map(p=>{
  if(!p||typeof p!=='object'||(p.url!==undefined&&p.url!==item.url)||(p.date!==undefined&&p.date!==item.publishedAt.slice(0,10)))fail('ALERT_BUSINESS_FICHE_INVALID');
  let citation=p.citation;
  if(p.evidence_index!==undefined){
   if(!Number.isInteger(p.evidence_index)||p.evidence_index<0||p.evidence_index>=spans.length)fail('ALERT_FACT_UNSUPPORTED');
   citation=spans[p.evidence_index];
  }
  return {url:item.url,date:item.publishedAt.slice(0,10),type:p.type,citation};
 })};
}
export function validateBusinessFiche(item,fiche){
 const source={url:item.url,title:item.title,excerpt:item.excerpt};
 const checks=verifierFiche(fiche,[source]);
 if(checks.length)throw Object.assign(new Error('ALERT_BUSINESS_FICHE_INVALID'),{code:'ALERT_BUSINESS_FICHE_INVALID',
  validationChecks:[...new Set(checks.map(c=>c.split(':')[0]).filter(c=>/^[A-Z_0-9]{1,64}$/.test(c)))].slice(0,8)});
 const bounded=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\x00-\x1f]/.test(v);
 if(!/^[a-z0-9][a-z0-9-]{9,60}$/.test(fiche.sujet)||!bounded(fiche.probleme,350)||!bounded(fiche.acheteur.profil,160)||
  !bounded(fiche.hypothese,350)||!bounded(fiche.limites,250)||!bounded(fiche.prochainTest.description,250)||
  fiche.preuves.length>3||fiche.objections.length>3||!fiche.objections.every(v=>bounded(v,160))||
  fiche.preuves.some(p=>p.date!==item.publishedAt.slice(0,10))||fiche.sourcesDistinctes!==1)fail('ALERT_BUSINESS_FICHE_INVALID');
 // Native prose cannot turn an unspecified private fit or payment into a score.
 let score=null;
 if(fiche.moteur){
  const entree=fiche.moteur.entree;
  if(entree.sujet!==fiche.sujet||entree.cible!==fiche.acheteur.profil||entree.douleur!==fiche.probleme||
   Object.values(entree.criteres).some(c=>c.preuve==='profil')||
   (entree.criteres.paiement.note>0&&!fiche.preuves.some(p=>p.type==='paiement-observe')))fail('ALERT_BUSINESS_FICHE_INVALID');
  score=scoreOpportunity(entree);
 }
 return {fiche,editorialWarnings:qualiteFiche(fiche),...(score?{score}:{}),engine:'signals.mjs#scoreOpportunity',scored:score!==null};
}
export function businessParagraphs(item,fiche){
 const {score}=validateBusinessFiche(item,fiche);
 return [`Acheteur envisagé (${fiche.acheteur.statut}) : ${fiche.acheteur.profil}`,
  fiche.hypothese,`Objections : ${fiche.objections.join(' ')}`,
  `Test proposé (${fiche.prochainTest.dureeJours} jours, gratuit, local) : ${fiche.prochainTest.description}`,
  `Statut : ${fiche.decision}${score?` — score recalculé ${score.total}/30`:' — aucune recommandation de lancement'}.`,
  `Limites Business : ${fiche.limites}`];
}

export const BUSINESS_PROMPT=`Si goal vaut business, ajoute à brief un champ business_fiche. Même appel, pas de recherche ni d'action.
Format : {"sujet":"slug-du-probleme-au-moins-10-caracteres","acheteur":{"profil":"acheteur envisagé ≤160","statut":"hypothèse"},"preuves":[{"type":"douleur ou demande ou offre-existante","evidence_index":0}],"objections":["objection ou hypothèse ≤160"],"hypothese":"Hypothèse : acheteur et besoin à vérifier ≤350","prochainTest":{"description":"recherche de preuves publiques distinctes ≤250","dureeJours":3,"coutEur":0,"reversible":true,"contactTiers":false},"decision":"exploratoire","limites":"limite ≤250"}.
L'utilité Business concerne le marché : qui souffre du problème et qui pourrait payer, pas l'utilisation de cet outil par Ivan. Une seule source exige d'abord d'autres discussions ou témoignages publics distincts de la même douleur, en lecture seule et sans contact. Un prototype fictif ne mesure pas la demande. L'hypothèse nomme un acheteur et un besoin. L'action propose cette recherche, sans la lancer. Évite de répéter la même limite dans plusieurs champs.
Le code fournit aussi probleme à partir du premier fait vérifié. Ne duplique pas ce fait dans l'hypothèse. N'utilise pas les mots revenu/MRR/ARR dans les champs, même pour dire qu'ils sont inconnus, sans citation qui en parle ; écris plutôt « aucun paiement observé ».
1–3 preuves numérotées du même extrait, pas de titre seul. Le code fournit URL, date, citation et nombre de sources. Offre existante ≠ paiement observé. Ne crée ni moteur ni scoreCode : les critères nécessaires au score sont inconnus. Aucun revenu, montant, client privé, contact, achat ou lancement. Le test reste local, gratuit, réversible, 1 à 7 jours. Une seule source prouve au plus un signal, pas un marché. Pour les autres objectifs, pas de business_fiche.`;
