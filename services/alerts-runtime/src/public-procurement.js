import {fetchPublic} from './research-web.js';
import {researchHash} from './research-contract.js';
import {suspiciousSource} from './context.js';

const endpoint = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records';
const fields = 'idweb,contractfolderid,objet,dateparution,nomacheteur,nature,nature_libelle,etat,type_marche,url_avis';
const clear = value => typeof value==='string' && !/[\x00-\x1f\x7f@]/.test(value) && !suspiciousSource(value)
  ? value.trim().replace(/\s+/g,' ') : '';
const procurementTerms = /donn[ée]es|logiciel|num[ée]ri|digital|suivi|gestion|maintenance|documentation|administrati|formation|collecte|contr[oô]le|audit|factur|d[ée]mat[ée]rialis|assistance|communication/i;

function procurementSeed(record, now) {
  const noticeId = record?.idweb;
  const title = clear(record?.objet).slice(0,180), buyer = clear(record?.nomacheteur).slice(0,180);
  if(typeof noticeId!=='string'||!/^\d{2}-\d{1,9}$/.test(noticeId)||!title||!buyer||!/^[\w-]{1,80}$/.test(record.contractfolderid??''))return null;
  const day = record.dateparution;
  if(typeof day!=='string'||!/^\d{4}-\d\d-\d\d$/.test(day))return null;
  const date = new Date(`${day}T00:00:00.000Z`);
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==day||now-date>14*86400000||date-now>300000)return null;
  const nature = typeof record.nature==='string'?record.nature:'';
  const evidenceType = nature==='APPEL_OFFRE'?'demande':'resultat';
  if(!['APPEL_OFFRE','ATTRIBUTION','RESULTAT','AVIS_RESULTAT'].includes(nature)||!/^(INITIAL|RECTIFICATIF)$/.test(record.etat??''))return null;
  const url = `https://www.boamp.fr/pages/avis/?q=idweb:${noticeId}`;
  if(record.url_avis!==url)return null;
  const marketKey = researchHash([buyer.toLowerCase(),record.contractfolderid]).slice(0,20);
  const text = [
    `BOAMP (DILA) · Avis ${noticeId} publié le ${day}.`,
    `Acheteur public · ${buyer}.`,
    `Objet publié · ${title}.`,
    `Type d’avis · ${clear(record.nature_libelle).slice(0,120)||nature}.`,
    evidenceType==='demande'?'L’avis établit une demande publique. Montant attribué et paiement restent à vérifier.':
      'La notice est un avis de résultat. Son issue, le montant attribué et le paiement demandent la lecture du document complet.'
  ].join('\n');
  const publishedAt = date.toISOString(), readAt = now.toISOString();
  return {topic:'business',category:'business',title,anchorUrl:url,text,readAt,publishedAt,sourceType:'procurement',
    revision:`boamp-${marketKey}-${evidenceType}`,procurement:{marketKey,evidenceType,noticeId},
    sources:[{id:researchHash(url),url,title,text,readAt,publishedAt,kind:'primary'}]};
}

export async function discoverProcurement({now=new Date(),fetchImpl=fetchPublic,maxNotices=3}={}) {
  if(!Number.isInteger(maxNotices)||maxNotices<1||maxNotices>5||!(now instanceof Date)||!Number.isFinite(+now))throw Error('PUBLIC_RESEARCH_BOAMP_CONFIG_INVALID');
  const url = new URL(endpoint);
  const since = new Date(+now-10*86400000).toISOString().slice(0,10);
  url.search = new URLSearchParams({select:fields,where:`dateparution >= "${since}" AND type_marche = "SERVICES"`,order_by:'dateparution DESC,idweb DESC',limit:'24'});
  try {
    const response = await fetchImpl(url.href,{timeoutMs:8000,maxBytes:200000});
    const {results} = JSON.parse(response.text);
    if(!Array.isArray(results)||results.length>24)throw Error('PUBLIC_RESEARCH_BOAMP_RESPONSE_INVALID');
    const seeds=[],seen=new Set();
    for(const record of results){
      const seed=procurementSeed(record,now);
      if(!seed||!procurementTerms.test(seed.title)||seen.has(seed.procurement.marketKey))continue;
      seen.add(seed.procurement.marketKey);seeds.push(seed);
      if(seeds.length===maxNotices)break;
    }
    return {seeds,errors:[],requests:1};
  } catch(error) {
    return {seeds:[],errors:[{code:/^PUBLIC_RESEARCH_[A-Z_]+$/.test(error?.code??error?.message??'')?(error.code??error.message):'PUBLIC_RESEARCH_BOAMP_UNAVAILABLE'}],requests:1};
  }
}
