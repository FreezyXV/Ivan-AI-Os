import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, lstatSync, openSync, closeSync } from 'node:fs';
import path from 'node:path';
import { validateItem, fail } from './context.js';

// SQLite owns transaction locks: process crashes cannot leave an application
// lock file blocking all producers. Provider calls occur outside transactions.
export function openLedger(filename, { now = () => Date.now(), leaseMs = 120000 } = {}) {
  if (!path.isAbsolute(filename) || !Number.isSafeInteger(leaseMs) || leaseMs < 1000) fail('ALERT_LEDGER_CONFIG_INVALID');
  const directory=path.dirname(filename);mkdirSync(directory,{recursive:true,mode:0o700});
  const safe=(s,dir=false)=>(dir?s.isDirectory():s.isFile()&&s.nlink===1)&&!s.isSymbolicLink()&&s.uid===process.getuid?.()&&!(s.mode&0o077);
  if(!safe(lstatSync(directory),true))fail('ALERT_LEDGER_UNAVAILABLE');
  try { closeSync(openSync(filename,'wx',0o600)); }catch(e){if(e.code!=='EEXIST')throw e;}
  if(!safe(lstatSync(filename)))fail('ALERT_LEDGER_UNAVAILABLE');
  const db=new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS alerts(id TEXT PRIMARY KEY,url TEXT UNIQUE NOT NULL,item TEXT NOT NULL,state TEXT NOT NULL,
      owner TEXT,expires INTEGER,created INTEGER NOT NULL,updated INTEGER NOT NULL,brief TEXT,reason TEXT,receipt TEXT);
    CREATE INDEX IF NOT EXISTS alert_state ON alerts(state,created);`);
  const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}};
  const get=id=>{const r=db.prepare('SELECT * FROM alerts WHERE id=?').get(id);return r?{...r,item:JSON.parse(r.item),brief:r.brief?JSON.parse(r.brief):null,receipt:r.receipt?JSON.parse(r.receipt):null}:null;};
  const owned=(id,owner,state)=>{const r=get(id);if(!r||r.state!==state||r.owner!==owner)fail('ALERT_LEASE_LOST');return r;};
  return {
    ingest(raw){const item=validateItem(raw),id=createHash('sha256').update(item.url).digest('hex');return tx(()=>{
      const prior=get(id);if(prior)return {id,duplicate:true,state:prior.state};
      if(db.prepare('SELECT count(*) AS n FROM alerts').get().n>=10000)fail('ALERT_QUEUE_FULL');
      const at=now();db.prepare("INSERT INTO alerts(id,url,item,state,created,updated) VALUES(?,?,?,'pending',?,?)").run(id,item.url,JSON.stringify(item),at,at);
      return {id,duplicate:false,state:'pending'};
    });},
    claim(){return tx(()=>{
      const at=now(),r=db.prepare("SELECT id FROM alerts WHERE state='pending' OR (state='processing' AND expires<=?) ORDER BY created,id LIMIT 1").get(at);
      if(!r)return null;const owner=randomUUID();db.prepare("UPDATE alerts SET state='processing',owner=?,expires=?,updated=? WHERE id=?").run(owner,at+leaseMs,at,r.id);return get(r.id);
    });},
    finish(id,owner,{state,reason,brief=null}){if(!['skipped','review','ready'].includes(state)||!(/^[A-Z_]{1,64}$/).test(reason)||
      (state==='ready'&&(typeof brief?.message!=='string'||!brief.message.trim()||brief.message.length>2500)))fail('ALERT_RESULT_INVALID');
      return tx(()=>{const r=owned(id,owner,'processing');if(r.expires<=now())fail('ALERT_LEASE_LOST');
        db.prepare('UPDATE alerts SET state=?,reason=?,brief=?,owner=NULL,expires=NULL,updated=? WHERE id=?').run(state,reason,brief?JSON.stringify(brief):null,now(),id);return get(id);});},
    beginDelivery(id){return tx(()=>{const r=get(id);if(!r||r.state!=='ready')return null;const owner=randomUUID();
      db.prepare("UPDATE alerts SET state='sending',owner=?,expires=?,updated=? WHERE id=?").run(owner,now()+leaseMs,now(),id);return get(id);});},
    finishDelivery(id,owner,receipt){return tx(()=>{owned(id,owner,'sending');
      const confirmed=receipt?.delivered===true&&typeof receipt.messageId==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(receipt.messageId);
      const state=confirmed?'delivered':'delivery_unknown';
      db.prepare('UPDATE alerts SET state=?,receipt=?,updated=?,expires=NULL WHERE id=?').run(state,confirmed?JSON.stringify({messageId:receipt.messageId,delivered:true}):null,now(),id);return get(id);});},
    reconcile(){return tx(()=>db.prepare("UPDATE alerts SET state='delivery_unknown',updated=? WHERE state='sending' AND expires<=?").run(now(),now()).changes);},
    get,
    counts(){return Object.fromEntries(db.prepare('SELECT state,count(*) AS n FROM alerts GROUP BY state').all().map(r=>[r.state,r.n]));},
    close(){db.close();}
  };
}
