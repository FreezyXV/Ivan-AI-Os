// Prepare immutable code and private candidates; do not restart or activate.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import path from 'node:path';
const [repository,commit,previousSettings]=process.argv.slice(2),home=homedir();
try{
  if(!path.isAbsolute(repository??'')||!path.isAbsolute(previousSettings??'')||!/^[a-f\d]{40}$/.test(commit??''))throw Error('OPPORTUNITY_PREPARE_ARGUMENTS');
  const vaultPath=path.join(home,'Ivan AI OS Brain/Obsidian/Ivan AI Os Notes');
  if(!lstatSync(vaultPath).isDirectory()||lstatSync(vaultPath).isSymbolicLink()||!existsSync(path.join(vaultPath,'.obsidian')))throw Error('OPPORTUNITY_VAULT_NOT_FOUND');
  const short=commit.slice(0,7),root=path.join(home,'.ivan-ai-os'),release=path.join(root,'releases','orchestrator-'+short),out=path.join(root,'mac-opportunity-'+short);
  if(existsSync(release)||existsSync(out))throw Error('OPPORTUNITY_CANDIDATE_EXISTS');
  const live=path.join(home,'.openclaw/openclaw.json'),bytes=readFileSync(live),config=JSON.parse(bytes),old=JSON.parse(readFileSync(previousSettings));
  const ownerId=old.target;
  if(!/^[1-9]\d{4,15}$/.test(ownerId??'')||!config.channels?.telegram?.allowFrom?.some(v=>String(v).replace(/^telegram:/,'')===ownerId)||config.channels.telegram.accounts)throw Error('OPPORTUNITY_OWNER_CONFIG_UNSUPPORTED');
  mkdirSync(release,{mode:0o700});mkdirSync(out,{mode:0o700});
  const archive=path.join(out,'source.tar');
  execFileSync('git',['archive','--format=tar','-o',archive,commit,'services','hooks','skills','shared','scripts','policies'],{cwd:repository,timeout:60000});
  execFileSync('tar',['-xf',archive,'-C',release],{timeout:60000});
  writeFileSync(path.join(release,'ivan-release.json'),JSON.stringify({sourceCommit:commit,activated:false}),{flag:'wx',mode:0o600});
  const opportunities={directory:path.join(root,'opportunities'),vaultPath,ownerId,accountId:'default'};
  const id='ivan-ai-os-opportunities';config.plugins??={};config.plugins.load??={};
  config.plugins.load.paths=[...(config.plugins.load.paths??[]).filter(v=>!v.endsWith('/hooks/openclaw/ivan-opportunities')),path.join(release,'hooks/openclaw/ivan-opportunities')];
  if(config.plugins.allow)config.plugins.allow=[...new Set([...config.plugins.allow,id])];
  config.plugins.entries??={};config.plugins.entries[id]={enabled:true,config:opportunities};
  const candidate=path.join(out,'openclaw-candidate.json'),settingsPath=path.join(out,'settings.json');
  writeFileSync(candidate,JSON.stringify(config,null,2),{flag:'wx',mode:0o600});
  writeFileSync(settingsPath,JSON.stringify({...old,sourceCommit:commit,releaseRoot:release,opportunities},null,2),{flag:'wx',mode:0o600});
  const proof={sourceCommit:commit,candidate,settingsPath,previousSettings,release,backupDir:out,
    expectedCurrentSha256:createHash('sha256').update(bytes).digest('hex'),activated:false};
  writeFileSync(path.join(out,'prepared.json'),JSON.stringify(proof,null,2),{flag:'wx',mode:0o600});
  console.log(JSON.stringify(proof));
}catch(error){console.error(/^[A-Z_]{3,60}$/.test(error.message)?error.message:'OPPORTUNITY_PREPARE_FAILED');process.exitCode=1;}
