import {lstatSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';import path from 'node:path';
function writeNew(vaultPath,name,content){
 if(!path.isAbsolute(vaultPath)||path.normalize(vaultPath)!==vaultPath)throw Error('RADAR_VAULT_INVALID');
 let current=path.parse(vaultPath).root;
 for(const part of vaultPath.slice(current.length).split('/').filter(Boolean)){current=path.join(current,part);const st=lstatSync(current);if(!st.isDirectory()||st.isSymbolicLink())throw Error('RADAR_VAULT_INVALID');}
 const obsidian=lstatSync(path.join(vaultPath,'.obsidian'));if(!obsidian.isDirectory()||obsidian.isSymbolicLink())throw Error('RADAR_VAULT_INVALID');
 for(const part of ['Ivan AI OS','radar']){current=path.join(current,part);if(!lstatSync(current,{throwIfNoEntry:false}))mkdirSync(current,{mode:0o700});const st=lstatSync(current);if(!st.isDirectory()||st.isSymbolicLink())throw Error('RADAR_VAULT_INVALID');}
 const file=path.join(current,name+'.md');try{writeFileSync(file,content,{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;const st=lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>20000||readFileSync(file,'utf8')!==content)throw Error('RADAR_NOTE_CONFLICT');}
}
export function projectRadarPage({vaultPath},page){
 writeNew(vaultPath,'radar-'+page.id,['---','type: radar','sensibilite: interne',`cree: ${page.at}`,'statut: propose','---',page.text,'','Catalogue préparé ; le reçu Telegram et les avis font foi dans la base locale. Aucun choix ni achat déduit.'].join('\n'));
}
export function projectRadarFeedback({vaultPath},row,feedback){
 writeNew(vaultPath,`avis-${row.id}-${feedback.seq}`,['---','type: feedback','sensibilite: interne',`sujet: ${row.id}`,`avis: ${feedback.verdict}`,`origine: ${feedback.origin}`,'---',`# ${row.item.title.replace(/[\r\n]/g,' ')}`,row.item.url,`Reçu : ${new Date(feedback.created).toISOString()}`,`Avis : ${feedback.verdict}`,`Raison : ${feedback.reason||'non fournie'}`,'Avis de pertinence seulement, jamais une validation factuelle ou une autorisation de transaction.'].join('\n'));
}
