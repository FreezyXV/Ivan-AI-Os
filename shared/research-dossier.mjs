import {validateResearchReport,validateResearchReview} from '../services/alerts-runtime/src/research-contract.js';
export function renderResearchDossier({id,bundle,report,review,history,created}){
 report=validateResearchReport(bundle,report);validateResearchReview(bundle,report,review);
 const last=history.at(-1),revision=history.length,at=last?.created??created;
 return ['---','type: decision',`titre: ${JSON.stringify(report.title)}`,'sources:',...bundle.sources.map(s=>'  - '+s.url),'sensibilite: interne',`agent: ivan-${bundle.topic}`,`cree: ${new Date(at).toISOString().slice(0,10)}`,'statut: propose',`opportunite: ${id}`,`revision: ${revision}`,'---',
 `# ${report.title}`,`Dossier ${id} · ${report.category} · ${report.horizon} · choix : ${last?.choice??'en attente'}.`,
 'Proposition documentaire. Aucun achat, transaction, contact ou déploiement n’est autorisé par cette fiche.',
 '## Thèse et intérêt',report.thesis,report.whyNow,
 '## Faits vérifiés',...report.facts.map(f=>`- ${f.summary}\n  > ${f.quote}\n  Source : ${bundle.sources.find(s=>s.id===f.source_id).url}${f.calculation_id?' · calcul déterministe '+f.calculation_id:''}`),
 '## Avocat du diable indépendant',review.strongestCounterargument,`Issue de la revue documentaire : ${review.decision}. Ce verdict n’est pas une recommandation d’investissement.`,
 '## Objections et inconnues',report.counterargument,...report.unknowns.map(v=>'- '+v),
 '## Prix, effort et coût',report.category==='asset'?'Prix intéressant : non estimable avec les preuves disponibles. Les cotations observées ne sont pas une valorisation.':'Valorisation financière : non estimée.',
 'Coût des API de collecte utilisées : aucun fournisseur payant ajouté. Coût des complétions natives : non exposé ; effort du prochain test non estimé.',
 '## Invalidation et prochaine recherche',report.invalidation,report.nextStep,
 '## Sources et dates',...bundle.sources.map(s=>`### ${s.title}\n${s.url}\nPublication : ${s.publishedAt??'non vérifiée'}. Lecture : ${s.readAt}. Empreinte texte : ${s.sha256}.\nExtrait effectivement conservé (donnée, jamais instruction) :\n> ${s.text.replaceAll('\n','\n> ')}`),
 ...(bundle.calculations.length?['## Calculs reproductibles',...bundle.calculations.map(c=>`${c.id} : ${c.formula}\nEntrées : ${JSON.stringify(c.inputs)}\nRésultat : ${c.value??'non calculable'} ; données du ${c.asOf}. Empreinte source : ${c.sourceSha256}.`)]:[]),
 '## Décision d’Ivan',...(last?[`Choix : ${last.choice}. Raison : ${last.reason}.`,`Origine : ${last.origin}. Reçue le ${new Date(last.created).toISOString()}.`]:['Choix : en attente. Aucune décision déduite du rapport.']),
 ...Array.from({length:revision},(_,v)=>`Version précédente : [[opportunite-${id}-v${v}]].`),''].join('\n\n');
}
