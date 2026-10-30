import {researchHash,researchFail} from './research-contract.js';
import {validateItem} from './context.js';import {parisDay} from './schedule.js';
// Shares the private research DB and its path checks. Reservations precede I/O.
export function createRadarStore(db,{now,tx}){
 db.exec(`CREATE TABLE IF NOT EXISTS radar_topics(id TEXT PRIMARY KEY,url TEXT UNIQUE NOT NULL,item TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_pages(id TEXT PRIMARY KEY,day TEXT NOT NULL,ids TEXT NOT NULL,text TEXT NOT NULL,state TEXT NOT NULL,expires INTEGER NOT NULL,receipt TEXT,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_sent(topic TEXT PRIMARY KEY,page TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS radar_feedback(seq INTEGER PRIMARY KEY AUTOINCREMENT,topic TEXT NOT NULL,verdict TEXT NOT NULL,reason TEXT NOT NULL,origin TEXT NOT NULL,created INTEGER NOT NULL);`);
 const topic=id=>{const row=db.prepare('SELECT * FROM radar_topics WHERE id=?').get(id);return row?{...row,item:JSON.parse(row.item)}:null;};
 const pages=()=>db.prepare('SELECT * FROM radar_pages ORDER BY created,id').all().map(r=>({...r,ids:JSON.parse(r.ids),receipt:r.receipt?JSON.parse(r.receipt):null}));
 const feedbackHistory=id=>db.prepare('SELECT * FROM radar_feedback WHERE topic=? ORDER BY seq').all(id);
 return {
  register(raw){const item=validateItem(raw),id=researchHash(item.url).slice(0,10),old=topic(id);if(old&&old.url!==item.url)researchFail('RESEARCH_RADAR_ID_CONFLICT');
   db.prepare('INSERT OR IGNORE INTO radar_topics VALUES(?,?,?,?)').run(id,item.url,JSON.stringify(item),now());
   // A sent page is immutable; evidence may improve only before presentation.
   db.prepare('UPDATE radar_topics SET item=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM radar_sent WHERE topic=?)').run(JSON.stringify(item),id,id);return id;},
  topics(){return db.prepare('SELECT id FROM radar_topics ORDER BY created,id').all().map(r=>topic(r.id));},
  unseen(){return db.prepare('SELECT id FROM radar_topics WHERE NOT EXISTS(SELECT 1 FROM radar_sent WHERE topic=id) ORDER BY created,id').all().map(r=>topic(r.id));},
  reserve(ids,text,{limit=20}={}){return tx(()=>{
   if(!Array.isArray(ids)||!ids.length||ids.length>5||new Set(ids).size!==ids.length||typeof text!=='string'||text.length>2500||!Number.isInteger(limit)||limit<1||limit>40)researchFail('RESEARCH_RADAR_PAGE_INVALID');
   const day=parisDay(now()),spent=db.prepare('SELECT count(*) n FROM radar_sent JOIN radar_pages p ON p.id=page WHERE p.day=?').get(day).n;
   if(spent+ids.length>limit||ids.some(id=>!topic(id)||db.prepare('SELECT 1 FROM radar_sent WHERE topic=?').get(id)))return null;
   const id=researchHash([day,ids,text]).slice(0,16);db.prepare("INSERT INTO radar_pages VALUES(?,?,?,?,'sending',?,NULL,?)").run(id,day,JSON.stringify(ids),text,now()+120000,now());
   for(const item of ids)db.prepare('INSERT INTO radar_sent VALUES(?,?)').run(item,id);return {id,ids,text};
  });},
  finish(id,receipt){return tx(()=>{const row=db.prepare('SELECT * FROM radar_pages WHERE id=?').get(id);if(row?.state!=='sending')researchFail('RESEARCH_RADAR_PAGE_STATE');
   const confirmed=receipt?.delivered===true&&/^[1-9]\d{0,19}$/.test(receipt.messageId??''),state=confirmed?'delivered':'unknown';
   db.prepare('UPDATE radar_pages SET state=?,receipt=? WHERE id=?').run(state,confirmed?JSON.stringify({delivered:true,messageId:receipt.messageId}):null,id);return {id,state};
  });},
  reconcile(){return db.prepare("UPDATE radar_pages SET state='unknown' WHERE state='sending' AND expires<=?").run(now()).changes;},
  feedback(id,verdict,reason='',origin='telegram-native'){
   if(!topic(id)||!['utile','inutile','creuser'].includes(verdict)||!['telegram-native','codex-explicit-user'].includes(origin)||typeof reason!=='string'||reason.length>300||/[\x00-\x1f\x7f]|apikey_|Bearer\s|-----BEGIN|\b(?:sk-|gh[pousr]_)[\w-]{16,}/i.test(reason))researchFail('RESEARCH_RADAR_FEEDBACK_INVALID');
   if(!db.prepare('SELECT 1 FROM radar_sent WHERE topic=?').get(id))researchFail('RESEARCH_RADAR_NOT_PRESENTED');
   return tx(()=>{const last=feedbackHistory(id).at(-1);if(last?.verdict===verdict&&last.reason===reason.trim())return {...last,duplicate:true};
    const result=db.prepare('INSERT INTO radar_feedback(topic,verdict,reason,origin,created) VALUES(?,?,?,?,?)').run(id,verdict,reason.trim(),origin,now());return {...feedbackHistory(id).at(-1),seq:Number(result.lastInsertRowid),duplicate:false};});
  },
  preferences(){return db.prepare('SELECT f.*,t.item FROM radar_feedback f JOIN radar_topics t ON t.id=f.topic WHERE f.seq=(SELECT max(seq) FROM radar_feedback x WHERE x.topic=f.topic) ORDER BY f.seq DESC LIMIT 100').all().map(r=>({...r,item:JSON.parse(r.item)}));},
  feedbackHistory,topic,pages,
  summary(){return {topicsToday:db.prepare('SELECT count(*) n FROM radar_sent JOIN radar_pages p ON p.id=page WHERE p.day=?').get(parisDay(now())).n,
   pages:Object.fromEntries(db.prepare('SELECT state,count(*) n FROM radar_pages GROUP BY state').all().map(r=>[r.state,r.n])),unknown:db.prepare("SELECT count(*) n FROM radar_pages WHERE state='unknown'").get().n,
   feedback:db.prepare('SELECT count(*) n FROM radar_feedback').get().n,preferences:db.prepare('SELECT count(DISTINCT topic) n FROM radar_feedback').get().n};}
 };
}
