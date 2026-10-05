import {definePluginEntry} from 'openclaw/plugin-sdk/plugin-entry';
import {createSynthesisTool} from './tool.js';
export default definePluginEntry({
 id:'ivan-ai-os-alerts',name:'Ivan AI OS Alert Prose',
 description:'Isolated public-source prose after local/Jev selection; no tools or conversation history.',
 register(api){api.registerTool(context=>createSynthesisTool(context,api.runtime.subagent),{
  names:['ivan_alert_synthesize'],optional:true});}
});
