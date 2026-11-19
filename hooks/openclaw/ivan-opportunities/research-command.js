import {ownerDm} from './owner.js';

export async function handleResearchCommand(ctx,config,{now=new Date()}={}){
 if(!ownerDm(ctx,config))return{text:'Commande réservée au Telegram privé d’Ivan.'};
 const match=/^(actif|macro|business|technique|systeme) (.{3,180})$/u.exec((ctx.args??'').trim());
 if(!match)return{text:'Utilise /recherche actif <identifiant CoinPaprika ou ISIN>, /recherche macro <sujet>, /recherche business <problème>, /recherche technique <sujet> ou /recherche systeme <sujet>.'};
 const [,kind,query]=match;
 if(/[\x00-\x1f]|\b(?:apikey_|gh[pousr]_|sk-|Bearer\s)|\b(?:mon portefeuille|mes positions|je possède|j’ai|j'ai|holdings|wallet|iban)\b|\b[^\s]+@[^\s]+\.[a-z]{2,}\b/i.test(query))return{text:'Cette recherche utilise des données publiques seulement. Garde les avoirs et informations personnelles dans ton périmètre privé.'};
 const isin=kind==='actif'&&/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(query)?query:null;
 if(kind==='actif'&&!isin&&!/^[a-z0-9]{1,15}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(query))return{text:'Indique un identifiant CoinPaprika comme btc-bitcoin ou l’ISIN publié par l’émetteur.'};
 if(!config.researchDirectory)return{text:'Le parcours de recherche à la demande n’est pas encore activé.'};
 let store;try{
  const {openResearchStore}=await import('../../../services/alerts-runtime/src/research-store.js');
  const topic={actif:'finance',macro:'finance',business:'business',technique:'engineering',systeme:'system'}[kind],category={actif:'asset',macro:'macro',business:'business',technique:'technical',systeme:'technical'}[kind];
  const url=new URL('https://duckduckgo.com/');url.searchParams.set('q',`${kind} ${query}`);
  const at=now.toISOString();store=openResearchStore(config.researchDirectory);
  const r=store.enqueue({topic,category,sourceType:'request',revision:'request-'+at.slice(0,10),anchorUrl:url.href,title:query,text:'Demande publique d’Ivan ; ce texte n’est pas une preuve.',readAt:at,publishedAt:null,
   origin:'telegram-native',...(kind==='actif'?{asset:isin?{isin,name:isin}:{id:query,name:query.split('-').slice(1).join(' ')}}:{})});
  const id=r.id.slice(0,12);
  return{text:`${r.added?'Recherche ajoutée à la file prioritaire':'Recherche déjà enregistrée'} · ${id}. Je te répondrai avec le dossier ou la preuve qui manque.\n/suivi ${id}`};
 }catch{return{text:'Recherche indisponible ; le diagnostic local doit être vérifié. Aucune opération exécutée.'};}finally{store?.close();}
}
