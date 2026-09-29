import {readFileSync,writeFileSync,renameSync,lstatSync,unlinkSync} from 'node:fs';
import path from 'node:path';import {randomUUID}from'node:crypto';
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MANAGERS=['business','career','engineering','finance','knowledge','system'];
const KEYS=new Set(['id','root_run','manager','provider','created_at','updated_at','manager_run','manager_child','worker_run','manager_returned','worker_returned','delivered','delivery_queued','delivered_at','failure']);
export function createMissionStore(file) {
 if(!path.isAbsolute(file))throw new Error('MISSION_STORE_INVALID');
 const parent=lstatSync(path.dirname(file));if(!parent.isDirectory()||parent.isSymbolicLink()||parent.uid!==process.getuid()||(parent.mode&0o077))throw new Error('MISSION_STORE_INVALID');
 function validate(rows){if(!Array.isArray(rows)||rows.length>200||rows.some(r=>!r||typeof r!=='object'||Object.keys(r).some(k=>!KEYS.has(k))||!UUID.test(r.id??'')||!UUID.test(r.root_run??'')||!MANAGERS.includes(r.manager)||!['jev','table','mock'].includes(r.provider)||['created_at','updated_at'].some(k=>!Number.isSafeInteger(r[k])||r[k]<0)||['manager_run','manager_child','worker_run'].some(k=>r[k]!=null&&!UUID.test(r[k]))||['manager_returned','worker_returned','delivered','delivery_queued'].some(k=>r[k]!==undefined&&typeof r[k]!=='boolean')||(r.failure!==undefined&&!/^(manager|worker)_(error|timeout|killed)$/.test(r.failure))))throw new Error('MISSION_STORE_INVALID');return rows;}
 let initial=[];
 const st=lstatSync(file,{throwIfNoEntry:false});if(st){if(!st.isFile()||st.nlink!==1||st.uid!==process.getuid()||(st.mode&0o077)||st.size>200000)throw new Error('MISSION_STORE_INVALID');initial=validate(JSON.parse(readFileSync(file,'utf8')));}
 return {initial,persist(rows){const data=JSON.stringify(validate(rows));if(data.length>200000)throw new Error('MISSION_STORE_FULL');const temp=path.join(path.dirname(file),'.missions-'+randomUUID()+'.tmp');try{writeFileSync(temp,data,{flag:'wx',mode:0o600});renameSync(temp,file);}finally{try{unlinkSync(temp)}catch{}}}};
}
