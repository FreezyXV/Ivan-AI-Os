import test from 'node:test';import assert from 'node:assert/strict';
import {benchmark,scoreBenchmark} from './benchmark-alert-architecture.mjs';
const item={producer:'sentinelle',scope:'public',topic:'system',url:'https://example.org/benchmark',title:'Reprise des résultats',
 publishedAt:'2026-10-05T08:00:00Z',observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z',sourceStatus:'read',excerpt:'Les résultats enregistrés sont contrôlés après une reprise du service.'};
test('validate all sources before providers and pass only whitelisted items, never labels or categories',async()=>{
 let calls=0;await assert.rejects(benchmark([{id:'ok',item},{id:'bad',item:{...item,scope:'private'}}],{select:async()=>calls++}));assert.equal(calls,0);
 const rows=[];await benchmark([{id:'ok',categorie:'utile',attendu:'keep',item}],{select:async input=>{assert.equal(input.attendu,undefined);assert.equal(input.categorie,undefined);return{decision:'keep',confidence:0.8};},assess:async()=>({decision:'keep'}),record:r=>rows.push(r)});
 assert.equal(rows.length,1);assert.equal(rows[0].native.decision,'keep');
});
test('excluded sources cost zero calls and provider failures remain counted rather than disappearing',async()=>{
 const rows=[];const result=await benchmark([{id:'paused',item:{...item,topic:'career'}},{id:'ok',item}],{
  select:async()=>{throw Error('private exception');},assess:async()=>({decision:'keep'}),record:r=>rows.push(r)});
 assert.equal(result.jevAttempts,1);assert.equal(result.nativeAttempts,1);assert.equal(result.errors,1);
 assert.equal(rows[0].calls,0);assert.equal(rows[1].jev.error,'PROVIDER_UNAVAILABLE');assert.doesNotMatch(JSON.stringify(rows),/private exception/);
});
test('scores require every unique labelled case and use production handling of contradictory probabilities',()=>{
 const labels={labels:[{id:'ok',selection:'review'}]},rows=[{id:'ok',jev:{decision:'keep',confidence:0.8,probabilities:{keep:0.4,review:0.2,skip:0.4}},native:{decision:'review'}}];
 const score=scoreBenchmark(labels,rows,{policy:{keepMinConfidence:1,skipMinConfidence:1,keepMinProbability:0.1,skipMinProbability:0.2}});
 assert.equal(score.B.matrix['review>review'],1);assert.equal(score.B.noiseKept,0);
 assert.throws(()=>scoreBenchmark(labels,[]),/INCOMPLETE/);assert.throws(()=>scoreBenchmark(labels,[...rows,...rows]),/INCOMPLETE/);
});
test('a previously claimed live result cannot repeat paid calls or overwrite evidence',async t=>{
 const {mkdtempSync,writeFileSync,readFileSync,rmSync}=await import('node:fs');const{tmpdir}=await import('node:os');
 const{createHash}=await import('node:crypto');const{execFileSync}=await import('node:child_process');
 const dir=mkdtempSync(tmpdir()+'/ivan-benchmark-once-');t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const bytes=JSON.stringify({id:'ok',item})+'\n';writeFileSync(dir+'/fixtures',bytes);
 writeFileSync(dir+'/labels',JSON.stringify({fixturesSha256:createHash('sha256').update(bytes).digest('hex'),labels:[{id:'ok',selection:'keep'}]}));
 writeFileSync(dir+'/results','existing proof',{mode:0o600});
 assert.throws(()=>execFileSync(process.execPath,['scripts/benchmark-alert-architecture.mjs','--live',dir+'/fixtures',dir+'/labels',dir+'/results'],{encoding:'utf8',stdio:'pipe'}),
  error=>String(error.stderr).includes('ARCHITECTURE_BENCHMARK_ALREADY_STARTED'));
 assert.equal(readFileSync(dir+'/results','utf8'),'existing proof');
});
