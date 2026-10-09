import {definePluginEntry} from 'openclaw/plugin-sdk/plugin-entry';
import {handleOpportunityCommand} from './command.js';
export default definePluginEntry({
  id:'ivan-ai-os-opportunities',name:'Ivan opportunity decisions',
  register(api){
    api.registerCommand({name:'opportunite',description:'Consulter les dossiers Business préparés',channels:['telegram'],acceptsArgs:true,requireAuth:true,
      handler:ctx=>handleOpportunityCommand(ctx,api.pluginConfig,'read')});
    api.registerCommand({name:'decision',description:'Enregistrer ton choix et sa raison dans Obsidian',channels:['telegram'],acceptsArgs:true,requireAuth:true,
      handler:ctx=>handleOpportunityCommand(ctx,api.pluginConfig,'decide')});
  }
});
