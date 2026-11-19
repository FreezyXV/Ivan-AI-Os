import test from 'node:test';import assert from 'node:assert/strict';
import {sealRadarEvidence,validateRadarCards,validateRadarReview,renderRadarCard,radarCardsBinding,radarSourceProfile} from '../src/radar-brief.js';
const now='2026-10-31T08:00:00.000Z';
const source={url:'https://www.ecb.europa.eu/press/test',title:'Lending survey',text:'Banks reported tighter credit standards for loans to enterprises. Demand for loans was unchanged. The results describe surveyed banks and are not an investment recommendation.',readAt:now,publishedAt:now};
const evidence=()=>sealRadarEvidence([{id:'0123456789',topic:'finance',source}]);
const card=()=>({id:'0123456789',subject:'Le crédit devient plus sélectif pour les entreprises',fact:{summary:'Les banques déclarent des critères de crédit plus stricts pour les entreprises.',evidence_index:0},interest:'Des conditions de crédit plus strictes peuvent compliquer le financement des entreprises.',utility:'Hypothèse pour toi : comparer les risques de financement de projets Business avant de les retenir.',concreteUse:'Dans une fiche de projet, séparer le scénario autofinancé de celui qui dépend d’un prêt.',limitation:'Ce constat ne dit pas si un actif est bon marché et ne prédit pas son rendement.'});
test('each radar card explains a subject, interest, contextual utility and concrete use in French, with read provenance',()=>{
 const e=evidence(),cards=validateRadarCards(e,[card()]),review=validateRadarReview(e,cards,{binding:radarCardsBinding(e,cards),items:[{id:card().id,decision:'approve',issues:[]}]});
 const text=renderRadarCard(e,cards[0],review);for(const label of ['Sujet','Pourquoi','Pour toi','Utilisation concrète','Limite','Source'])assert.match(text,new RegExp(label));
 assert.match(text,/source institutionnelle/);assert.match(text,/31\/10\/2026/);assert.doesNotMatch(text,/evidence_index|kind|sha256/);
});
test('unread sources, anonymous finance claims and unsupported figures cannot acquire a polished card',()=>{
 assert.throws(()=>sealRadarEvidence([{id:'0123456789',topic:'finance',source:{...source,text:'Title only'}}]));
 assert.throws(()=>sealRadarEvidence([{id:'0123456789',topic:'finance',source:{...source,url:'https://news.ycombinator.com/item?id=1'}}]));
 assert.throws(()=>validateRadarCards(evidence(),[{...card(),fact:{summary:'Le rendement garanti est de 20 %.',evidence_index:0}}]));
 assert.throws(()=>validateRadarCards(evidence(),[{...card(),utility:'Tu gagneras 20 % avec cet actif.'}]));
});
test('independent review binds exact words and may reject factual error but has no utility veto',()=>{
 const e=evidence(),cards=validateRadarCards(e,[card()]),binding=radarCardsBinding(e,cards);
 assert.throws(()=>validateRadarReview(e,cards,{binding,items:[{id:card().id,decision:'reject',issues:['NOT_USEFUL']}]}));
 assert.throws(()=>validateRadarReview(e,cards,{binding:'0'.repeat(64),items:[{id:card().id,decision:'approve',issues:[]}]}));
 const r=validateRadarReview(e,cards,{binding,items:[{id:card().id,decision:'reject',issues:['UNSUPPORTED_FACT']}]});assert.throws(()=>renderRadarCard(e,cards[0],r));
 assert.throws(()=>renderRadarCard(e,{...cards[0],utility:'Nouvelle interprétation non relue.'},{binding,items:[{id:card().id,decision:'approve',issues:[]}]}));
});
test('application cannot convert quoted dollars into euros; repository contributions are not official documentation',()=>{
 const e=sealRadarEvidence([{id:card().id,topic:'finance',source:{...source,text:'The fee is 10 USD for the example product. '+source.text}}]);
 assert.throws(()=>validateRadarCards(e,[{...card(),fact:{summary:'Les frais sont de 10 USD.',evidence_index:0},utility:'Hypothèse : comparer cette offre de 10 euros à une autre.'}]));
 for(const part of ['issues','pull','discussions'])assert.equal(radarSourceProfile(`https://github.com/n8n-io/n8n/${part}/999`,'engineering').kind,'testimony');
 assert.equal(radarSourceProfile('https://github.com/openclaw/openclaw/releases/tag/v1','engineering').kind,'documentation');
});
