import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, lstatSync, openSync, closeSync, readFileSync, writeFileSync, linkSync, unlinkSync } from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import path from 'node:path';
import { validateItem, prefilter, fail, PILOT_CONTEXT } from './context.js';
import {validateBusinessFiche} from './business-fiche.js';

// SQLite owns transaction locks: process crashes cannot leave an application
// lock file blocking all producers. Provider calls occur outside transactions.
const terminal="'delivered','skipped','expired_unsent'";
const structuralReadFailures=new Set(['PUBLIC_SOURCE_TOO_LARGE','PUBLIC_SOURCE_DATE_UNVERIFIED',
  'PUBLIC_SOURCE_DATE_INVALID','PUBLIC_SOURCE_CONTENT_UNAVAILABLE','PUBLIC_SOURCE_INPUT_INVALID',
  'PUBLIC_SOURCE_REDIRECT_REFUSED','PUBLIC_SOURCE_UNSUPPORTED','ALERT_SOURCE_EVIDENCE_INVALID']);
const fingerprint=item=>item.sourceStatus==='read'?createHash('sha256').update(JSON.stringify([
  item.topic,item.publishedAt.slice(0,10),item.title.normalize('NFKC').replace(/\s+/g,' ').trim(),
  item.excerpt])).digest('hex'):null;
// v2 (Claude K07-2): the same page read by two producers whose feed titles or topics
// differ. Host + publication day + normalized excerpt; only for substantial excerpts,
// so generic chrome ("Subscribe…") is never treated as proof of the same article.
const normalizedEvidence=text=>text.normalize('NFKC').replace(/[\u2018\u2019\u02bc]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\s+/g,' ').trim();
const evidenceKeys=item=>{
  const v1=fingerprint(item);if(!v1)return [];
  const text=normalizedEvidence(item.excerpt);
  const route=PILOT_CONTEXT.deferred.includes(item.topic)?'deferred:'+item.topic:'active';
  return text.length<200?[v1]:[v1,'v3:'+createHash('sha256').update(JSON.stringify([route,new URL(item.url).hostname,item.publishedAt.slice(0,10),text])).digest('hex')];
};
export function openLedger(filename, { now = () => Date.now(), leaseMs = 120000, capacity=10000 } = {}) {
  if (!path.isAbsolute(filename) || !Number.isSafeInteger(leaseMs) || leaseMs < 1000 || !Number.isInteger(capacity)||capacity<1||capacity>10000) fail('ALERT_LEDGER_CONFIG_INVALID');
  const directory=path.dirname(filename);mkdirSync(directory,{recursive:true,mode:0o700});
  const safe=(s,dir=false)=>(dir?s.isDirectory():s.isFile()&&s.nlink===1)&&!s.isSymbolicLink()&&s.uid===process.getuid?.()&&!(s.mode&0o077);
  if(!safe(lstatSync(directory),true))fail('ALERT_LEDGER_UNAVAILABLE');
  try { closeSync(openSync(filename,'wx',0o600)); }catch(e){if(e.code!=='EEXIST')throw e;}
  if(!safe(lstatSync(filename)))fail('ALERT_LEDGER_UNAVAILABLE');
  const db=new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS alerts(id TEXT PRIMARY KEY,url TEXT UNIQUE NOT NULL,item TEXT NOT NULL,state TEXT NOT NULL,
      owner TEXT,expires INTEGER,created INTEGER NOT NULL,updated INTEGER NOT NULL,brief TEXT,reason TEXT,receipt TEXT);
    CREATE INDEX IF NOT EXISTS alert_state ON alerts(state,created);
    CREATE TABLE IF NOT EXISTS cycles(key TEXT PRIMARY KEY,name TEXT NOT NULL,status TEXT NOT NULL,
      owner TEXT,expires INTEGER,attempts INTEGER NOT NULL,updated INTEGER NOT NULL,metrics TEXT);
    CREATE TABLE IF NOT EXISTS digests(key TEXT PRIMARY KEY,ids TEXT NOT NULL,text TEXT NOT NULL,
      owner TEXT NOT NULL,state TEXT NOT NULL,expires INTEGER,updated INTEGER NOT NULL,receipt TEXT);
    CREATE TABLE IF NOT EXISTS evidence_revisions(id TEXT NOT NULL,revision TEXT NOT NULL,item TEXT NOT NULL,
      brief TEXT,reason TEXT,updated INTEGER NOT NULL,PRIMARY KEY(id,revision));
    CREATE TABLE IF NOT EXISTS evidence_keys(key TEXT PRIMARY KEY,id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS business_fiches(id TEXT PRIMARY KEY,fiche TEXT NOT NULL,score TEXT,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS source_read_failures(id TEXT PRIMARY KEY,revision TEXT NOT NULL,
      code TEXT NOT NULL,attempts INTEGER NOT NULL,updated INTEGER NOT NULL,next_attempt INTEGER);`);
  if(!db.prepare('PRAGMA table_info(alerts)').all().some(c=>c.name==='retries'))db.exec('ALTER TABLE alerts ADD COLUMN retries INTEGER NOT NULL DEFAULT 0');
  if(!db.prepare('PRAGMA table_info(alerts)').all().some(c=>c.name==='archive'))db.exec('ALTER TABLE alerts ADD COLUMN archive TEXT');
  const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}};
  const get=id=>{const r=db.prepare('SELECT * FROM alerts WHERE id=?').get(id);if(!r)return null;
    let original=r,archive=null;
    if(r.archive)try{
      archive=JSON.parse(r.archive);
      if(!/^[a-f\d]{64}\.json\.gz$/.test(archive.filename)||!(/^[a-f\d]{64}$/).test(archive.sha256))throw Error();
      const file=path.join(directory,'archive',archive.filename);
      if(!safe(lstatSync(path.dirname(file)),true)||!safe(lstatSync(file))||lstatSync(file).size>1000000)throw Error();
      const bytes=readFileSync(file);if(createHash('sha256').update(bytes).digest('hex')!==archive.sha256)throw Error();
      original=JSON.parse(gunzipSync(bytes,{maxOutputLength:1000000})).row;
      if(original.id!==r.id||original.url!==r.url||original.state!==r.state)throw Error();
    }catch{fail('ALERT_ARCHIVE_UNAVAILABLE');}
    return {...r,item:JSON.parse(original.item),brief:original.brief?JSON.parse(original.brief):null,receipt:r.receipt?JSON.parse(r.receipt):null,archive};};
  // Backfill only read evidence on upgrade; URL identity and old receipts stay intact.
  const equivalentOf=keys=>{for(const key of keys){const row=db.prepare('SELECT id FROM evidence_keys WHERE key=?').get(key);if(row)return row;}return null;};
  const remember=(keys,id)=>{for(const key of keys)db.prepare('INSERT OR IGNORE INTO evidence_keys VALUES(?,?)').run(key,id);};
  for(const row of db.prepare('SELECT id,item FROM alerts WHERE archive IS NULL').all())remember(evidenceKeys(JSON.parse(row.item)),row.id);
  const owned=(id,owner,state)=>{const r=get(id);if(!r||r.state!==state||r.owner!==owner)fail('ALERT_LEASE_LOST');return r;};
  return {
    sourceReadStatus(id,{revision,at=now()}={}){
      if(!/^[a-f\d]{64}$/.test(revision??'')||!Number.isSafeInteger(at))fail('ALERT_READER_RETRY_INVALID');
      const row=db.prepare('SELECT * FROM source_read_failures WHERE id=? AND revision=?').get(id,revision);
      if(!row)return {allowed:true};
      if(row.next_attempt===null)return {allowed:false,reason:'SOURCE_READER_BLOCKED',code:row.code};
      if(row.attempts>=3)return {allowed:false,reason:'SOURCE_READER_RETRIES_EXHAUSTED',code:row.code};
      return row.next_attempt>at?{allowed:false,reason:'SOURCE_READER_RETRY_PENDING',code:row.code}:{allowed:true};
    },
    recordSourceReadFailure(id,{revision,code,at=now()}={}){
      if(!/^[a-f\d]{64}$/.test(revision??'')||!Number.isSafeInteger(at)||
         !/^(?:PUBLIC_SOURCE_|ALERT_SOURCE_|SOURCE_READ_)[A-Z_]{1,40}$/.test(code??''))fail('ALERT_READER_RETRY_INVALID');
      return tx(()=>{
        const row=db.prepare('SELECT state,item,reason FROM alerts WHERE id=?').get(id);
        if(!row||JSON.parse(row.item).sourceStatus==='read'||
           !(row.state==='pending'||(row.state==='review'&&row.reason==='SOURCE_NOT_READ')))return false;
        const prior=db.prepare('SELECT attempts FROM source_read_failures WHERE id=? AND revision=?').get(id,revision);
        const attempts=(prior?.attempts??0)+1;
        const next=structuralReadFailures.has(code)?null:at+(attempts===1?1800000:7200000);
        db.prepare(`INSERT INTO source_read_failures VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
          revision=excluded.revision,code=excluded.code,attempts=excluded.attempts,
          updated=excluded.updated,next_attempt=excluded.next_attempt`).run(id,revision,code,attempts,at,next);
        return true;
      });
    },
    sourceReadFailures(){return db.prepare(`SELECT f.code,count(*) AS n FROM source_read_failures f
      JOIN alerts a ON a.id=f.id WHERE a.archive IS NULL AND
      (a.state='pending' OR (a.state='review' AND a.reason='SOURCE_NOT_READ'))
      AND json_extract(a.item,'$.sourceStatus')='title-only' GROUP BY f.code`).all();},
    unreadCandidates(limit=100,{revision,at=now()}={}){
      if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(at)||
         (revision!==undefined&&!/^[a-f\d]{64}$/.test(revision)))fail('ALERT_RESULT_INVALID');
      // Apply the retry gate BEFORE LIMIT; blocked rows cannot hide an eligible older page.
      return db.prepare(`SELECT a.item FROM alerts a LEFT JOIN source_read_failures f ON f.id=a.id
        WHERE a.archive IS NULL AND (a.state='pending' OR (a.state='review' AND a.reason='SOURCE_NOT_READ'))
        AND json_extract(a.item,'$.producer')='sentinelle' AND json_extract(a.item,'$.sourceStatus')='title-only'
        AND (? IS NULL OR f.id IS NULL OR f.revision<>? OR (f.next_attempt<=? AND f.attempts<3))
        ORDER BY json_extract(a.item,'$.publishedAt') DESC,a.id LIMIT ?`)
        .all(revision??null,revision??null,at,limit).map(r=>JSON.parse(r.item));
    },
    ingest(raw){const item=validateItem(raw),id=createHash('sha256').update(item.url).digest('hex');return tx(()=>{
      // A tombstone suffices to suppress a replay, even if an archive disk is
      // temporarily unavailable. Never reopen a delivered source to reconstruct it.
      const tombstone=db.prepare('SELECT state FROM alerts WHERE id=? AND archive IS NOT NULL').get(id);
      if(tombstone)return {id,duplicate:true,state:tombstone.state};
      const prior=get(id);if(prior){
        // A feed-only record must be able to acquire actual page evidence later.
        // Never alter a lease, an evaluated read source or an attempted send.
        if(prior.item.sourceStatus!=='read'&&item.sourceStatus==='read'&&
           (prior.state==='pending'||(prior.state==='review'&&prior.reason==='SOURCE_NOT_READ'))){
          db.prepare('DELETE FROM source_read_failures WHERE id=?').run(id);
          const keys=evidenceKeys(item),equivalent=equivalentOf(keys);
          if(equivalent&&equivalent.id!==id){
            db.prepare("UPDATE alerts SET item=?,state='skipped',reason='DUPLICATE_EVIDENCE',brief=?,updated=? WHERE id=?")
              .run(JSON.stringify(item),JSON.stringify({duplicateOf:equivalent.id}),now(),id);
            return {id:equivalent.id,duplicate:true,state:db.prepare('SELECT state FROM alerts WHERE id=?').get(equivalent.id).state,deduplication:'read-evidence'};
          }
          db.prepare("UPDATE alerts SET item=?,state='pending',reason=NULL,brief=NULL,updated=? WHERE id=?")
            .run(JSON.stringify(item),now(),id);
          remember(keys,id);
          return {id,duplicate:true,state:'pending',evidenceUpdated:true};
        }
        return {id,duplicate:true,state:prior.state};
      }
      const keys=evidenceKeys(item),equivalent=equivalentOf(keys);
      if(equivalent){const row=db.prepare('SELECT state FROM alerts WHERE id=?').get(equivalent.id);
        if(row)return {id:equivalent.id,duplicate:true,state:row.state,deduplication:'read-evidence'};}
      if(db.prepare(`SELECT count(*) AS n FROM alerts WHERE state NOT IN (${terminal})`).get().n>=capacity)fail('ALERT_QUEUE_FULL');
      const at=now();db.prepare("INSERT INTO alerts(id,url,item,state,created,updated) VALUES(?,?,?,'pending',?,?)").run(id,item.url,JSON.stringify(item),at,at);
      remember(keys,id);
      return {id,duplicate:false,state:'pending'};
    });},
    claim(){return tx(()=>{
      const at=now(),r=db.prepare("SELECT id FROM alerts WHERE state='pending' OR (state='processing' AND expires<=?) ORDER BY created,id LIMIT 1").get(at);
      if(!r)return null;const owner=randomUUID();db.prepare("UPDATE alerts SET state='processing',owner=?,expires=?,updated=? WHERE id=?").run(owner,at+leaseMs,at,r.id);return get(r.id);
    });},
    finish(id,owner,{state,reason,brief=null}){if(!['skipped','review','ready'].includes(state)||!(/^[A-Z_]{1,64}$/).test(reason)||
      (state==='ready'&&(typeof brief?.message!=='string'||!brief.message.trim()||brief.message.length>2500)))fail('ALERT_RESULT_INVALID');
      return tx(()=>{const r=owned(id,owner,'processing');if(r.expires<=now())fail('ALERT_LEASE_LOST');
        if(state==='ready'&&brief?.business_fiche){
          if(brief.goal!=='business')fail('ALERT_BUSINESS_FICHE_INVALID');
          const checked=validateBusinessFiche(r.item,brief.business_fiche);
          brief={...brief,businessEditorialWarnings:checked.editorialWarnings};
          db.prepare('INSERT OR IGNORE INTO business_fiches VALUES(?,?,?,?)').run(id,JSON.stringify(checked.fiche),checked.score?JSON.stringify(checked.score):null,now());
        }
        db.prepare('UPDATE alerts SET state=?,reason=?,brief=?,owner=NULL,expires=NULL,updated=? WHERE id=?').run(state,reason,brief?JSON.stringify(brief):null,now(),id);return get(id);});},
    businessFiches(limit=20){if(!Number.isInteger(limit)||limit<1||limit>100)fail('ALERT_RESULT_INVALID');
      return db.prepare('SELECT * FROM business_fiches ORDER BY created DESC,id LIMIT ?').all(limit).map(r=>({...r,fiche:JSON.parse(r.fiche),score:r.score?JSON.parse(r.score):null}));},
    businessSummary(){const r=db.prepare('SELECT count(*) AS fiches,sum(score IS NOT NULL) AS scored FROM business_fiches').get();
      return {validatedFiches:r.fiches,scoredFiches:r.scored??0};},
    beginDelivery(id){return tx(()=>{const r=get(id);if(!r||r.state!=='ready')return null;const owner=randomUUID();
      db.prepare("UPDATE alerts SET state='sending',owner=?,expires=?,updated=? WHERE id=?").run(owner,now()+leaseMs,now(),id);return get(id);});},
    finishDelivery(id,owner,receipt){return tx(()=>{owned(id,owner,'sending');
      const confirmed=receipt?.delivered===true&&typeof receipt.messageId==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(receipt.messageId);
      const state=confirmed?'delivered':'delivery_unknown';
      db.prepare('UPDATE alerts SET state=?,receipt=?,updated=?,expires=NULL WHERE id=?').run(state,confirmed?JSON.stringify({messageId:receipt.messageId,delivered:true}):null,now(),id);return get(id);});},
    reconcile(){return tx(()=>{
      db.prepare("UPDATE digests SET state='delivery_unknown',updated=? WHERE state='sending' AND expires<=?").run(now(),now());
      return db.prepare("UPDATE alerts SET state='delivery_unknown',updated=? WHERE state='sending' AND expires<=?").run(now(),now()).changes;
    });},
    settleReady(at=now()){return tx(()=>{
      let expired=0,reviewed=0;
      for(const row of db.prepare("SELECT id,item FROM alerts WHERE state='ready'").all()){
        const result=prefilter(JSON.parse(row.item),{now:at});if(result.decision==='select')continue;
        const state=result.reason==='SOURCE_STALE'?'expired_unsent':'review';
        db.prepare('UPDATE alerts SET state=?,reason=?,updated=? WHERE id=?').run(state,result.reason,now(),row.id);
        if(state==='expired_unsent')expired++;else reviewed++;
      }
      return {expired,reviewed};
    });},
    settleStaleReviews(at=now()){return tx(()=>{
      let expired=0;
      for(const row of db.prepare("SELECT id,item FROM alerts WHERE state='review'").all()){
        if(prefilter(JSON.parse(row.item),{now:at}).reason!=='SOURCE_STALE')continue;
        // Keep the original review reason, evidence and Jev receipt for audit.
        db.prepare("UPDATE alerts SET state='expired_unsent',updated=? WHERE id=?").run(now(),row.id);expired++;
      }
      return {expired};
    });},
    list(state,limit=100){if(!['pending','review','ready','delivered','skipped','delivery_unknown','expired_unsent'].includes(state)||!Number.isInteger(limit)||limit<1||limit>100)fail('ALERT_LIST_INVALID');
      return db.prepare('SELECT id FROM alerts WHERE state=? ORDER BY created,id LIMIT ?').all(state,limit).map(r=>get(r.id));},
    reserveDigest({key,ids,text}){if(!/^[a-zA-Z0-9:_-]{1,120}$/.test(key)||!Array.isArray(ids)||ids.length<1||ids.length>3||new Set(ids).size!==ids.length||typeof text!=='string'||!text.trim()||text.length>2500)fail('ALERT_DIGEST_INVALID');
      return tx(()=>{
        if(db.prepare('SELECT key FROM digests WHERE key=?').get(key))return null;
        if(ids.some(id=>get(id)?.state!=='ready'))return null;
        const owner=randomUUID(),at=now();
        db.prepare("INSERT INTO digests VALUES(?,?,?,?,'sending',?,?,NULL)").run(key,JSON.stringify(ids),text,owner,at+leaseMs,at);
        for(const id of ids)db.prepare("UPDATE alerts SET state='sending',owner=?,expires=?,updated=? WHERE id=?").run(owner,at+leaseMs,at,id);
        return {key,ids,text,owner};
      });},
    digestStatus(key){return db.prepare('SELECT key,state FROM digests WHERE key=?').get(key)??null;},
    finishDigest(key,owner,receipt){return tx(()=>{
      const digest=db.prepare('SELECT * FROM digests WHERE key=?').get(key);
      if(!digest||digest.owner!==owner||digest.state!=='sending')fail('ALERT_LEASE_LOST');
      const confirmed=receipt?.delivered===true&&typeof receipt.messageId==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(receipt.messageId);
      const state=confirmed?'delivered':'delivery_unknown',proof=confirmed?JSON.stringify(receipt):null;
      db.prepare('UPDATE digests SET state=?,receipt=?,updated=?,expires=NULL WHERE key=?').run(state,proof,now(),key);
      for(const id of JSON.parse(digest.ids)){
        owned(id,owner,'sending');
        db.prepare('UPDATE alerts SET state=?,receipt=?,updated=?,expires=NULL WHERE id=?').run(state,proof,now(),id);
      }
      return {key,state,count:JSON.parse(digest.ids).length,...(confirmed?{messageId:receipt.messageId}:{})};
    });},
    claimCycle(name,key){if(!/^[a-z-]{1,30}$/.test(name)||!key.startsWith(name+':')||key.length>100)fail('ALERT_CYCLE_INVALID');return tx(()=>{
      const at=now(),row=db.prepare('SELECT * FROM cycles WHERE key=?').get(key);
      if(row&&(row.status==='done'||row.attempts>=2||(row.status==='running'&&row.expires>at)||(row.status==='failed'&&at-row.updated<900000)))return null;
      const owner=randomUUID();
      db.prepare("INSERT INTO cycles VALUES(?,?,'running',?,?,1,?,NULL) ON CONFLICT(key) DO UPDATE SET status='running',owner=excluded.owner,expires=excluded.expires,attempts=cycles.attempts+1,updated=excluded.updated")
        .run(key,name,owner,at+900000,at);
      return {name,key,owner,attempt:row?row.attempts+1:1};
    });},
    finishCycle(cycle,{ok,metrics={}}){return tx(()=>{
      const row=db.prepare('SELECT * FROM cycles WHERE key=?').get(cycle.key);
      if(!row||row.owner!==cycle.owner||row.status!=='running'||row.expires<=now())fail('ALERT_LEASE_LOST');
      db.prepare('UPDATE cycles SET status=?,metrics=?,updated=?,expires=NULL WHERE key=?').run(ok?'done':'failed',JSON.stringify(metrics),now(),cycle.key);
    });},
    cycleStatus(){return db.prepare('SELECT name,key,status,attempts,updated,metrics FROM cycles ORDER BY updated DESC LIMIT 20').all().map(r=>({...r,metrics:r.metrics?JSON.parse(r.metrics):null}));},
    retryTransient({minDelayMs=900000}={}){if(!Number.isSafeInteger(minDelayMs)||minDelayMs<0)fail('ALERT_RETRY_INVALID');return tx(()=>
      db.prepare("UPDATE alerts SET state='pending',reason=NULL,retries=retries+1,updated=? WHERE state='review' AND reason IN ('SELECTION_UNAVAILABLE','SYNTHESIS_UNAVAILABLE','SYNTHESIS_TIMEOUT','NATIVE_ASSESSMENT_UNAVAILABLE','NATIVE_ASSESSMENT_TIMEOUT') AND retries<1 AND updated<=?")
        .run(now(),now()-minDelayMs).changes);},
    get,
    reviewCandidates({revision,limit=100}={}){
      if(!/^policy-[a-f\d]{16}$/.test(revision??'')||!Number.isInteger(limit)||limit<1||limit>100)fail('ALERT_REVISION_INVALID');
      return db.prepare("SELECT id FROM alerts WHERE state='review' AND reason='SELECTION_UNCERTAIN' AND NOT EXISTS (SELECT 1 FROM evidence_revisions WHERE evidence_revisions.id=alerts.id AND revision=?) ORDER BY created,id LIMIT ?")
        .all(revision,limit).map(r=>get(r.id));
    },
    reconsiderReviewedSelection(id,{revision,outcome,policy}={}){
      if(!/^policy-[a-f\d]{16}$/.test(revision??'')||!['keep','skip','review'].includes(outcome))fail('ALERT_REVISION_INVALID');
      return tx(()=>{
        const old=get(id),selection=old?.brief?.selection;
        if(!old||old.state!=='review'||old.reason!=='SELECTION_UNCERTAIN'||
          db.prepare('SELECT id FROM evidence_revisions WHERE id=? AND revision=?').get(id,revision))return {revised:false};
        db.prepare('INSERT INTO evidence_revisions VALUES(?,?,?,?,?,?)').run(id,revision,JSON.stringify(old.item),JSON.stringify(old.brief),old.reason,now());
        if(outcome==='review'||prefilter(old.item,{now:now()}).decision!=='select'||selection?.provider!=='jev'||selection.context_version!==PILOT_CONTEXT.version||
          !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(selection.request_id??''))return{revised:false,checked:true};
        const brief={...old.brief,selectionReplay:{revision,...(policy?{policy}:{}),itemSha256:createHash('sha256').update(JSON.stringify(old.item)).digest('hex')}};
        db.prepare('UPDATE alerts SET state=?,reason=?,brief=?,updated=? WHERE id=?')
          .run(outcome==='keep'?'pending':'skipped',outcome==='keep'?'SELECTION_POLICY_REPLAY':'SELECTION_REJECTED',JSON.stringify(brief),now(),id);
        return {revised:true,id,outcome};
      });
    },
    reselectReviewedContext({limit=8}={}){
      // Explicit operator migration after a versioned question/context change.
      // This schedules a NEW assessment, never treats an obsolete receipt as current.
      if(!Number.isInteger(limit)||limit<1||limit>8)fail('ALERT_REVISION_INVALID');
      const revision='context-'+createHash('sha256').update(JSON.stringify(PILOT_CONTEXT)).digest('hex').slice(0,16);
      return tx(()=>{
        const rows=db.prepare("SELECT id FROM alerts WHERE state='review' AND reason='SELECTION_UNCERTAIN' AND json_extract(brief,'$.selection.context_version')<>? AND NOT EXISTS (SELECT 1 FROM evidence_revisions WHERE evidence_revisions.id=alerts.id AND revision=?) ORDER BY created,id LIMIT 100")
          .all(PILOT_CONTEXT.version,revision);
        let checked=0;const ids=[];
        for(const row of rows){
          const old=get(row.id),selection=old.brief?.selection;
          db.prepare('INSERT INTO evidence_revisions VALUES(?,?,?,?,?,?)').run(old.id,revision,JSON.stringify(old.item),JSON.stringify(old.brief),old.reason,now());checked++;
          if(prefilter(old.item,{now:now()}).decision!=='select'||selection?.provider!=='jev'||
             !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(selection.request_id??''))continue;
          db.prepare("UPDATE alerts SET state='pending',reason='SELECTION_CONTEXT_CHANGED',brief=NULL,updated=? WHERE id=?").run(now(),old.id);
          ids.push(old.id);if(ids.length===limit)break;
        }
        return{revision,checked,requeued:ids.length,ids};
      });
    },
    reviseReviewedEvidence(raw,{revision}={}){
      // Explicit operator repair after a reader change, never a scheduled retry
      // of a semantic decision. Preserve the old evidence and Jev receipt.
      const item=validateItem(raw),id=createHash('sha256').update(item.url).digest('hex');
      if(item.sourceStatus!=='read'||!/^reader-[a-z0-9-]{1,40}$/.test(revision??''))fail('ALERT_REVISION_INVALID');
      return tx(()=>{
        const old=get(id);
        if(!old||old.state!=='review'||old.reason!=='SELECTION_UNCERTAIN'||old.item.sourceStatus!=='read'||
           old.item.topic!==item.topic||old.item.publishedAt!==item.publishedAt||old.item.excerpt===item.excerpt||
           db.prepare('SELECT id FROM evidence_revisions WHERE id=? AND revision=?').get(id,revision))return {revised:false};
        db.prepare('INSERT INTO evidence_revisions VALUES(?,?,?,?,?,?)').run(id,revision,JSON.stringify(old.item),JSON.stringify(old.brief),old.reason,now());
        db.prepare("UPDATE alerts SET item=?,state='pending',reason=NULL,brief=NULL,updated=? WHERE id=?").run(JSON.stringify(item),now(),id);
        return {revised:true,id,revision};
      });
    },
    ownsLease(id,owner){const r=get(id);return !!r&&r.state==='processing'&&r.owner===owner&&r.expires>now();},
    counts(){return Object.fromEntries(db.prepare('SELECT state,count(*) AS n FROM alerts GROUP BY state').all().map(r=>[r.state,r.n]));},
    archiveTerminal({afterDays=30,limit=100}={}){
      if(!Number.isInteger(afterDays)||afterDays<7||!Number.isInteger(limit)||limit<1||limit>100)fail('ALERT_RETENTION_INVALID');
      return tx(()=>{
        const rows=db.prepare(`SELECT * FROM alerts WHERE state IN (${terminal}) AND archive IS NULL AND updated<? ORDER BY updated,id LIMIT ?`).all(now()-afterDays*86400000,limit);
        if(!rows.length)return {archived:0};
        const archiveDir=path.join(directory,'archive');mkdirSync(archiveDir,{mode:0o700,recursive:true});
        if(!safe(lstatSync(archiveDir),true))fail('ALERT_ARCHIVE_UNAVAILABLE');
        for(const row of rows){
          const revisions=db.prepare('SELECT * FROM evidence_revisions WHERE id=?').all(row.id);
          const bytes=gzipSync(Buffer.from(JSON.stringify({version:1,row,revisions}))),sha256=createHash('sha256').update(bytes).digest('hex');
          const name=sha256+'.json.gz',target=path.join(archiveDir,name),temp=path.join(archiveDir,randomUUID()+'.tmp');
          try{
            // Link publishes a complete blob atomically without replacing an existing one.
            writeFileSync(temp,bytes,{mode:0o600,flag:'wx'});
            try{linkSync(temp,target);}catch(error){if(error.code!=='EEXIST')throw error;}
          }finally{try{unlinkSync(temp);}catch{}}
          if(!safe(lstatSync(target))||!readFileSync(target).equals(bytes))fail('ALERT_ARCHIVE_UNAVAILABLE');
          db.prepare("UPDATE alerts SET item='{}',brief=NULL,archive=? WHERE id=?").run(JSON.stringify({filename:name,sha256}),row.id);
          db.prepare('DELETE FROM evidence_revisions WHERE id=?').run(row.id);
        }
        return {archived:rows.length};
      });
    },
    close(){db.close();}
  };
}
