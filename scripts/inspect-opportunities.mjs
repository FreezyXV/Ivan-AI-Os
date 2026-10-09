import {readFileSync} from 'node:fs';
import {openDossiers} from '../shared/opportunity-dossier.mjs';
const settings=process.argv[2];let store;
try{
  if(!settings)throw Error();
  const config=JSON.parse(readFileSync(settings)).opportunities;
  if(!config)throw Error();
  store=openDossiers(config);console.log(JSON.stringify(store.summary()));
}catch{console.error('OPPORTUNITY_INVENTORY_UNAVAILABLE');process.exitCode=1;}
finally{store?.close();}
