import {definePluginEntry} from 'openclaw/plugin-sdk/plugin-entry';
import {handleOpportunityCommand} from './command.js';
import {handleResearchCommand} from './research-command.js';
export default definePluginEntry({
  id:'ivan-ai-os-opportunities',name:'Ivan opportunity decisions',
  register(api){
    api.registerCommand({name:'opportunite',description:'Consulter les dossiers de recherche préparés',channels:['telegram'],acceptsArgs:true,requireAuth:true,
      handler:ctx=>handleOpportunityCommand(ctx,api.pluginConfig,'read')});
    api.registerCommand({name:'decision',description:'Enregistrer ton choix et sa raison dans Obsidian',channels:['telegram'],acceptsArgs:true,requireAuth:true,
      handler:ctx=>handleOpportunityCommand(ctx,api.pluginConfig,'decide')});
    api.registerCommand({name:'recherche',description:'Rechercher un actif, un événement macro, un problème Business ou une technique',channels:['telegram'],acceptsArgs:true,requireAuth:true,
      handler:ctx=>handleResearchCommand(ctx,api.pluginConfig)});
  }
});
