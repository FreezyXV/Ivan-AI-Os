import {researchHash,researchFail} from './research-contract.js';
import {validateItem} from './context.js';import {parisDay} from './schedule.js';
import {randomUUID} from 'node:crypto';
import {RADAR_BRIEF_VERSION,sealRadarEvidence,validateRadarCards,validateRadarReview,radarEvidenceForCards} from './radar-brief.js';
// Shares the private research DB and its path checks. Reservations precede I/O.
export function createRadarStore(db,{now,tx,reserveModel}){
 db.exec(`CREATE TABLE IF NOT EXISTS radar_topics(id TEXT PRIMARY KEY,url TEXT UNIQUE NOT NULL,item TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_pages(id TEXT PRIMARY KEY,day TEXT NOT NULL,ids TEXT NOT NULL,text TEXT NOT NULL,state TEXT NOT NULL,expires INTEGER NOT NULL,receipt TEXT,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_sent(topic TEXT PRIMARY KEY,page TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_presented(topic TEXT PRIMARY KEY,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_feedback(seq INTEGER PRIMARY KEY AUTOINCREMENT,topic TEXT NOT NULL,verdict TEXT NOT NULL,reason TEXT NOT NULL,origin TEXT NOT NULL,created INTEGER NOT NULL);`);
 db.exec(`CREATE TABLE IF NOT EXISTS radar_preparations(id TEXT PRIMARY KEY,ids TEXT NOT NULL,version TEXT NOT NULL,state TEXT NOT NULL,owner TEXT NOT NULL,expires INTEGER NOT NULL,evidence TEXT,cards TEXT,review TEXT,error TEXT,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_prepared_topics(topic TEXT NOT NULL,version TEXT NOT NULL,batch TEXT NOT NULL,
   attempts INTEGER NOT NULL DEFAULT 1,retry_at INTEGER,PRIMARY KEY(topic,version));`);
 const columns=()=>new Set(db.prepare('PRAGMA table_info(radar_prepared_topics)').all().map(column=>column.name));
 if(!columns().has('retry_at'))tx(()=>{
   const installed=columns();
   if(!installed.has('attempts'))db.exec('ALTER TABLE radar_prepared_topics ADD COLUMN attempts INTEGER NOT NULL DEFAULT 1');
   if(!installed.has('retry_at'))db.exec('ALTER TABLE radar_prepared_topics ADD COLUMN retry_at INTEGER');
 });
 const topic=id=>{const row=db.prepare('SELECT * FROM radar_topics WHERE id=?').get(id);return row?{...row,item:JSON.parse(row.item)}:null;};
 const pages=()=>db.prepare('SELECT * FROM radar_pages ORDER BY created,id').all().map(r=>({...r,ids:JSON.parse(r.ids),receipt:r.receipt?JSON.parse(r.receipt):null}));
 const feedbackHistory=id=>db.prepare('SELECT * FROM radar_feedback WHERE topic=? ORDER BY seq').all(id);
 const preparation=id=>{const r=db.prepare('SELECT * FROM radar_preparations WHERE id=?').get(id);return r?{...r,ids:JSON.parse(r.ids),evidence:r.evidence?JSON.parse(r.evidence):null,cards:r.cards?JSON.parse(r.cards):null,review:r.review?JSON.parse(r.review):null}:null;};
 const own=(id,owner)=>{const r=preparation(id);if(r?.state!=='working'||r.owner!==owner||r.expires<=now())researchFail('RESEARCH_RADAR_PREPARATION_LEASE_LOST');return r;};
 return {
  preparable(){return db.prepare(`SELECT t.id FROM radar_topics t LEFT JOIN radar_prepared_topics p ON p.topic=t.id AND p.version=?
   WHERE NOT EXISTS(SELECT 1 FROM radar_sent WHERE topic=t.id) AND (p.topic IS NULL OR (p.attempts<2 AND p.retry_at<=?))`).all(RADAR_BRIEF_VERSION,now()).map(r=>topic(r.id));},
  beginPreparation(ids){return tx(()=>{
   if(!Array.isArray(ids)||!ids.length||ids.length>4||new Set(ids).size!==ids.length||ids.some(id=>!topic(id)))researchFail('RESEARCH_RADAR_PREPARATION_INVALID');
   if(ids.some(id=>db.prepare('SELECT 1 FROM radar_sent WHERE topic=?').get(id)))return null;
   const existing=db.prepare('SELECT attempts,retry_at FROM radar_prepared_topics WHERE topic=? AND version=?');
   const attempts=ids.map(id=>existing.get(id,RADAR_BRIEF_VERSION));
   if(attempts.some(row=>row&&(row.attempts>=2||row.retry_at===null||row.retry_at>now())))return null;
   const id=researchHash([RADAR_BRIEF_VERSION,ids,attempts.map(row=>(row?.attempts??0)+1)]),owner=randomUUID();
   db.prepare("INSERT INTO radar_preparations VALUES(?,?,?,'working',?,?,NULL,NULL,NULL,NULL,?)").run(id,JSON.stringify(ids),RADAR_BRIEF_VERSION,owner,now()+300000,now());
   const claim=db.prepare(`INSERT INTO radar_prepared_topics(topic,version,batch) VALUES(?,?,?)
    ON CONFLICT(topic,version) DO UPDATE SET batch=excluded.batch,attempts=attempts+1,retry_at=NULL`);
   for(const topic of ids)claim.run(topic,RADAR_BRIEF_VERSION,id);
   return preparation(id);
  });},
  saveEvidence(id,owner,evidence){own(id,owner);evidence=sealRadarEvidence(evidence.items);db.prepare('UPDATE radar_preparations SET evidence=? WHERE id=?').run(JSON.stringify(evidence),id);},
  saveCards(id,owner,cards){const r=own(id,owner);cards=validateRadarCards(radarEvidenceForCards(r.evidence,cards),cards);db.prepare('UPDATE radar_preparations SET cards=? WHERE id=?').run(JSON.stringify(cards),id);},
  reserveModelCall(id,owner,stage,options){return tx(()=>{own(id,owner);return reserveModel('radar:'+id,stage,options);});},
  finishPreparation(id,owner,{review,error,retry=[]}={}){return tx(()=>{const r=own(id,owner);
   if(review)review=validateRadarReview(radarEvidenceForCards(r.evidence,r.cards),r.cards,review);
   if(error&&!/^RESEARCH_[A-Z_]+$/.test(error))researchFail('RESEARCH_RADAR_PREPARATION_INVALID');
   db.prepare('UPDATE radar_preparations SET state=?,review=?,error=? WHERE id=?').run(review?.items.some(i=>i.decision==='approve')?'ready':'held',review?JSON.stringify(review):null,error??null,id);
   const defer=db.prepare('UPDATE radar_prepared_topics SET retry_at=? WHERE topic=? AND batch=? AND attempts<2');
   for(const topic of new Set(retry))if(r.ids.includes(topic)&&!review?.items.some(i=>i.id===topic&&i.decision==='approve'))defer.run(now()+3600000,topic,id);
   return preparation(id);
  });},
  explained(){const out=[];for(const r of db.prepare("SELECT id FROM radar_preparations WHERE state='ready' AND version=? ORDER BY created,id").all(RADAR_BRIEF_VERSION)){
   const p=preparation(r.id),evidence=radarEvidenceForCards(p.evidence,p.cards);
   validateRadarReview(evidence,p.cards,p.review);
   for(const card of p.cards)if(p.review.items.find(i=>i.id===card.id)?.decision==='approve'&&!db.prepare('SELECT 1 FROM radar_sent WHERE topic=? UNION ALL SELECT 1 FROM radar_presented WHERE topic=?').get(card.id,card.id))out.push({...topic(card.id),explanation:{evidence,cards:p.cards,review:p.review,card}});
  }return out;},
  markPresented(ids){return tx(()=>{const insert=db.prepare('INSERT OR IGNORE INTO radar_presented VALUES(?,?)');for(const id of ids)if(topic(id))insert.run(id,now());});},
  preparation,
  register(raw){const item=validateItem(raw),id=researchHash(item.url).slice(0,10),old=topic(id);if(old&&old.url!==item.url)researchFail('RESEARCH_RADAR_ID_CONFLICT');
   db.prepare('INSERT OR IGNORE INTO radar_topics VALUES(?,?,?,?)').run(id,item.url,JSON.stringify(item),now());
   // A sent page is immutable; evidence may improve only before presentation.
   db.prepare('UPDATE radar_topics SET item=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM radar_sent WHERE topic=?)').run(JSON.stringify(item),id,id);return id;},
  topics(){return db.prepare('SELECT id FROM radar_topics ORDER BY created,id').all().map(r=>topic(r.id));},
  unseen(){return db.prepare('SELECT id FROM radar_topics WHERE NOT EXISTS(SELECT 1 FROM radar_sent WHERE topic=id) ORDER BY created,id').all().map(r=>topic(r.id));},
  reserve(ids,text,{limit=20}={}){return tx(()=>{
   if(!Array.isArray(ids)||!ids.length||ids.length>5||new Set(ids).size!==ids.length||typeof text!=='string'||text.length>2500||!Number.isInteger(limit)||limit<1||limit>40)researchFail('RESEARCH_RADAR_PAGE_INVALID');
   const day=parisDay(now()),spent=db.prepare('SELECT count(*) n FROM radar_sent JOIN radar_pages p ON p.id=page WHERE p.day=?').get(day).n;
   if(spent+ids.length>limit||ids.some(id=>!topic(id)||db.prepare('SELECT 1 FROM radar_sent WHERE topic=? UNION ALL SELECT 1 FROM radar_presented WHERE topic=?').get(id,id)))return null;
   const id=researchHash([day,ids,text]).slice(0,16);db.prepare("INSERT INTO radar_pages VALUES(?,?,?,?,'sending',?,NULL,?)").run(id,day,JSON.stringify(ids),text,now()+120000,now());
   for(const item of ids)db.prepare('INSERT INTO radar_sent VALUES(?,?)').run(item,id);return {id,ids,text};
  });},
  finish(id,receipt){return tx(()=>{const row=db.prepare('SELECT * FROM radar_pages WHERE id=?').get(id);if(row?.state!=='sending')researchFail('RESEARCH_RADAR_PAGE_STATE');
   const confirmed=receipt?.delivered===true&&/^[1-9]\d{0,19}$/.test(receipt.messageId??''),state=confirmed?'delivered':'unknown';
   db.prepare('UPDATE radar_pages SET state=?,receipt=? WHERE id=?').run(state,confirmed?JSON.stringify({delivered:true,messageId:receipt.messageId}):null,id);return {id,state};
  });},
  reconcile(){db.prepare("UPDATE radar_preparations SET state='interrupted',error='RESEARCH_INTERRUPTED' WHERE state='working' AND expires<=?").run(now());return db.prepare("UPDATE radar_pages SET state='unknown' WHERE state='sending' AND expires<=?").run(now()).changes;},
  feedback(id,verdict,reason='',origin='telegram-native'){
   if(!topic(id)||!['utile','inutile','creuser'].includes(verdict)||!['telegram-native','codex-explicit-user'].includes(origin)||typeof reason!=='string'||reason.length>300||/[\x00-\x1f\x7f]|apikey_|Bearer\s|-----BEGIN|\b(?:sk-|gh[pousr]_)[\w-]{16,}/i.test(reason))researchFail('RESEARCH_RADAR_FEEDBACK_INVALID');
   if(!db.prepare('SELECT 1 FROM radar_sent WHERE topic=? UNION ALL SELECT 1 FROM radar_presented WHERE topic=?').get(id,id))researchFail('RESEARCH_RADAR_NOT_PRESENTED');
   return tx(()=>{const last=feedbackHistory(id).at(-1);if(last?.verdict===verdict&&last.reason===reason.trim())return {...last,duplicate:true};
    const result=db.prepare('INSERT INTO radar_feedback(topic,verdict,reason,origin,created) VALUES(?,?,?,?,?)').run(id,verdict,reason.trim(),origin,now());return {...feedbackHistory(id).at(-1),seq:Number(result.lastInsertRowid),duplicate:false};});
  },
  preferences(){return db.prepare('SELECT f.*,t.item FROM radar_feedback f JOIN radar_topics t ON t.id=f.topic WHERE f.seq=(SELECT max(seq) FROM radar_feedback x WHERE x.topic=f.topic) ORDER BY f.seq DESC LIMIT 100').all().map(r=>({...r,item:JSON.parse(r.item)}));},
  feedbackHistory,topic,pages,
  summary(){return {topicsToday:db.prepare('SELECT count(*) n FROM radar_sent JOIN radar_pages p ON p.id=page WHERE p.day=?').get(parisDay(now())).n,
   pages:Object.fromEntries(db.prepare('SELECT state,count(*) n FROM radar_pages GROUP BY state').all().map(r=>[r.state,r.n])),unknown:db.prepare("SELECT count(*) n FROM radar_pages WHERE state='unknown'").get().n,
   feedback:db.prepare('SELECT count(*) n FROM radar_feedback').get().n,preferences:db.prepare('SELECT count(DISTINCT topic) n FROM radar_feedback').get().n,
   preparations:db.prepare('SELECT state,count(*) n FROM radar_preparations GROUP BY state').all(),
   preparationErrors:db.prepare('SELECT error,count(*) n FROM radar_preparations WHERE error IS NOT NULL GROUP BY error').all(),
   reviewIssues:db.prepare("SELECT j.value code,count(*) n FROM radar_preparations p,json_each(p.review,'$.items') i,json_each(i.value,'$.issues') j GROUP BY j.value").all(),
   nativeCalls:db.prepare("SELECT count(*) n FROM model_calls WHERE job LIKE 'radar:%'").get().n};}
 };
}
