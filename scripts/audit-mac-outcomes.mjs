// Read-only outcome audit: count confirmed messages, not green process ticks.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const count=(rows,key)=>Object.fromEntries([...new Set(rows.map(key))].map(k=>[k,rows.filter(r=>key(r)===k).length]));
const object=text=>{try{return JSON.parse(text??'{}');}catch{return {};}};
export function summarizeOutcomes({alerts,digests,cycles,choices=[],dossiers=0,since,until}){
 const fresh=alerts.filter(r=>r.created>=since&&r.created<=until);
 const sent=alerts.filter(r=>r.state==='delivered'&&r.updated>=since&&r.updated<=until);
 const messages=count(digests,r=>r.state),attempted=digests.length;
 const errors=cycles.filter(r=>r.status==='failed');
 const calls=cycles.filter(r=>r.name==='process').reduce((n,r)=>n+(object(r.metrics).result?.nativeCalls??0),0);
 const failurePhases=count(digests.flatMap(r=>{
  const cycle=cycles.find(c=>c.key===r.key||c.key===r.key.replace(/:p(\d+)$/,':continuation:p$1'));
  return (object(cycle?.metrics).result?.pages??[]).filter(p=>p.deliveryFailure).map(p=>p.deliveryFailure);
 }),r=>['NATIVE_TIMEOUT','NATIVE_EXIT','RECEIPT_INVALID','ABORTED','DIGEST_TIMEOUT','UNAVAILABLE'].includes(r.stage)?r.stage:'UNAVAILABLE');
 const byGoal=count(sent,r=>object(r.brief).goal??'unknown');
 return {window:{since:new Date(since).toISOString(),until:new Date(until).toISOString()},
  discovery:{newCandidates:fresh.length,byTopic:count(fresh,r=>object(r.item).topic??'unknown'),states:count(fresh,r=>r.state)},
  delivery:{attemptedMessages:attempted,confirmedMessages:messages.delivered??0,uncertainMessages:messages.delivery_unknown??0,
   sendingMessages:messages.sending??0,confirmedSources:sent.length,confirmedByGoal:byGoal,
   confirmationRate:attempted?(messages.delivered??0)/attempted:null,failurePhases,
   historicalFailureCauseUnavailable:digests.filter(r=>r.state==='delivery_unknown').length-Object.values(failurePhases).reduce((a,b)=>a+b,0)},
  operations:{cycles:count(cycles,r=>r.name),failedCycles:count(errors,r=>r.name),recordedNativeCalls:calls,
   nativeCallsAreLowerBound:true,nativeCostEur:null,nativeCostStatus:'NOT_EXPOSED_BY_PROVIDER'},
  opportunities:{dossiers,currentChoices:count(choices,r=>r.choice),usefulnessRating:null,timeSavedMinutes:null},
  limitations:['A confirmed message can contain several sources.','A successful service check does not measure usefulness.',
   'Uncertain deliveries are never counted as sent or retried.','Native cost and time saved are unmeasured, not zero.']};
}
export function auditOutcomes(settingsPath,{since=Date.now()-7*86400000,until=Date.now()}={}){
 if(!Number.isSafeInteger(since)||!Number.isSafeInteger(until)||since>=until)throw Error('AUDIT_WINDOW_INVALID');
 const s=JSON.parse(readFileSync(settingsPath));let db,op;
 try{
  db=new DatabaseSync(path.join(s.stateDir,'alerts.sqlite'),{readOnly:true});
  const alerts=db.prepare('SELECT state,created,updated,item,brief,reason FROM alerts WHERE (created>=? OR updated>=?) AND created<=?').all(since,since,until);
  const digests=db.prepare('SELECT key,state,updated FROM digests WHERE updated BETWEEN ? AND ?').all(since,until);
  const cycles=db.prepare('SELECT key,name,status,metrics,updated FROM cycles WHERE updated BETWEEN ? AND ?').all(since,until);
  let choices=[],dossiers=0;
  if(s.opportunities){const file=path.join(s.opportunities.directory,'opportunities.sqlite');if(existsSync(file)){
   op=new DatabaseSync(file,{readOnly:true});dossiers=op.prepare('SELECT count(*) n FROM dossiers').get().n;
   choices=op.prepare('SELECT choice FROM choices c WHERE revision=(SELECT max(revision) FROM choices x WHERE x.id=c.id)').all();}}
  return summarizeOutcomes({alerts,digests,cycles,choices,dossiers,since,until});
 }finally{op?.close();db?.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const [settings,since]=process.argv.slice(2);console.log(JSON.stringify(auditOutcomes(settings,{...(since?{since:Date.parse(since)}:{})})));}
 catch{console.error('OUTCOME_AUDIT_UNAVAILABLE');process.exitCode=1;}
}
