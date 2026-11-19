// Sonde de relecture v6 (Claude, 2026-10-06) : rejoue sans réseau les contre-exemples des
// corrections bf2d2e1. Lecture seule du runtime. Usage : node skills/rapport-telegram/scripts/sonde-v6.mjs
import {fileURLToPath} from 'node:url';
const R=fileURLToPath(new URL('../../../', import.meta.url));
const {renderBrief}=await import(R+'services/alerts-runtime/src/pipeline.js');
const {insufficientShortEvidence,validateItem}=await import(R+'services/alerts-runtime/src/context.js');
const {redactPublicContacts}=await import(R+'services/alerts-runtime/src/jev-selector.js');
const {isPublicClassificationText}=await import(R+'services/jev-gateway/src/classification.js');
const base={producer:'sentinelle',url:'https://simonwillison.net/2026/Sep/22/x/',title:'T',topic:'system',scope:'public',publishedAt:'2026-10-05T10:00:00.000Z',observedAt:'2026-10-05T11:00:00.000Z',readAt:'2026-10-05T11:00:00.000Z',sourceStatus:'read'};
const brief=(summary,quote,excerpt)=>{const it=validateItem({...base,excerpt});try{renderBrief(it,{goal:'system',facts:[{summary,quote}],utility:'Utile au suivi des coûts.',action:'Rien à faire maintenant.',uncertainty:'Extrait partiel.'});return 'ACCEPTÉ';}catch(e){return 'REFUSÉ '+e.code;}};
const ex1='Somehow GPT-6 Luna is half the price of that again, and GLM-5.3 develops full control flow hijacks in 4% of the trials.';
console.log('1a GPT-6 dans la citation        :',brief('GPT-6 Luna coûte moitié moins cher.','Somehow GPT-6 Luna is half the price of that again, and GLM-5.3 develops full control flow hijacks in 4% of the trials.',ex1));
console.log('1b GLM-5.3 dans la citation      :',brief('GLM-5.3 réussit des détournements dans 4 % des essais.',ex1,ex1));
const ex2='Euro area annual HICP inflation was 3.8% in September 2026, according to a flash estimate.';
console.log('1c IPCH (FR) contre HICP (EN)    :',brief("L'inflation IPCH de la zone euro est de 3,8 % en septembre 2026.",ex2,ex2));
const ex3='SSRF in Image Optimization (High Severity) can reach private IP ranges.';
console.log('1d sigle absent (contrôle)       :',brief('Une RCE critique touche Image Optimization.',ex3,ex3));
for(const [n,t] of [['2a Codex is down (court)','Codex is down for everyone right now, status page says fine.'],['2b Claude at capacity','Claude errors with at capacity, anyone else seeing this?'],['2c GitHub down again','GitHub down again? no PR access'],['2d official short note','We fixed the outage affecting API keys at 10:42 UTC.']])
  console.log(n.padEnd(32),':',insufficientShortEvidence({...base,url:'https://news.ycombinator.com/item?id=1',excerpt:t})?'TENU (review)':'passe à Jev');
const ex4='Report issues to security@vercel.com or call +1 415 555 0100 for urgent coordination of the disclosure process today.';
const red=redactPublicContacts(ex4);console.log('3a masque           :',red);
console.log('3b gateway accepte le texte masqué :',isPublicClassificationText(red,1200));
