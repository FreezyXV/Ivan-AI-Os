// launchctl bootout can return before the previous job has finished unloading.
// Retry only bootstrap's transient EIO, with a short bound; never sudo or change
// the service label/domain to work around an actual configuration error.
export async function bootstrapWithRetry({run,domain,plist,pause=ms=>new Promise(r=>setTimeout(r,ms)),attempts=8}){
 if(typeof run!=='function'||!/^gui\/\d+$/.test(domain)||typeof plist!=='string'||!plist.startsWith('/')||!Number.isInteger(attempts)||attempts<1||attempts>8)throw Error('LAUNCH_AGENT_RELOAD_INVALID');
 for(let attempt=0;attempt<attempts;attempt++)try{
  await run('/bin/launchctl',['bootstrap',domain,plist]);return;
 }catch(error){
  if(error.code!==5||attempt===attempts-1)throw error;
  await pause(1000);
 }
}
