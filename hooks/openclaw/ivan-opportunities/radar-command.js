import {openResearchStore} from '../../../services/alerts-runtime/src/research-store.js';
import {projectRadarFeedback} from '../../../shared/radar-memory.mjs';
export async function handleRadarCommand(ctx,config,mode){
 if(ctx?.channel!=='telegram'||ctx.isAuthorizedSender!==true||typeof config?.ownerId!=='string'||ctx.senderId!==config.ownerId||ctx.from!==`telegram:${config.ownerId}`||ctx.accountId!==config.accountId||ctx.messageThreadId!==undefined||ctx.threadParentId!==undefined)return {text:'Commande réservée au Telegram privé d’Ivan.'};
 let store;try{
  if(!config.researchDirectory)return {text:'Le radar n’est pas encore activé.'};store=openResearchStore(config.researchDirectory);
  if(mode==='read'){const p=Number((ctx.args??'1').trim()||1),pages=store.radar.pages().filter(r=>r.state==='delivered');if(!Number.isInteger(p)||p<1||p>8)return {text:'Utilise /radar ou /radar 2 pour relire une page récente.'};return {text:pages.at(-p)?.text??'Aucun catalogue confirmé à afficher.'};}
  const match=/^([a-f\d]{10})\s+(utile|inutile|creuser)(?:\s+(.{1,300}))?$/u.exec((ctx.args??'').trim());
  if(!match)return {text:'Utilise /avis ID utile, /avis ID inutile ou /avis ID creuser, avec une raison facultative.'};
  const [,id,verdict,reason='']=match,feedback=store.radar.feedback(id,verdict,reason),row=store.radar.topic(id);let queued;
  if(verdict==='creuser')queued=store.enqueue({topic:row.item.topic,category:row.item.topic==='finance'?'macro':row.item.topic==='business'?'business':'technical',sourceType:'request',revision:'radar-'+id,anchorUrl:row.item.url,title:row.item.title,text:'Sujet choisi explicitement par Ivan ; lire les sources avant toute affirmation.',readAt:new Date().toISOString(),publishedAt:null,origin:'telegram-native'});
  let memory=true;try{if(config.vaultPath)projectRadarFeedback(config,row,feedback);}catch{memory=false;}
  return {text:`Avis ${feedback.duplicate?'déjà enregistré':'enregistré'} pour ${id}.${verdict==='creuser'?queued.added?' Recherche mise en file ; sources et objections à vérifier, dans le budget existant.':' Recherche déjà en file ou traitée ; aucun doublon.':' Les prochains classements tiendront compte de ton retour, avec une part d’exploration.'}${memory?'':' Avis conservé en base ; projection Obsidian à vérifier.'}`};
 }catch{return {text:'Avis non appliqué ou indisponible : vérifie l’identifiant et le diagnostic local. Aucun achat ni contact exécuté.'};}finally{store?.close();}
}
