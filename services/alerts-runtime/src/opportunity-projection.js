import {openDossiers} from '../../../shared/opportunity-dossier.mjs';
export function createOpportunityProjection(config){
  return row=>{
    if(!row.brief?.business_fiche)return row.brief.message;
    if(!config)throw Object.assign(new Error('DOSSIER_NOT_CONFIGURED'),{code:'DOSSIER_NOT_CONFIGURED'});
    const store=openDossiers(config);
    try{
      const r=store.publish(row);
      const text=row.brief.message+`\n\nDossier ${r.id} · /opportunite ${r.id}`;
      // Preserve every verified fact if the brief already fills its page. The
      // native /opportunite list still exposes the identity and decision action.
      return text.length<=2500?text:row.brief.message;
    }finally{store.close();}
  };
}
