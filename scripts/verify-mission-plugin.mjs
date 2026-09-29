import{mkdtempSync,readFileSync,readdirSync,rmSync}from'node:fs';import path from'node:path';import os from'node:os';import{pathToFileURL,fileURLToPath}from'node:url';import{randomUUID}from'node:crypto';import assert from'node:assert/strict';
const root=process.argv[2],scratch=mkdtempSync(path.join(os.tmpdir(),'ivan-native-missions-'));try{
 if(!root||!path.isAbsolute(root))throw new Error();process.env.OPENCLAW_STATE_DIR=scratch;process.env.OPENCLAW_CONFIG_PATH=path.join(scratch,'inactive.json');
 const candidates=readdirSync(path.join(root,'dist')).filter(n=>/^loader-runtime-load-[\w-]+\.mjs$/.test(n)).map(name=>({name,exp:readFileSync(path.join(root,'dist',name),'utf8').match(/loadOpenClawPlugins as (\w+)/)?.[1]})).filter(x=>x.exp);assert.equal(candidates.length,1);
 const load=(await import(pathToFileURL(path.join(root,'dist',candidates[0].name))))[candidates[0].exp],id='ivan-ai-os-missions';const registry=load({config:{plugins:{enabled:true,allow:[id],load:{paths:[fileURLToPath(new URL('../hooks/openclaw/ivan-missions',import.meta.url))]},entries:{[id]:{enabled:true,config:{enabled:true,statePath:path.join(scratch,'missions.json')}}}}},workspaceDir:scratch,activate:false,cache:false,onlyPluginIds:[id],throwOnLoadError:true,logger:{debug(){},info(){},warn(){},error(){}}});
 assert.equal(registry.plugins.find(p=>p.id===id)?.status,'loaded');const hooks=registry.typedHooks.filter(h=>h.pluginId===id);assert.equal(hooks.length,2);
 const tool=registry.tools.find(t=>t.pluginId===id);assert.ok(tool);assert.equal(await tool.factory({agentId:'ivan-finance'}),null);
 const generated=await tool.factory({agentId:'main'}),status=Array.isArray(generated)?generated[0]:generated,r=await status.execute('synthetic',{});assert.equal(r.details.missions.length,0);
 const after=hooks.find(h=>h.hookName==='after_tool_call'),run=randomUUID();assert.equal(typeof after.handler,'function');
 await after.handler({toolName:'ivan_route',params:{private:'SYNTHETIC_NOT_RETAINED'},result:{details:{status:'ROUTED',manager:'system',provider:'jev'}}},{agentId:'main',toolName:'ivan_route',runId:run});
 const observed=await status.execute('synthetic',{});assert.equal(observed.details.missions.length,1);assert.equal(observed.details.missions[0].status,'routed');
 assert.equal(readFileSync(path.join(scratch,'missions.json'),'utf8').includes('SYNTHETIC_NOT_RETAINED'),false);
 console.log(JSON.stringify({native_plugin_loaded:true,native_hooks:hooks.map(h=>h.hookName??h.name),status_tool_available:true,native_after_hook_persisted:true,finance_tool_unavailable:true,live_runtime_modified:false,provider_calls:0}));
}catch{console.error('NATIVE_MISSION_PLUGIN_PROOF_FAILED');process.exitCode=1}finally{rmSync(scratch,{recursive:true,force:true})}
