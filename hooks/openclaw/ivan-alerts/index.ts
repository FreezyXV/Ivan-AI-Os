import {definePluginEntry} from 'openclaw/plugin-sdk/plugin-entry';
import {createSynthesisTool} from './tool.js';
export default definePluginEntry({
 id:'ivan-ai-os-alerts',name:'Ivan AI OS Alert Prose',
 description:'Isolated public-source assessment and useful prose in one completion, or synthesis after selection; no tools or conversation history.',
 register(api){api.registerTool(context=>createSynthesisTool(context,api.runtime.subagent),{
  names:['ivan_alert_synthesize'],optional:true});}
});
