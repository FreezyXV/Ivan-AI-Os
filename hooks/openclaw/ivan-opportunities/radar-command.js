import {openResearchStore} from '../../../services/alerts-runtime/src/research-store.js';
import {projectRadarFeedback} from '../../../shared/radar-memory.mjs';
import {ownerDm} from './owner.js';
import {missionSummary} from '../../../services/alerts-runtime/src/mission-status.js';
import {radarPresentation} from '../../../services/alerts-runtime/src/telegram-delivery.js';
import {renderRadarPage} from '../../../services/alerts-runtime/src/radar.js';
import {readInstitutionalSnapshot} from '../../../services/alerts-runtime/src/context.js';
import {researchHash} from '../../../services/alerts-runtime/src/research-contract.js';
export async function handleRadarCommand(ctx,config,mode){
 if(!ownerDm(ctx,config))return {text:'Commande réservée au Telegram privé d’Ivan.'};
 let store;try{
  if(!config.researchDirectory)return {text:'Le radar n’est pas encore activé.'};store=openResearchStore(config.researchDirectory);
  if(mode==='follow'){
   const id=(ctx.args??'').trim();
   if(id==='bilan'){
    const b=store.pilotMetrics();
    return {text:[`Bilan des ${b.days} derniers jours`,`Demandes · ${b.requests}. Dossiers livrés · ${b.reports}. Missions avec un blocage signalé · ${b.blocked}.`,
     `Délai médian · ${b.medianMinutes===null?'mesure à venir':`${b.medianMinutes} min`}.`,
     `Avis · ${b.feedback}. Temps gagné déclaré · ${b.ratings?`${b.timeSavedMinutes} min pour ${b.ratings} missions`:'mesure à venir'}.`,
     `Tentatives de modèle réservées pour le radar et les dossiers · ${b.calls}. Coût exact indisponible.`].join('\n\n')};
   }
   if(id&&!/^[a-f\d]{12}$/.test(id))return {text:'Utilise /suivi ou /suivi suivi de l’identifiant de la mission.'};
   const missions=store.missions(id);
   return {text:missions.length?missions.map(missionSummary).join('\n\n'):'Aucune demande correspondante pour le moment.'};
  }
  if(mode==='time'){
   const match=/^([a-f\d]{12}) (\d{1,4})$/.exec((ctx.args??'').trim());
   if(!match)return {text:'Utilise /temps suivi de l’identifiant du dossier livré et du nombre de minutes gagnées.'};
   store.recordTimeSaved(match[1],Number(match[2]));
   return {text:`Temps gagné enregistré · ${match[2]} min pour ${match[1]}.`};
  }
  if(mode==='read'){
   const arg=(ctx.args??'1').trim();
   if(arg==='autres'){
    const ready=store.radar.explained().filter(r=>Date.now()-Date.parse(r.item.publishedAt)<=30*86400000);
    if(!ready.length)return {text:'Toutes les fiches prêtes ont été présentées.'};
    let rows=ready.slice(0,2);
    const options={day:new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris'}).format(new Date())};
    if(renderRadarPage(rows,options).length>2500)rows=rows.slice(0,1);
    const ids=rows.map(r=>r.id);store.radar.markPresented(ids);
    return {text:renderRadarPage(rows,options),presentation:radarPresentation(ids)};
   }
   const p=Number(arg||1),pages=store.radar.pages().filter(r=>r.state==='delivered');
   if(!Number.isInteger(p)||p<1||p>8)return {text:'Utilise /radar 2 pour relire une page ou /radar autres pour les fiches encore prêtes.'};
   const page=pages.at(-p);
   return page?{text:page.text,...(page.ids.length<=2?{presentation:radarPresentation(page.ids)}:{})}:{text:'Aucun catalogue confirmé à afficher.'};
  }
  const match=/^([a-f\d]{10})\s+(utile|inutile|creuser)(?:\s+(.{1,300}))?$/u.exec((ctx.args??'').trim());
  if(!match)return {text:'Utilise /avis ID utile, /avis ID inutile ou /avis ID creuser, avec une raison facultative.'};
  const [,id,verdict,reason='']=match,feedback=store.radar.feedback(id,verdict,reason),row=store.radar.topic(id);let queued;
  if(verdict==='creuser'){
   const source=readInstitutionalSnapshot(row.item);
   queued=store.enqueue({topic:row.item.topic,category:row.item.topic==='finance'?'macro':row.item.topic==='business'?'business':'technical',
    sourceType:'request',revision:'radar-'+id,anchorUrl:row.item.url,title:row.item.title,text:'Sujet choisi par Ivan pour vérification.',
    readAt:new Date().toISOString(),publishedAt:null,origin:'telegram-native',
    ...(source?{sources:[{...source,id:researchHash(source.url)}]}:{})});
  }
  let memory=true;try{if(config.vaultPath)projectRadarFeedback(config,row,feedback);}catch{memory=false;}
  if(queued){
   const mission=queued.id.slice(0,12);
   return {text:`${queued.added?'Recherche mise en file prioritaire':'Recherche déjà enregistrée'} · ${mission}. Je prépare les preuves, l’objection principale et un prochain pas.\n/suivi ${mission}${memory?'':'\nAvis en mémoire locale. Projection Obsidian en attente.'}`};
  }
  return {text:`Avis ${feedback.duplicate?'déjà enregistré':'enregistré'} pour ${id}. Il sera pris en compte dans le prochain classement.${memory?'':' Avis conservé en base. Projection Obsidian à vérifier.'}`};
 }catch{return {text:'Avis non appliqué ou indisponible : vérifie l’identifiant et le diagnostic local. Aucun achat ni contact exécuté.'};}finally{store?.close();}
}
