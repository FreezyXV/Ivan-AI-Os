import {openDossiers} from '../../../shared/opportunity-dossier.mjs';
import {financeThesisFromBundle,compareFinanceObservations} from './finance-thesis.js';
import {collectFinanceResearch} from './research-finance.js';
import {fetchPublic,extractPublicPage} from './research-web.js';
import {researchHash} from './research-contract.js';
import {radarSourceProfile} from './radar-brief.js';
import {parisDay} from './schedule.js';

export const marketWatchThreshold = Object.freeze({kind:'relative-percent',value:10,direction:'either'});

export async function watchMaterialChange(context,{now,fetchImpl=fetchPublic,financeImpl=collectFinanceResearch}={}) {
  const {bundle,report} = context;
  if(report.category==='asset'){
    const baseline=financeThesisFromBundle(bundle,{horizon:report.horizon})?.observation;
    if(!baseline)return null;
    const id=baseline.instrumentId.slice('coinpaprika:'.length);
    const result=await financeImpl({assetIds:[id],maxAssets:1,now});
    const asset=result.assets[0];
    if(!asset)return null;
    const latest=financeThesisFromBundle({...bundle,sources:asset.sources},{horizon:report.horizon})?.observation;
    if(!latest)return null;
    const comparison=compareFinanceObservations(baseline,latest,{now,maxAgeMs:3600000,threshold:marketWatchThreshold});
    if(comparison.status!=='material')return null;
    return {signature:researchHash([baseline.sourceSha256,Math.sign(comparison.change.value)]),sources:asset.sources,asset:{id,name:asset.name,officialWebsite:asset.officialWebsite},
      calculations:Object.entries(asset.calculations).map(([id,calculation])=>({id,...calculation})),
      question:'La nouvelle cotation change-t-elle les hypothèses ou le risque étudié dans le dossier ?'};
  }
  const source=bundle.sources.find(source=>{
    if(!source.publishedAt||source.kind==='market-data')return false;
    try{return ['institution','documentation','issuer'].includes(radarSourceProfile(source.url,bundle.topic).kind);}catch{return false;}
  });
  if(!source)return null;
  const page=extractPublicPage(await fetchImpl(source.url,{timeoutMs:6000,maxRedirects:1}));
  if(page.url!==source.url||!page.publishedAt||Date.parse(page.publishedAt)<=Date.parse(source.publishedAt)||
      Date.parse(page.publishedAt)>now.getTime()+300000)return null;
  const text=page.text.slice(0,6000);
  if(researchHash(text)===source.sha256)return null;
  return {signature:researchHash([source.url,page.publishedAt,text]),sources:[{...page,id:source.id,text,kind:source.kind}],
    question:'La mise à jour datée de la source change-t-elle l’objection principale ou le critère d’abandon du dossier ?'};
}

// Existing choices and evidence remain in Obsidian. Only a verified new event
// can enqueue a new version. Reserve the daily check before fetching.
export async function checkOneResearchWatch({store,settings,now,detect=watchMaterialChange}) {
  const result={checked:0,queued:0};
  const dossiers=openDossiers(settings.opportunities);
  let context,id;
  try {
    for(const row of dossiers.watched()){
      const key=`watch:${row.id}:${parisDay(now)}`;
      if(store.discovery(key))continue;
      store.recordDiscovery(key,{attempted:true});
      context=dossiers.researchContext(row.id);id=row.id;break;
    }
  } finally { dossiers.close(); }
  if(!context)return result;
  result.checked++;
  try {
    const change=await detect(context,{now});
    if(!change)return result;
    const {bundle,report}=context;
    const queued=store.enqueue({topic:bundle.topic,category:bundle.category,anchorUrl:bundle.anchorUrl,title:bundle.title,
      readAt:now.toISOString(),text:'Mise à jour datée à comparer au dossier déjà étudié.',sourceType:'request',
      sourceOfChange:change.question,revision:`watch-${context.choiceRevision}-${change.signature.slice(0,24)}`,
      missionId:context.missionId,parentJob:context.jobId,watchId:id,choiceRevision:context.choiceRevision,sources:change.sources,depth:1,
      ...(change.asset?{asset:change.asset,calculations:change.calculations}:{}),
      researchQuestions:[change.question]});
    result.queued=Number(queued.added);
  } catch { result.error_code='RESEARCH_WATCH_UNAVAILABLE'; }
  return result;
}
