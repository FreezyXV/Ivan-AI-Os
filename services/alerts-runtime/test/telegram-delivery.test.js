import test from 'node:test';
import assert from 'node:assert/strict';
import { createTelegramDelivery, parseTelegramReceipt } from '../src/telegram-delivery.js';
const target = '123456789';
const core = { action:'send', channel:'telegram', dryRun:false, handledBy:'core', messageId:'42',
  payload:{ channel:'telegram', deliveryStatus:'sent', result:{messageId:'42',chatId:target} } };
const plugin = {...core,handledBy:'plugin',payload:{ok:true,messageId:'42',chatId:target}};

test('native core and plugin receipts require a confirmed send to the intended chat',()=>{
  assert.deepEqual(parseTelegramReceipt(JSON.stringify(core),target),{delivered:true,messageId:'42'});
  assert.deepEqual(parseTelegramReceipt('native preamble\n'+JSON.stringify(plugin),target),{delivered:true,messageId:'42'});
  const invalid = [ {...core,dryRun:true}, {...core,ok:false}, {...core,sentBeforeError:true},
    {...core,messageId:'99'}, {...core,payload:{...core.payload,deliveryStatus:'partial_failed'}},
    {...core,payload:{...core.payload,result:{messageId:'42',chatId:'999999999'}}},
    {...core,payload:{messageId:'42'}}, {...plugin,payload:{...plugin.payload,ok:false}},
    {...plugin,deliveryStatus:'partial_failed'}, {...plugin,payload:{...plugin.payload,sentBeforeError:true}},
    {...core,channel:'slack'} ];
  for(const value of invalid) assert.throws(()=>parseTelegramReceipt(JSON.stringify(value),target),{code:'ALERT_TELEGRAM_RECEIPT_INVALID'});
});

test('delivery uses an argument array, native credential resolution and one bounded send',async()=>{
  let seen,calls=0;const controller=new AbortController();
  const send=createTelegramDelivery({target,account:'default',runImpl:async(...args)=>{seen=args;calls++;return{stdout:JSON.stringify(core)};}});
  assert.deepEqual(await send({text:'Résumé public avec un lien à la fin.',signal:controller.signal}),{delivered:true,messageId:'42'});
  assert.equal(calls,1);assert.equal(seen[0],'openclaw');assert.equal(seen[2].signal,controller.signal);
  assert.equal(seen[2].timeout,20000);assert.ok(seen[1].includes('--silent'));
  assert.deepEqual(seen[1].slice(0,6),['message','send','--channel','telegram','--target',target]);
  assert.ok(!seen[1].some(x=>/token|retry|dry-run/.test(x)));
});

test('timeouts and partial failures are unknown and never retried',async()=>{
  let calls=0;const send=createTelegramDelivery({target,runImpl:async()=>{calls++;throw Object.assign(Error('private diagnostic'),{stdout:JSON.stringify(core)});}});
  await assert.rejects(send({text:'Un résumé public.'}),{code:'ALERT_TELEGRAM_DELIVERY_UNKNOWN'});assert.equal(calls,1);
  for(const target of ['@someone','-100123456789','123','*'])assert.throws(()=>createTelegramDelivery({target}),{code:'ALERT_TELEGRAM_CONFIG_INVALID'});
  const blocked=new AbortController();blocked.abort();await assert.rejects(send({text:'Un résumé public.',signal:blocked.signal}));assert.equal(calls,1);
});
