import {researchMissionId} from './research-store.js';

const stateLabel = {
 pending: 'en file prioritaire', working: 'en cours', ready: 'dossier prêt',
 sending: 'livraison en cours', delivered: 'livré', delivery_unknown: 'reçu Telegram à vérifier',
 research: 'preuve manquante ou analyse interrompue', rejected: 'étude terminée avec réserve'
};

export function missionSummary({root,current}) {
 const id = researchMissionId(current).slice(0,12);
 const delivered = current.state==='delivered' ? `\nLire le résultat avec /opportunite ${id}.` : '';
 return `Mission ${id} — ${root.seed.title}\n${stateLabel[current.state]??current.state}.${delivered}`;
}

export function missionOutcome(job) {
 const missing = {
  business: 'un second témoignage indépendant ou un document du demandeur qui décrit le problème',
  finance: 'des données publiques datées et une preuve indépendante sur le mécanisme étudié',
  engineering: 'une documentation primaire et un cas reproductible qui traite du même problème',
  system: 'une documentation primaire et un cas reproductible qui traite du même problème'
 };
 const id=researchMissionId(job).slice(0,12);
 let text;
 if(job.error==='RESEARCH_EVIDENCE_INSUFFICIENT')text=`La recherche a atteint sa limite de lecture. Il manque ${missing[job.seed.topic]}.`;
 else if(job.analysis?.decision==='skip'||job.analysis?.decision==='research')text=job.analysis.reason;
 else if(job.review)text=job.review.strongestCounterargument;
 else if(job.error==='RESEARCH_MARKET_REFRESH_REQUIRED')text='Les données de marché doivent être actualisées avant que le dossier puisse guider une décision.';
 else if(job.error==='RESEARCH_PROJECTION_BLOCKED')text='La fiche a passé la relecture. Son écriture dans Obsidian demande une vérification.';
 else text='La rédaction ou la vérification a été interrompue. Le résultat est conservé pour diagnostic.';
 const question=job.review?.questions?.[0]??job.analysis?.questions?.[0];
 return [`Recherche ${id} — ${job.seed.title}`,text,question?`Preuve à rechercher en priorité · ${question}`:'',`Suivi · /suivi ${id}`].filter(Boolean).join('\n\n');
}
