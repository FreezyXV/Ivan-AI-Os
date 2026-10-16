export async function handleResearchCommand(ctx,config,{now=new Date()}={}){
 if(ctx?.channel!=='telegram'||ctx.isAuthorizedSender!==true||typeof config?.ownerId!=='string'||
  ctx.senderId!==config.ownerId||ctx.from!==`telegram:${config.ownerId}`||ctx.accountId!==config.accountId||
  ctx.messageThreadId!==undefined||ctx.threadParentId!==undefined)return{text:'Commande réservée au Telegram privé d’Ivan.'};
 const match=/^(actif|macro|business|technique) (.{3,220})$/u.exec((ctx.args??'').trim());
 if(!match)return{text:'Utilise /recherche actif btc-bitcoin, /recherche macro inflation France, /recherche business <problème> ou /recherche technique <sujet>.'};
 const [,kind,query]=match;
 if(/[\x00-\x1f]|\b(?:apikey_|gh[pousr]_|sk-|Bearer\s)|\b(?:mon portefeuille|mes positions|je possède|j’ai|j'ai|holdings|wallet|iban)\b|\b[^\s]+@[^\s]+\.[a-z]{2,}\b/i.test(query))return{text:'Cette recherche utilise des données publiques seulement. Garde les avoirs et informations personnelles dans ton périmètre privé.'};
 if(kind==='actif'&&!/^[a-z0-9]{1,15}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(query))return{text:'Indique l’identifiant CoinPaprika non ambigu, par exemple btc-bitcoin ou eth-ethereum. Aucun portefeuille requis.'};
 if(!config.researchDirectory)return{text:'Le parcours de recherche à la demande n’est pas encore activé.'};
 let store;try{
  const {openResearchStore}=await import('../../../services/alerts-runtime/src/research-store.js');
  const topic={actif:'finance',macro:'finance',business:'business',technique:'engineering'}[kind],category={actif:'asset',macro:'macro',business:'business',technique:'technical'}[kind];
  const url=new URL('https://duckduckgo.com/');url.searchParams.set('q',`${kind} ${query}`);
  const at=now.toISOString();store=openResearchStore(config.researchDirectory);
  const r=store.enqueue({topic,category,sourceType:'request',revision:'request-'+at.slice(0,10),anchorUrl:url.href,title:query,text:'Demande publique d’Ivan ; ce texte n’est pas une preuve.',readAt:at,publishedAt:null,
   origin:'telegram-native',...(kind==='actif'?{asset:{id:query,name:query.split('-').slice(1).join(' ')}}:{})});
  return{text:r.added?'Recherche ajoutée : sources, analyse et avocat du diable. Secrétaire Ivan te livrera le dossier si les preuves sont suffisantes.':'Cette recherche est déjà enregistrée ; aucun doublon créé.'};
 }catch{return{text:'Recherche indisponible ; le diagnostic local doit être vérifié. Aucune opération exécutée.'};}finally{store?.close();}
}
