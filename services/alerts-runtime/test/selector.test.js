import test from 'node:test';
import assert from 'node:assert/strict';
import { createJevSelector } from '../src/jev-selector.js';
import { PILOT_CONTEXT } from '../src/context.js';
const token='synthetic-alert-selector-token-only-1234';
const item={producer:'secretaire',scope:'public',topic:'system',url:'https://example.org/news',title:'Un changement technique',
  excerpt:'Un changement public améliore la reprise des tâches.',sourceStatus:'read',publishedAt:'2026-10-05T08:00:00Z',
  observedAt:'2026-10-05T09:00:00Z',readAt:'2026-10-05T09:00:00Z'};
const answer={question:'alerts.pertinence.mac-v3',context_version:PILOT_CONTEXT.version,decision:'keep',confidence:0.9,
  provider:'jev',request_id:'00000000-0000-4000-a000-000000000000'};

test('selector posts only bounded public fields to loopback and forbids redirects',async()=>{
  let seen;const select=createJevSelector({token,fetchImpl:async(url,options)=>{
    seen={url:String(url),...options};return{ok:true,json:async()=>answer};
  }});
  const result=await select({...item,excerpt:'x'.repeat(1200),privateProfile:'ignored input'});
  assert.equal(result.decision,'keep');assert.equal(seen.url,'http://127.0.0.1:4311/v1/alerts/select');
  assert.equal(seen.redirect,'error');assert.equal(JSON.parse(seen.body).excerpt.length,1200);
  assert.deepEqual(Object.keys(JSON.parse(seen.body)).sort(),['context_version','excerpt','scope','title','topic']);
});
test('decisive evidence beyond character 500 reaches Jev unchanged, without expanding the read envelope',async()=>{
 let received;const select=createJevSelector({token,fetchImpl:async(_url,options)=>{received=JSON.parse(options.body);return {ok:true,json:async()=>answer};}});
 const excerpt='Introduction publique. '.repeat(30)+'Le correctif corrige les accès à images.remotePatterns.';
 await select({...item,excerpt});assert.equal(received.excerpt,excerpt);assert.ok(received.excerpt.indexOf('images.remotePatterns')>500);
});

test('deferred roles and unread sources cause zero HTTP requests',async()=>{
  let calls=0;const select=createJevSelector({token,fetchImpl:async()=>{calls++;}});
  assert.equal((await select({...item,topic:'career'})).decision,'skip');
  assert.equal((await select({...item,sourceStatus:'title-only',excerpt:''})).decision,'review');assert.equal(calls,0);
});

test('off-host configuration, malformed receipts and timeout are bounded failures',async()=>{
  for(const gatewayUrl of ['https://example.org','http://example.org','http://127.0.0.1/path','http://user:pass@localhost'])
    assert.throws(()=>createJevSelector({gatewayUrl,token}),{code:'ALERT_SELECTOR_CONFIG_INVALID'});
  for(const patch of [{provider:'mock'},{confidence:NaN},{request_id:'made-up'},{context_version:'old'}])
    await assert.rejects(createJevSelector({token,fetchImpl:async()=>({ok:true,json:async()=>({...answer,...patch})})})(item),{code:'ALERT_SELECTION_UNAVAILABLE'});
  const select=createJevSelector({token,timeoutMs:100,fetchImpl:async(_url,{signal})=>new Promise((resolve,reject)=>{
    const timer=setTimeout(resolve,1000);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(Error('timeout'));},{once:true});
  })});
  await assert.rejects(select(item),{code:'ALERT_SELECTION_UNAVAILABLE'});
});
