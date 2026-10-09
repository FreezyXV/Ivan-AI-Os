// A durable public opportunity and Ivan's choices. SQLite is authoritative;
// Obsidian is an immutable projection that can be retried after a crash.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,lstatSync,readFileSync,writeFileSync,openSync,closeSync,constants} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {validateItem} from '../services/alerts-runtime/src/context.js';
import {validateBusinessFiche} from '../services/alerts-runtime/src/business-fiche.js';
import {renderBrief} from '../services/alerts-runtime/src/pipeline.js';
import {briefBinding,validateVerification} from '../services/alerts-runtime/src/verification.js';

const reject=code=>{throw Object.assign(new Error(code),{code});};
const hash=value=>createHash('sha256').update(value).digest('hex');
const secret=/\b(?:apikey_[\w]{20,}|gh[pousr]_[\w]{20,}|(?:sk|rk)-[\w-]{16,}|Bearer\s+[\w.~+/-]{20,}|\d{8,10}:[\w-]{35})\b|-----BEGIN .*PRIVATE KEY-----/i;
const line=s=>String(s).replace(/[\r\n]/g,' ').trim();
const safeId=id=>typeof id==='string'&&/^[a-f\d]{12}$/.test(id);
function directoryTree(root,create=false){
  if(typeof root!=='string'||!path.isAbsolute(root)||path.normalize(root)!==root)reject('DOSSIER_PATH_INVALID');
  let current=path.parse(root).root;
  for(const part of root.slice(current.length).split('/').filter(Boolean)){
    current=path.join(current,part);let st=lstatSync(current,{throwIfNoEntry:false});
    if(!st&&create){mkdirSync(current,{mode:0o700});st=lstatSync(current);}
    if(!st?.isDirectory()||st.isSymbolicLink())reject('DOSSIER_PATH_INVALID');
  }
  return root;
}
function newOrIdentical(file,content){
  try{writeFileSync(file,content,{flag:'wx',mode:0o600});}
  catch(error){
    if(error.code!=='EEXIST')throw error;
    const st=lstatSync(file);
    if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>64000)reject('DOSSIER_NOTE_CONFLICT');
    const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);
    try{if(readFileSync(fd,'utf8')!==content)reject('DOSSIER_NOTE_CONFLICT');}finally{closeSync(fd);}
  }
}
export function openDossiers({directory,vaultPath,now=()=>Date.now()}){
  directoryTree(vaultPath);
  const settings=lstatSync(path.join(vaultPath,'.obsidian'),{throwIfNoEntry:false});
  if(!settings?.isDirectory()||settings.isSymbolicLink())reject('DOSSIER_VAULT_INVALID');
  directoryTree(directory,true);
  const st=lstatSync(directory);
  if(st.uid!==process.getuid?.()||st.mode&0o077)reject('DOSSIER_STORE_INVALID');
  const file=path.join(directory,'opportunities.sqlite');
  try{closeSync(openSync(file,'wx',0o600));}catch(e){if(e.code!=='EEXIST')throw e;}
  const fs=lstatSync(file);
  if(!fs.isFile()||fs.isSymbolicLink()||fs.nlink!==1||fs.uid!==process.getuid?.()||fs.mode&0o077)reject('DOSSIER_STORE_INVALID');
  const db=new DatabaseSync(file);
  db.exec(`PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS dossiers(id TEXT PRIMARY KEY,source_id TEXT UNIQUE NOT NULL,payload TEXT NOT NULL,created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS choices(id TEXT NOT NULL,revision INTEGER NOT NULL,choice TEXT NOT NULL,reason TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(id,revision));`);
  const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}};
  const row=id=>{if(!safeId(id))reject('DOSSIER_ID_INVALID');const r=db.prepare('SELECT * FROM dossiers WHERE id=?').get(id);if(!r)reject('DOSSIER_NOT_FOUND');return {...r,payload:JSON.parse(r.payload)};};
  const choices=id=>db.prepare('SELECT * FROM choices WHERE id=? ORDER BY revision').all(id);
  const notePath=(id,revision)=>`Ivan AI OS/inbox/opportunite-${id}-v${revision}.md`;
  function project(id){
    const r=row(id),history=choices(id),p=r.payload,f=p.brief.business_fiche;
    const revision=history.length,last=history.at(-1),at=last?.created??r.created;
    const choice=last?{tester:'tester',veille:'garder en veille',ecarter:'écarter'}[last.choice]:'en attente de ta décision';
    const front=['---','type: decision',`titre: ${JSON.stringify(p.item.title)}`,'sources:',`  - ${p.item.url}`,'sensibilite: interne','agent: ivan-business',`cree: ${new Date(at).toISOString().slice(0,10)}`,'statut: propose',`opportunite: ${id}`,`revision: ${revision}`,'---'];
    const paragraphs=[...front,`# ${p.item.title}`,'',`Dossier ${id} · version ${revision}. Statut : ${choice}.`,
      'La proposition reste exploratoire. Une décision de suivi ne donne aucune autorisation de dépense, contact ou publication.','',
      '## Problème et public',f.probleme,`Acheteur envisagé (${f.acheteur.statut}) : ${f.acheteur.profil}.`,'',
      '## Faits et sources',...p.brief.facts.map(v=>`- ${v.summary}\n  > ${line(v.quote)}`),
      `Source : ${p.item.url}\nPublication : ${p.item.publishedAt}. Lecture : ${p.item.readAt}.`,
      ...(p.brief.businessEditorialWarnings?.length?[`Contrôles éditoriaux à revoir : ${p.brief.businessEditorialWarnings.join(', ')}.`]:[]),'',
      '## Hypothèse et inconnues',f.hypothese,f.limites,...(p.brief.uncertainty?[p.brief.uncertainty]:[]),'',
      '## Intérêt pour Ivan',p.brief.utility,'',
      '## Objections et critère d’abandon',...f.objections.map(v=>`- ${v}`),
      'Abandon du test si les preuves publiques supplémentaires ne confirment pas le besoin ; aucun marché ni paiement présumé.','',
      '## Plus petit test, effort et coût',f.prochainTest.description,
      `Fenêtre proposée : ${f.prochainTest.dureeJours} jours au maximum ; charge de travail non estimée.`,
      `Coût direct du test proposé : ${f.prochainTest.coutEur} € ; coût des appels de préparation non exposé par le fournisseur natif, à mesurer séparément.`,
      'Test réversible et sans contact de tiers.','',
      '## Décision et prochaine action',
      ...(last?[`Choix d’Ivan : ${choice}.`,`Raison : ${last.reason}`,`Reçue via commande Telegram autorisée le ${new Date(last.created).toISOString()}.`]:['Choix : en attente. Raison : non fournie.']),
      last?.choice==='tester'?'Prochaine action : préparer le test décrit, sans l’exécuter hors du périmètre autorisé.':last?.choice==='veille'?'Prochaine action : attendre de nouvelles preuves avant de reproposer.':last?.choice==='ecarter'?'Prochaine action : fermer cette proposition ; conserver les preuves.':'Prochaine action : Ivan choisit tester, veille ou écarter et donne sa raison.',
      '',...Array.from({length:revision},(_,v)=>`Version précédente : [[opportunite-${id}-v${v}]].`),''];
    const content=paragraphs.join('\n');if(content.length>24000||secret.test(content))reject('DOSSIER_CONTENT_REFUSED');
    const dest=path.join(vaultPath,'Ivan AI OS','inbox');directoryTree(dest,true);
    newOrIdentical(path.join(vaultPath,notePath(id,revision)),content);
    return {id,revision,note:notePath(id,revision),choice:last?.choice??null};
  }
  return {
    publish(source){
      const item=validateItem(source.item),brief=source.brief;
      if(item.sourceStatus!=='read'||brief?.goal!=='business'||!['ready','delivered'].includes(source.state))reject('DOSSIER_SOURCE_INVALID');
      const sourceId=hash(item.url);
      if(source.id!==sourceId)reject('DOSSIER_SOURCE_INVALID');
      const checked=validateBusinessFiche(item,brief.business_fiche);
      if(renderBrief(item,brief)!==brief.message)reject('DOSSIER_SOURCE_INVALID');
      const {message,generation,contextVersion,selection,verification,businessEditorialWarnings,...proposal}=brief;
      if(verification?.decision!=='approve'||verification.binding!==briefBinding(item,proposal))reject('DOSSIER_REVIEW_REQUIRED');
      validateVerification({decision:verification.decision,issues:verification.issues});
      const payload={item,brief:{...brief,businessEditorialWarnings:checked.editorialWarnings}},encoded=JSON.stringify(payload),id=sourceId.slice(0,12);
      if(encoded.length>24000||secret.test(encoded))reject('DOSSIER_CONTENT_REFUSED');
      tx(()=>{const prior=db.prepare('SELECT * FROM dossiers WHERE id=? OR source_id=?').get(id,sourceId);
        if(prior&&(prior.source_id!==sourceId||prior.payload!==encoded))reject('DOSSIER_SOURCE_CONFLICT');
        if(!prior)db.prepare('INSERT INTO dossiers VALUES(?,?,?,?)').run(id,sourceId,encoded,now());});
      return project(id);
    },
    get(id){const r=row(id);return {id,title:r.payload.item.title,brief:r.payload.brief,decisions:choices(id),content_is_untrusted_data:true};},
    list(){return db.prepare('SELECT id FROM dossiers ORDER BY created DESC LIMIT 10').all().map(({id})=>{const r=row(id),last=choices(id).at(-1);return {id,title:r.payload.item.title,choice:last?.choice??null,revision:last?.revision??0};});},
    summary(){
      const total=db.prepare('SELECT count(*) AS n FROM dossiers').get().n;
      const current=db.prepare(`SELECT choice,count(*) AS n FROM choices c WHERE revision=(SELECT max(revision) FROM choices x WHERE x.id=c.id) GROUP BY choice`).all();
      const choicesCount=Object.fromEntries(current.map(r=>[r.choice,r.n]));
      const latency=db.prepare(`SELECT avg(c.created-d.created) AS meanMs FROM dossiers d JOIN choices c ON c.id=d.id AND c.revision=1`).get().meanMs;
      return {dossiers:total,awaitingDecision:total-current.reduce((n,r)=>n+r.n,0),choices:choicesCount,firstDecisionMeanMs:latency??null,
        nativeCostEur:null,timeSavedMinutes:null};
    },
    decide(id,choice,reason){
      if(!['tester','veille','ecarter'].includes(choice)||typeof reason!=='string'||!reason.trim()||reason.length>400||/[\x00-\x1f\x7f]/.test(reason)||secret.test(reason))reject('DOSSIER_DECISION_INVALID');
      row(id);reason=reason.trim();
      tx(()=>{const prior=choices(id).at(-1);if(prior?.choice===choice&&prior.reason===reason)return;
        db.prepare('INSERT INTO choices VALUES(?,?,?,?,?)').run(id,(prior?.revision??0)+1,choice,reason,now());});
      // Choice is committed even if the projection fails. A repeated identical
      // command retries the same version without recording another decision.
      try{return {...project(id),projected:true};}catch(e){return {id,recorded:true,projected:false,error_code:/^DOSSIER_[A-Z_]+$/.test(e.code??'')?e.code:'DOSSIER_PROJECTION_FAILED'};}
    },
    project,
    close(){db.close();}
  };
}
