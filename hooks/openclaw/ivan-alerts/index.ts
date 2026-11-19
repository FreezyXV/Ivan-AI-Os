import {definePluginEntry} from 'openclaw/plugin-sdk/plugin-entry';
import {createSynthesisTool} from './tool.js';
import {createResearchTool} from './research-tool.js';
import {createRadarTool} from './radar-tool.js';
export default definePluginEntry({
 id:'ivan-ai-os-alerts',name:'Ivan AI OS Alert Prose',
 description:'Isolated public-source assessment and useful prose in one completion, or synthesis after selection; no tools or conversation history.',
 register(api){api.registerTool(context=>createSynthesisTool(context,api.runtime.subagent),{
  names:['ivan_alert_synthesize'],optional:true});
  api.registerTool(context=>createResearchTool(context,api.runtime.subagent),{names:['ivan_research_complete'],optional:true});
  api.registerTool(context=>createRadarTool(context,api.runtime.subagent),{names:['ivan_radar_complete'],optional:true});}
});
