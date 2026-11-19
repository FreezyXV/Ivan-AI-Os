import {DatabaseSync} from 'node:sqlite';import {mkdirSync,lstatSync,openSync,closeSync} from 'node:fs';import path from 'node:path';import {randomUUID} from 'node:crypto';
import {researchHash,researchFail,sealBundle,validateResearchAnalysis,validateResearchReport,validateResearchReview,renderResearchMessage} from './research-contract.js';
import {parisDay} from './schedule.js';
import {createRadarStore} from './radar-store.js';

export const requestedResearch = seed => seed?.origin === 'telegram-native' || seed?.origin === 'codex-qualification';
export const researchMissionId = job => job.seed.missionId ?? job.seed.parentJob ?? job.id;

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
 db.exec(`CREATE TABLE IF NOT EXISTS mission_notices(mission TEXT NOT NULL, job TEXT PRIMARY KEY,
   state TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, receipt TEXT);
   CREATE TABLE IF NOT EXISTS mission_ratings(mission TEXT PRIMARY KEY, minutes INTEGER NOT NULL, updated INTEGER NOT NULL);`);
 const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}};
 if(!db.prepare('PRAGMA table_info(jobs)').all().some(c=>c.name==='analysis'))tx(()=>{
   if(!db.prepare('PRAGMA table_info(jobs)').all().some(c=>c.name==='analysis'))db.exec('ALTER TABLE jobs ADD COLUMN analysis TEXT');
 });
 const get=id=>{const r=db.prepare('SELECT * FROM jobs WHERE id=?').get(id);return r?{...r,seed:JSON.parse(r.seed),bundle:r.bundle?JSON.parse(r.bundle):null,analysis:r.analysis?JSON.parse(r.analysis):null,draft:r.draft?JSON.parse(r.draft):null,review:r.review?JSON.parse(r.review):null,receipt:r.receipt?JSON.parse(r.receipt):null}:null;};
 const owned=(id,owner)=>{const r=get(id);if(!r||r.owner!==owner||r.expires<=now())researchFail('RESEARCH_LEASE_LOST');return r;};
 const requested = "json_extract(seed,'$.origin') IN ('telegram-native','codex-qualification')";
 const budget=({dailyLimit=12,reservedForRequests=0,priority=false,count=1}={})=>{
  if(!Number.isInteger(dailyLimit)||dailyLimit<2||dailyLimit>60||!Number.isInteger(reservedForRequests)||reservedForRequests<0||reservedForRequests>dailyLimit||![1,2].includes(count))researchFail('RESEARCH_CALL_CONFIG_INVALID');
  const day=new Date(now()).toISOString().slice(0,10);
  const spent=db.prepare(`SELECT count(*) total, count(CASE WHEN coalesce(json_extract(j.seed,'$.origin'),'')
    NOT IN ('telegram-native','codex-qualification') THEN 1 END) background
    FROM model_calls c LEFT JOIN jobs j ON j.id=c.job WHERE c.day=?`).get(day);
  return {day,total:spent.total,available:spent.total+count<=dailyLimit&&
    (priority||spent.background+count<=dailyLimit-reservedForRequests)};
 };
 const reserve=(key,stage,options)=>{
  if(!['analysis','analysis_repair','contradiction'].includes(stage))researchFail('RESEARCH_CALL_CONFIG_INVALID');
  const {day,total,available}=budget(options);
  if(!available)researchFail('RESEARCH_DAILY_MODEL_LIMIT');
  if(db.prepare('SELECT 1 FROM model_calls WHERE job=? AND stage=?').get(key,stage))researchFail('RESEARCH_CALL_ALREADY_SPENT');
  db.prepare('INSERT INTO model_calls VALUES(?,?,?,?)').run(key,stage,day,now());return total+1;
 };
 const reconcile=()=>{
  const work=db.prepare("UPDATE jobs SET state='research',error='RESEARCH_INTERRUPTED',owner=NULL,expires=NULL,updated=? WHERE state='working' AND expires<=?").run(now(),now()).changes;
  const sends=db.prepare("UPDATE jobs SET state='delivery_unknown',owner=NULL,expires=NULL,updated=? WHERE state='sending' AND expires<=?").run(now(),now()).changes;
  db.prepare("UPDATE mission_notices SET state='delivery_unknown' WHERE state='sending' AND expires<=?").run(now());
  return {interrupted:work,unknown:sends};
 };
 return {
  radar:createRadarStore(db,{now,tx,reserveModel:reserve}),
  hasModelCapacity(options){return budget(options).available;},
  reconcile(){return tx(reconcile);},
  enqueue(seed,{pendingPerTopic}={}){return tx(()=>{
   if(!seed||!['business','finance','engineering','system'].includes(seed.topic)||typeof seed.anchorUrl!=='string'||typeof seed.title!=='string'||seed.title.length>200||typeof seed.text!=='string'||seed.text.length>16000||JSON.stringify(seed).length>40000)researchFail('RESEARCH_SEED_INVALID');
   const id=researchHash([seed.topic,seed.anchorUrl,seed.revision??'v1']);
   if(db.prepare('SELECT 1 FROM jobs WHERE id=?').get(id))return {id,added:false};
   if(pendingPerTopic!==undefined&&!requestedResearch(seed)&&!seed.watchId){
    if(!Number.isInteger(pendingPerTopic)||pendingPerTopic<1||pendingPerTopic>50)researchFail('RESEARCH_QUEUE_CONFIG_INVALID');
    const n=db.prepare(`SELECT count(*) n FROM jobs WHERE state='pending' AND NOT coalesce(${requested},0)
      AND json_extract(seed,'$.watchId') IS NULL AND json_extract(seed,'$.topic')=?`).get(seed.topic).n;
    if(n>=pendingPerTopic)return {id,added:false,deferred:true};
   }
   const r=db.prepare("INSERT OR IGNORE INTO jobs(id,seed,state,created,updated) VALUES(?,?,'pending',?,?)").run(id,JSON.stringify(seed),now(),now());return {id,added:r.changes===1};
  });},
  nextRequest(){const row=db.prepare(`SELECT id FROM jobs WHERE state='pending' AND ${requested} ORDER BY created,id LIMIT 1`).get();return row?get(row.id):null;},
  retireBackground({days=7,pendingPerTopic=6}={}){return tx(()=>{
   if(!Number.isInteger(days)||days<1||days>30||!Number.isInteger(pendingPerTopic)||pendingPerTopic<1||pendingPerTopic>50)researchFail('RESEARCH_QUEUE_CONFIG_INVALID');
   const rows=db.prepare(`SELECT id,created,row_number() OVER (PARTITION BY json_extract(seed,'$.topic') ORDER BY created DESC,id) position
     FROM jobs WHERE state='pending' AND NOT coalesce(${requested},0) AND json_extract(seed,'$.watchId') IS NULL`).all();
   const change=db.prepare("UPDATE jobs SET state='expired',error=?,updated=? WHERE id=? AND state='pending'");
   let expired=0;
   for(const row of rows){
    const stale=row.created<now()-days*86400000;
    if(stale||row.position>pendingPerTopic)expired+=change.run(stale?'RESEARCH_SOURCE_STALE':'RESEARCH_BACKLOG_LIMIT',now(),row.id).changes;
   }
   return expired;
  });},
  claim({id}={}){return tx(()=>{
   if(id!==undefined&&!/^[a-f\d]{64}$/.test(id))researchFail('RESEARCH_SEED_INVALID');
   // An interrupted paid stage is visible, never silently replayed.
   reconcile();
   const r=db.prepare("SELECT j.id FROM jobs j WHERE j.state='pending' AND (? IS NULL OR j.id=?) ORDER BY CASE WHEN json_extract(j.seed,'$.origin') IN ('telegram-native','codex-qualification') THEN 0 WHEN json_extract(j.seed,'$.watchId') IS NOT NULL THEN 1 WHEN json_extract(j.seed,'$.depth')=1 THEN 2 ELSE 3 END,(SELECT count(*) FROM jobs x WHERE x.state NOT IN ('pending','expired') AND json_extract(x.seed,'$.topic')=json_extract(j.seed,'$.topic')),j.created,j.id LIMIT 1").get(id??null,id??null);if(!r)return null;
   const owner=randomUUID();db.prepare("UPDATE jobs SET state='working',owner=?,expires=?,updated=? WHERE id=?").run(owner,now()+300000,now(),r.id);return get(r.id);
  });},
  reserveCall(id,owner,stage,options={}){return tx(()=>{
   const row=owned(id,owner);return reserve(id,stage,{...options,priority:requestedResearch(row.seed)});
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
  readyRequests(){return db.prepare(`SELECT id FROM jobs WHERE state='ready' AND ${requested} ORDER BY created,id LIMIT 10`).all().map(r=>get(r.id));},
  missions(prefix=''){
   if(prefix&&!/^[a-f\d]{12}$/.test(prefix))researchFail('RESEARCH_MISSION_INVALID');
   const roots=db.prepare(`SELECT id FROM jobs WHERE ${requested} AND json_extract(seed,'$.parentJob') IS NULL
     AND json_extract(seed,'$.missionId') IS NULL AND (?!='' AND substr(id,1,12)=? OR ?='') ORDER BY created DESC,id LIMIT 10`).all(prefix,prefix,prefix);
   return roots.map(({id})=>{
    const parts=db.prepare("SELECT id FROM jobs WHERE id=? OR json_extract(seed,'$.missionId')=? OR json_extract(seed,'$.parentJob')=? ORDER BY created DESC,(id=?) ASC,rowid DESC").all(id,id,id,id);
    return {root:get(id),current:get(parts[0].id)};
   });
  },
  recordTimeSaved(prefix,minutes){
   if(!/^[a-f\d]{12}$/.test(prefix??'')||!Number.isInteger(minutes)||minutes<0||minutes>1440)researchFail('RESEARCH_MISSION_RATING_INVALID');
   const root=db.prepare("SELECT id FROM jobs WHERE json_extract(seed,'$.origin')='telegram-native' AND substr(id,1,12)=? AND json_extract(seed,'$.missionId') IS NULL").all(prefix);
   if(root.length!==1)researchFail('RESEARCH_MISSION_INVALID');
   const id=root[0].id;
   if(!db.prepare("SELECT 1 FROM jobs WHERE state='delivered' AND (id=? OR json_extract(seed,'$.missionId')=?)").get(id,id))researchFail('RESEARCH_MISSION_NOT_DELIVERED');
   db.prepare(`INSERT INTO mission_ratings VALUES(?,?,?) ON CONFLICT(mission) DO UPDATE SET minutes=excluded.minutes,updated=excluded.updated`).run(id,minutes,now());
  },
  pilotMetrics(days=14){
   if(!Number.isInteger(days)||days<1||days>30)researchFail('RESEARCH_MISSION_RATING_INVALID');
   const since=now()-days*86400000;
   const roots=db.prepare(`SELECT id,created FROM jobs WHERE created>=? AND json_extract(seed,'$.origin')='telegram-native' AND json_extract(seed,'$.missionId') IS NULL AND json_extract(seed,'$.parentJob') IS NULL`).all(since);
   const outcome=db.prepare("SELECT updated FROM jobs WHERE (id=? OR json_extract(seed,'$.missionId')=?) AND state='delivered' ORDER BY updated LIMIT 1");
   const timings=roots.flatMap(row=>{const sent=outcome.get(row.id,row.id);return sent?[sent.updated-row.created]:[];}).sort((a,b)=>a-b);
   const blocked=db.prepare("SELECT count(DISTINCT mission) n FROM mission_notices WHERE state='delivered' AND created>=? AND mission IN (SELECT id FROM jobs WHERE json_extract(seed,'$.origin')='telegram-native')").get(since).n;
   const grades=db.prepare('SELECT count(*) n,sum(minutes) minutes FROM mission_ratings WHERE updated>=?').get(since);
   const calls=db.prepare(`SELECT count(*) n FROM model_calls WHERE created>=?`).get(since).n;
   return {days,requests:roots.length,reports:timings.length,blocked,medianMinutes:timings.length?Math.round(timings[Math.floor(timings.length/2)]/60000):null,
    calls,feedback:db.prepare('SELECT count(*) n FROM radar_feedback WHERE created>=?').get(since).n,timeSavedMinutes:grades.minutes??null,ratings:grades.n};
  },
  nextNotice({after=0}={}){
   const terminal=db.prepare(`SELECT j.id FROM jobs j WHERE j.state IN ('research','rejected') AND json_extract(j.seed,'$.origin')='telegram-native'
    AND j.updated>=? AND coalesce(j.error,'')!='RESEARCH_CHOICE_SUPERSEDED'
    AND NOT EXISTS (SELECT 1 FROM jobs n WHERE json_extract(n.seed,'$.parentJob')=j.id)
    AND NOT EXISTS (SELECT 1 FROM mission_notices m WHERE m.job=j.id)
    ORDER BY j.updated,j.id LIMIT 1`).get(after);
   return terminal?get(terminal.id):null;
  },
  reserveNotice(row){return tx(()=>{
   if(!requestedResearch(row.seed)||!['research','rejected'].includes(row.state))return false;
   return db.prepare("INSERT OR IGNORE INTO mission_notices VALUES(?,?,'sending',?,?,NULL)").run(researchMissionId(row),row.id,now(),now()+120000).changes===1;
  });},
  finishNotice(row,receipt){
   const confirmed=receipt?.delivered===true&&/^[1-9]\d{0,19}$/.test(receipt.messageId??'');
   db.prepare("UPDATE mission_notices SET state=?,receipt=? WHERE mission=? AND job=? AND state='sending'").run(confirmed?'delivered':'delivery_unknown',confirmed?JSON.stringify(receipt):null,researchMissionId(row),row.id);
   return confirmed;
  },
  discovery(key){return db.prepare('SELECT * FROM discoveries WHERE key=?').get(key);},
  recordDiscovery(key,metrics){if(!/^[a-z0-9:-]{1,100}$/.test(key)||JSON.stringify(metrics).length>20000)researchFail('RESEARCH_DISCOVERY_INVALID');db.prepare('INSERT OR IGNORE INTO discoveries VALUES(?,?,?)').run(key,now(),JSON.stringify(metrics));},
  list(state,limit=30){return db.prepare('SELECT id FROM jobs WHERE state=? ORDER BY created,id LIMIT ?').all(state,limit).map(r=>get(r.id));},
  summary(){return {states:Object.fromEntries(db.prepare('SELECT state,count(*) n FROM jobs GROUP BY state').all().map(r=>[r.state,r.n])),modelCalls:db.prepare('SELECT count(*) n FROM model_calls').get().n,
   modelCallsToday:db.prepare('SELECT count(*) n FROM model_calls WHERE day=?').get(new Date(now()).toISOString().slice(0,10)).n,
   researchCallsToday:db.prepare("SELECT count(*) n FROM model_calls WHERE day=? AND job NOT LIKE 'radar:%'").get(new Date(now()).toISOString().slice(0,10)).n,
   discoveries:db.prepare('SELECT key,updated,metrics FROM discoveries ORDER BY updated DESC LIMIT 6').all().map(r=>({...r,metrics:JSON.parse(r.metrics)})),nativeCostEur:null};},
  get,close(){db.close();}
 };
}
