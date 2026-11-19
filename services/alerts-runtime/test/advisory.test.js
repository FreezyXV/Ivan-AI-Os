import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openLedger} from '../src/ledger.js';
import {renderBrief,processNext} from '../src/pipeline.js';
import {briefBinding} from '../src/verification.js';
import {createSynthesisTool} from '../../../hooks/openclaw/ivan-alerts/tool.js';
import {createNativeAssessment} from '../src/synthesis.js';
const at=Date.parse('2026-10-16T10:00:00Z');
const item={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/receipts',title:'Reprise avec reçu',
 publishedAt:'2026-10-16T08:00:00Z',observedAt:'2026-10-16T09:00:00Z',readAt:'2026-10-16T09:00:00Z',sourceStatus:'read',
 excerpt:'The service records a receipt and resumes only tasks without a confirmed receipt.'};
const brief={goal:'system',facts:[{summary:'Le service reprend seulement les tâches sans reçu confirmé.',quote:item.excerpt}],
 utility:'Éviter les envois doublés après une panne.',action:'Comparer les reçus avant et après une reprise.',
 advisory:{kind:'technical',proposal:'Tester une reprise fondée sur les reçus du planificateur Jarvis.',basis_fact:0,
  invalidation:'Abandonner si la reprise actuelle garantit déjà ce comportement.'}};
function fixture(t){const dir=mkdtempSync(path.join(tmpdir(),'ivan-advisory-')),ledger=openLedger(path.join(dir,'alerts.sqlite'),{now:()=>at});
 t.after(()=>{ledger.close();rmSync(dir,{recursive:true,force:true});});return ledger;}
test('a production candidate needs an explicit proposal before buying an independent review',async t=>{
 const ledger=fixture(t);ledger.ingest(item);const {advisory,...old}=brief;let reviews=0;
 const result=await processNext({ledger,now:at,requireAdvisory:true,assess:async()=>({decision:'keep',brief:old}),
  verify:async()=>{reviews++;assert.fail();}});
 assert.equal(result.state,'review');assert.equal(result.reason,'ADVISORY_RESEARCH_REQUIRED');assert.equal(reviews,0);
});
test('proposal, evidence reference and abandonment condition appear together; invented numbers are refused',()=>{
 const message=renderBrief(item,brief);assert.match(message,/Piste technique/);assert.match(message,/Invalider si/);
 for(const patch of [{basis_fact:9},{kind:'investment',horizon:'short'},{proposal:'Gagner 99 %'},{invalidation:''},{extra:'ignored'}])
  assert.throws(()=>renderBrief(item,{...brief,advisory:{...brief.advisory,...patch}}));
 const financial={...brief,goal:'finance',uncertainty:'Scénario non vérifié par une comparaison de marché.',advisory:{...brief.advisory,kind:'investment',horizon:'medium'}};
 assert.match(renderBrief(item,financial),/moyen terme/);
 assert.throws(()=>renderBrief(item,{...financial,advisory:{...financial.advisory,horizon:undefined}}));
});
test('a structurally complete proposal still needs a bound independent approval',async t=>{
 const ledger=fixture(t);ledger.ingest(item);
 const result=await processNext({ledger,now:at,requireAdvisory:true,assess:async()=>({decision:'keep',brief}),
  verify:async(i,b)=>({decision:'approve',issues:[],binding:briefBinding(i,b)})});
 assert.equal(result.state,'ready');assert.equal(result.brief.advisory.basis_fact,0);
});
test('a malformed advisory keeps its research reason through the real plugin/client boundary',async t=>{
 const ledger=fixture(t);ledger.ingest(item);
 const tool=createSynthesisTool({agentId:'ivan-system'},{complete:async()=>({text:JSON.stringify({decision:'keep',brief:{...brief,advisory:{...brief.advisory,basis_fact:99}}})})});
 const assess=createNativeAssessment({runImpl:async()=>({stdout:JSON.stringify({ok:true,output:await tool.execute('test',{item,purpose:'assessment'})})})});
 const result=await processNext({ledger,now:at,requireAdvisory:true,assess,verify:async()=>assert.fail()});
 assert.equal(result.reason,'ADVISORY_RESEARCH_REQUIRED');assert.equal(ledger.retryTransient({minDelayMs:0}),0);
});
test('activating the contract holds only never-attempted legacy briefs, preserving delivery history',t=>{
 const ledger=fixture(t),ids=[];
 for(let i=0;i<3;i++){
  const {id}=ledger.ingest({...item,url:item.url+'/'+i,excerpt:item.excerpt+' source '+i});ids.push(id);
  const job=ledger.claim();ledger.finish(id,job.owner,{state:'ready',reason:'BRIEF_VERIFIED',brief:{message:'legacy'}});
 }
 for(const [index,receipt] of [[1,{delivered:true,messageId:'test:kept'}],[2,undefined]]){
  const job=ledger.beginDelivery(ids[index]);ledger.finishDelivery(job.id,job.owner,receipt);
 }
 assert.equal(ledger.holdLegacyAdvisories(),1);assert.equal(ledger.get(ids[0]).reason,'ADVISORY_RESEARCH_REQUIRED');
 assert.equal(ledger.get(ids[0]).brief.message,'legacy');
 assert.equal(ledger.get(ids[1]).receipt.messageId,'test:kept');assert.equal(ledger.get(ids[2]).state,'delivery_unknown');
 assert.equal(ledger.holdLegacyAdvisories(),0);
});
