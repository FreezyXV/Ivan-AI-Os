import {DatabaseSync} from 'node:sqlite';import {mkdirSync,lstatSync,openSync,closeSync} from 'node:fs';import path from 'node:path';import {randomUUID} from 'node:crypto';
import {researchHash,researchFail,sealBundle,validateResearchAnalysis,validateResearchReport,validateResearchReview,renderResearchMessage} from './research-contract.js';
import {parisDay} from './schedule.js';
export function openResearchStore(directory,{now=()=>Date.now()}={}){
 if(!path.isAbsolute(directory)||path.normalize(directory)!==directory)researchFail('RESEARCH_STORE_INVALID');
 let parent=path.parse(directory).root;for(const part of directory.slice(parent.length).split('/').filter(Boolean)){
  parent=path.join(parent,part);let s=lstatSync(parent,{throwIfNoEntry:false});if(!s){mkdirSync(parent,{mode:0o700});s=lstatSync(parent);}if(!s.isDirectory()||s.isSymbolicLink())researchFail('RESEARCH_STORE_INVALID');
 }
 const st=lstatSync(directory);if(st.uid!==process.getuid()||st.mode&0o077)researchFail('RESEARCH_STORE_INVALID');
 const file=path.join(directory,'research.sqlite');try{closeSync(openSync(file,'wx',0o600));}catch(e){if(e.code!=='EEXIST')throw e;}
 const s=lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.uid!==process.getuid()||s.mode&0o077)researchFail('RESEARCH_STORE_INVALID');
 const db=new DatabaseSync(file);db.exec(`PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,seed TEXT NOT NULL,state TEXT NOT NULL,owner TEXT,expires INTEGER,created INTEGER NOT NULL,updated INTEGER NOT NULL,bundle TEXT,draft TEXT,review TEXT,error TEXT,receipt TEXT);
 CREATE TABLE IF NOT EXISTS model_calls(job TEXT NOT NULL,stage TEXT NOT NULL,day TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(job,stage));
 CREATE TABLE IF NOT EXISTS discoveries(key TEXT PRIMARY KEY,updated INTEGER NOT NULL,metrics TEXT NOT NULL);`);
 db.exec('CREATE TABLE IF NOT EXISTS deliveries(job TEXT PRIMARY KEY,day TEXT NOT NULL,created INTEGER NOT NULL)');
 if(!db.prepare('PRAGMA table_info(jobs)').all().some(c=>c.name==='analysis'))db.exec('ALTER TABLE jobs ADD COLUMN analysis TEXT');
 const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}};
 const get=id=>{const r=db.prepare('SELECT * FROM jobs WHERE id=?').get(id);return r?{...r,seed:JSON.parse(r.seed),bundle:r.bundle?JSON.parse(r.bundle):null,analysis:r.analysis?JSON.parse(r.analysis):null,draft:r.draft?JSON.parse(r.draft):null,review:r.review?JSON.parse(r.review):null,receipt:r.receipt?JSON.parse(r.receipt):null}:null;};
 const owned=(id,owner)=>{const r=get(id);if(!r||r.owner!==owner||r.expires<=now())researchFail('RESEARCH_LEASE_LOST');return r;};
 const reconcile=()=>{
  const work=db.prepare("UPDATE jobs SET state='research',error='RESEARCH_INTERRUPTED',owner=NULL,expires=NULL,updated=? WHERE state='working' AND expires<=?").run(now(),now()).changes;
  const sends=db.prepare("UPDATE jobs SET state='delivery_unknown',owner=NULL,expires=NULL,updated=? WHERE state='sending' AND expires<=?").run(now(),now()).changes;
  return {interrupted:work,unknown:sends};
 };
 return {
  reconcile(){return tx(reconcile);},
  enqueue(seed){
   if(!seed||!['business','finance','engineering','system'].includes(seed.topic)||typeof seed.anchorUrl!=='string'||typeof seed.title!=='string'||seed.title.length>200||typeof seed.text!=='string'||seed.text.length>16000||JSON.stringify(seed).length>40000)researchFail('RESEARCH_SEED_INVALID');
   const id=researchHash([seed.topic,seed.anchorUrl,seed.revision??'v1']);
   const r=db.prepare("INSERT OR IGNORE INTO jobs(id,seed,state,created,updated) VALUES(?,?,'pending',?,?)").run(id,JSON.stringify(seed),now(),now());return {id,added:r.changes===1};
  },
  claim({id}={}){return tx(()=>{
   if(id!==undefined&&!/^[a-f\d]{64}$/.test(id))researchFail('RESEARCH_SEED_INVALID');
   // An interrupted paid stage is visible, never silently replayed.
   reconcile();
   const r=db.prepare("SELECT j.id FROM jobs j WHERE j.state='pending' AND (? IS NULL OR j.id=?) ORDER BY CASE WHEN json_extract(j.seed,'$.origin')='telegram-native' THEN 0 WHEN json_extract(j.seed,'$.depth')=1 THEN 1 ELSE 2 END,(SELECT count(*) FROM jobs x WHERE x.state!='pending' AND json_extract(x.seed,'$.topic')=json_extract(j.seed,'$.topic')),j.created,j.id LIMIT 1").get(id??null,id??null);if(!r)return null;
   const owner=randomUUID();db.prepare("UPDATE jobs SET state='working',owner=?,expires=?,updated=? WHERE id=?").run(owner,now()+300000,now(),r.id);return get(r.id);
  });},
  reserveCall(id,owner,stage,{dailyLimit=12}={}){return tx(()=>{
   owned(id,owner);if(!['analysis','contradiction'].includes(stage)||!Number.isInteger(dailyLimit)||dailyLimit<2||dailyLimit>60)researchFail('RESEARCH_CALL_CONFIG_INVALID');
   const day=new Date(now()).toISOString().slice(0,10),n=db.prepare('SELECT count(*) n FROM model_calls WHERE day=?').get(day).n;
   if(n>=dailyLimit)researchFail('RESEARCH_DAILY_MODEL_LIMIT');
   if(db.prepare('SELECT 1 FROM model_calls WHERE job=? AND stage=?').get(id,stage))researchFail('RESEARCH_CALL_ALREADY_SPENT');
   db.prepare('INSERT INTO model_calls VALUES(?,?,?,?)').run(id,stage,day,now());return n+1;
  });},
  saveBundle(id,owner,bundle){owned(id,owner);bundle=sealBundle(bundle);db.prepare('UPDATE jobs SET bundle=?,updated=? WHERE id=?').run(JSON.stringify(bundle),now(),id);},
  saveAnalysis(id,owner,analysis){const r=owned(id,owner);analysis=validateResearchAnalysis(r.bundle,analysis);db.prepare('UPDATE jobs SET analysis=?,updated=? WHERE id=?').run(JSON.stringify(analysis),now(),id);},
  saveDraft(id,owner,draft){const r=owned(id,owner);const report=validateResearchReport(r.bundle,draft);db.prepare('UPDATE jobs SET draft=?,updated=? WHERE id=?').run(JSON.stringify(report),now(),id);},
  holdReady(id,error){if(!/^RESEARCH_[A-Z_]+$/.test(error))researchFail('RESEARCH_STATE_INVALID');
   return db.prepare("UPDATE jobs SET state='research',error=?,updated=? WHERE id=? AND state='ready'").run(error,now(),id).changes;},
  finish(id,owner,{state,error,review}){const r=owned(id,owner);if(!['ready','research','rejected'].includes(state))researchFail('RESEARCH_STATE_INVALID');
   if(state==='ready'||review){validateResearchReview(r.bundle,r.draft,review);if(state==='ready'&&review.decision!=='approve')researchFail('RESEARCH_REVIEW_REQUIRED');}
   if(state==='ready')renderResearchMessage(r.bundle,r.draft,review);
   db.prepare('UPDATE jobs SET state=?,review=?,error=?,owner=NULL,expires=NULL,updated=? WHERE id=?').run(state,review?JSON.stringify(review):null,/^[A-Z_]+$/.test(error??'')?error:null,now(),id);return get(id);
  },
  beginDelivery(id,{dailyLimit=3}={}){return tx(()=>{const r=get(id);if(r?.state!=='ready')return null;
   if(!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>5)researchFail('RESEARCH_DELIVERY_CONFIG_INVALID');
   const day=parisDay(now());if(db.prepare('SELECT count(*) n FROM deliveries WHERE day=?').get(day).n>=dailyLimit)return null;
   db.prepare('INSERT INTO deliveries VALUES(?,?,?)').run(id,day,now());
   const owner=randomUUID();db.prepare("UPDATE jobs SET state='sending',owner=?,expires=?,updated=? WHERE id=?").run(owner,now()+120000,now(),id);return get(id);});},
  finishDelivery(id,owner,receipt){const r=owned(id,owner);if(r.state!=='sending')researchFail('RESEARCH_STATE_INVALID');const confirmed=receipt?.delivered===true&&/^[1-9]\d{0,19}$/.test(receipt.messageId??'');
   db.prepare('UPDATE jobs SET state=?,receipt=?,owner=NULL,expires=NULL,updated=? WHERE id=?').run(confirmed?'delivered':'delivery_unknown',confirmed?JSON.stringify(receipt):null,now(),id);return get(id);},
  discovery(key){return db.prepare('SELECT * FROM discoveries WHERE key=?').get(key);},
  recordDiscovery(key,metrics){if(!/^[a-z0-9:-]{1,100}$/.test(key)||JSON.stringify(metrics).length>20000)researchFail('RESEARCH_DISCOVERY_INVALID');db.prepare('INSERT OR IGNORE INTO discoveries VALUES(?,?,?)').run(key,now(),JSON.stringify(metrics));},
  list(state,limit=30){return db.prepare('SELECT id FROM jobs WHERE state=? ORDER BY created,id LIMIT ?').all(state,limit).map(r=>get(r.id));},
  summary(){return {states:Object.fromEntries(db.prepare('SELECT state,count(*) n FROM jobs GROUP BY state').all().map(r=>[r.state,r.n])),modelCalls:db.prepare('SELECT count(*) n FROM model_calls').get().n,
   modelCallsToday:db.prepare('SELECT count(*) n FROM model_calls WHERE day=?').get(new Date(now()).toISOString().slice(0,10)).n,
   discoveries:db.prepare('SELECT key,updated,metrics FROM discoveries ORDER BY updated DESC LIMIT 6').all().map(r=>({...r,metrics:JSON.parse(r.metrics)})),nativeCostEur:null};},
  get,close(){db.close();}
 };
}
