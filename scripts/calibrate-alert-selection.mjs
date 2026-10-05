// Offline calibration of the alert selection policy from ONE recorded Jev run and labels
// fixed before measurement. No provider call. Thresholds are chosen on the "dev" set only
// and then reported on "holdout"; a policy is recommended only if it makes no false keep
// and drops no labelled keep on dev.
//   node scripts/calibrate-alert-selection.mjs <labels.json> <run.jsonl>
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {selectionOutcome} from '../services/alerts-runtime/src/pipeline.js';

const grid=[0,0.1,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9];
export function score(rows,policy){
  const m={};let n=0;
  for(const r of rows){const out=selectionOutcome(r.selection,policy);m[`${r.label}>${out}`]=(m[`${r.label}>${out}`]??0)+1;n++;}
  const get=k=>m[k]??0,keeps=get('keep>keep')+get('keep>review')+get('keep>skip');
  return {n,matrix:m,keepRecall:keeps?get('keep>keep')/keeps:null,
    falseKeep:get('skip>keep')+get('review>keep'),droppedKeep:get('keep>skip'),
    reviewShare:n?(get('keep>review')+get('review>review')+get('skip>review'))/n:null,
    exact:n?(get('keep>keep')+get('review>review')+get('skip>skip'))/n:null};
}
export function calibrate(rows){
  const dev=rows.filter(r=>r.set==='dev'),holdout=rows.filter(r=>r.set==='holdout');
  const withProb=dev.some(r=>r.selection.probabilities);
  const candidates=[{keepMinConfidence:0.75,skipMinConfidence:0.75}];
  for(const k of grid)for(const s of grid)candidates.push({keepMinConfidence:k,skipMinConfidence:s});
  if(withProb)for(const kp of grid.filter(x=>x>0))for(const sp of grid.filter(x=>x>0))candidates.push({keepMinConfidence:1,skipMinConfidence:1,keepMinProbability:kp,skipMinProbability:sp});
  const safe=candidates.map(policy=>({policy,dev:score(dev,policy)})).filter(c=>c.dev.falseKeep===0&&c.dev.droppedKeep===0);
  // Most keeps found, then fewest items left in review; among equivalent policies take the
  // middle of the ordered equivalent grid policies. This is a deterministic tie-break,
  // not a proof of the largest margin or future precision.
  safe.sort((a,b)=>(b.dev.keepRecall??0)-(a.dev.keepRecall??0)||a.dev.reviewShare-b.dev.reviewShare);
  const tied=safe.filter(c=>c.dev.keepRecall===safe[0]?.dev.keepRecall&&c.dev.reviewShare===safe[0]?.dev.reviewShare)
    .sort((a,b)=>a.policy.keepMinConfidence-b.policy.keepMinConfidence||a.policy.skipMinConfidence-b.policy.skipMinConfidence||
      (a.policy.keepMinProbability??0)-(b.policy.keepMinProbability??0));
  const best=tied[Math.floor((tied.length-1)/2)];
  return {probabilitiesAvailable:withProb,current:{dev:score(dev,candidates[0]),holdout:score(holdout,candidates[0])},
    recommended:best?{policy:best.policy,dev:best.dev,holdout:score(holdout,best.policy)}:null};
}
export function join(labels,run){
  if(!Array.isArray(labels?.labels)||!Array.isArray(run)||new Set(labels.labels.map(l=>l.id)).size!==labels.labels.length||
    labels.labels.some(l=>!['dev','holdout'].includes(l.set)||!['keep','review','skip'].includes(l.label)))throw Error('ALERT_CALIBRATION_LABELS_INVALID');
  const byId=new Map(labels.labels.map(l=>[l.id,l])),seen=new Set(),rows=[];
  for(const r of run){if(seen.has(r.id)||r.error||!byId.has(r.id))continue;seen.add(r.id);// first repetition only
    rows.push({id:r.id,set:byId.get(r.id).set,label:byId.get(r.id).label,selection:{decision:r.decision,confidence:r.confidence,...(r.probabilities?{probabilities:r.probabilities}:{})}});}
  if(rows.length!==byId.size||rows.some(r=>!['keep','review','skip'].includes(r.selection.decision)||!Number.isFinite(r.selection.confidence)||r.selection.confidence<0||r.selection.confidence>1))throw Error('ALERT_CALIBRATION_INCOMPLETE');
  return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [labelsPath,runPath]=process.argv.slice(2);
  const labels=JSON.parse(readFileSync(labelsPath,'utf8')),run=readFileSync(runPath,'utf8').trim().split('\n').map(l=>JSON.parse(l));
  console.log(JSON.stringify(calibrate(join(labels,run)),null,1));
}
