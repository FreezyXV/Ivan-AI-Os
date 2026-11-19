import {ownerDm} from './owner.js';

export async function handleOpportunityCommand(ctx,config,kind){
  // These fields come from OpenClaw's native command dispatcher, never a tool
  // argument or a message interpreted by an LLM. Only Ivan's private DM.
  if(!ownerDm(ctx,config))return {text:'Commande réservée au Telegram privé d’Ivan.'};
  let store;
  try{
    // The native loader is synchronous. Load CLI-backed engine validation only
    // after dispatch, so their conditional top-level awaits cannot break startup.
    const {openDossiers}=await import('../../../shared/opportunity-dossier.mjs');
    store=openDossiers(config);
    if(kind==='read'){
      const id=(ctx.args??'').trim();
      if(!id){const rows=store.list();return {text:rows.length?rows.map(r=>`${r.id} — ${r.title} (${r.choice??'à décider'})`).join('\n'):'Aucune opportunité documentée pour le moment.'};}
      const r=store.get(id),last=r.decisions.at(-1);
      return {text:[`Dossier ${id}`,r.brief.message,`Choix : ${last?.choice??'en attente'}.`,...(last?[`Raison : ${last.reason}`]:[]),`/decision ${id} tester|veille|ecarter ta raison`].join('\n\n')};
    }
    const match=/^([a-f\d]{12}) (tester|veille|ecarter) (.+)$/.exec(ctx.args??'');
    if(!match)return {text:'Utilise /decision <identifiant> tester|veille|ecarter <raison>.'};
    const result=store.decide(match[1],match[2],match[3]);
    let followup='';
    const context=store.researchContext(match[1]);
    if(context&&config.researchDirectory&&match[2]==='tester'){
      let research;
      try{
        const {openResearchStore}=await import('../../../services/alerts-runtime/src/research-store.js');
        research=openResearchStore(config.researchDirectory);
        const {bundle,report,missionId,jobId,choiceRevision}=context;
        const asset=research.get(jobId)?.seed?.asset;
        const question=report.nextStep.replace(/https?:\/\/\S+/g,'').slice(0,220);
        const at=new Date().toISOString();
        const queued=research.enqueue({topic:bundle.topic,category:bundle.category,anchorUrl:bundle.anchorUrl,title:bundle.title,
          sourceType:'request',readAt:at,text:'Préparer le test public et réversible prévu dans le dossier.',
          origin:'telegram-native',revision:`test-${missionId.slice(0,12)}-${choiceRevision}`,
          parentJob:jobId,missionId,depth:1,testId:match[1],choiceRevision,researchQuestions:[question],...(asset?{asset}:{})});
        followup=`\n${queued.added?'Test préparatoire en file prioritaire.':'Test préparatoire déjà enregistré.'} /suivi ${missionId.slice(0,12)}`;
      }catch{followup='\nLe test reste à mettre en file. La décision a été enregistrée.';}finally{research?.close();}
    }else if(context&&match[2]==='veille'){
      followup='\nLe dossier est suivi lors des prochaines vérifications programmées.';
    }
    return {text:result.projected?`Décision enregistrée · ${match[2]}. Fiche Obsidian · ${result.note}.${followup}`:`Décision enregistrée. Mise à jour Obsidian en attente (${result.error_code}).${followup}`};
  }catch(error){return {text:`Dossier indisponible (${/^DOSSIER_[A-Z_]+$/.test(error.code??'')?error.code:'DOSSIER_UNAVAILABLE'}).`};}
  finally{store?.close();}
}
