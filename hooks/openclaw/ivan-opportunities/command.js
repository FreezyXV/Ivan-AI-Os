export async function handleOpportunityCommand(ctx,config,kind){
  // These fields come from OpenClaw's native command dispatcher, never a tool
  // argument or a message interpreted by an LLM. Only Ivan's private DM.
  if(ctx?.channel!=='telegram'||ctx.isAuthorizedSender!==true||
    typeof config?.ownerId!=='string'||!/^\d{1,20}$/.test(config.ownerId)||
    ctx.senderId!==config.ownerId||ctx.from!==`telegram:${config.ownerId}`||
    ctx.accountId!==config.accountId||ctx.messageThreadId!==undefined||
    ctx.threadParentId!==undefined)return {text:'Commande réservée au Telegram privé d’Ivan.'};
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
    return {text:result.projected?`Décision enregistrée : ${match[2]}. Fiche Obsidian : ${result.note}.\nAucune dépense, contact ou publication autorisés par cette commande.`:`Décision enregistrée ; mise à jour Obsidian en attente (${result.error_code}). Répète la même commande pour la reprendre.`};
  }catch(error){return {text:`Dossier indisponible (${/^DOSSIER_[A-Z_]+$/.test(error.code??'')?error.code:'DOSSIER_UNAVAILABLE'}).`};}
  finally{store?.close();}
}
