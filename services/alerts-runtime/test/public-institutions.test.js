import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverProcurement} from '../src/public-procurement.js';
import {readPublicStatistics} from '../src/public-statistics.js';
import {readInstitutionalSnapshot,validateItem} from '../src/context.js';

const now = new Date('2026-11-19T16:00:00Z');

test('DILA retains a dated notice and separates buyer demand from the result of the procedure', async () => {
  const record = (id, folder, nature) => ({idweb:id, contractfolderid:folder, objet:'Gestion numérique des dossiers',
    dateparution:'2026-11-19', nomacheteur:'Collectivité fictive', nature, nature_libelle:'Avis de marché', etat:'INITIAL',
    url_avis:'https://www.boamp.fr/pages/avis/?q=idweb:'+id});
  const {seeds,errors} = await discoverProcurement({now, fetchImpl:async url=>{
    assert.equal(new URL(url).hostname,'boamp-datadila.opendatasoft.com');
    return {text:JSON.stringify({results:[record('26-1','p1','APPEL_OFFRE'),record('26-2','p1','APPEL_OFFRE'),
      record('26-3','p2','ATTRIBUTION'),{...record('26-4','p3','APPEL_OFFRE'),dateparution:'2026-11-31'}]})};
  }});
  assert.equal(errors.length,0);
  assert.deepEqual(seeds.map(s=>s.procurement.evidenceType),['demande','resultat']);
  assert.match(seeds[0].text,/Montant attribué et paiement restent à vérifier/);
  assert.equal(seeds[1].sources[0].publishedAt,'2026-11-19T00:00:00.000Z');
});

test('statistical pages require publication evidence and keep snippets distinct from publication dates', async () => {
  const content = 'La publication statistique expose un résultat daté et sa méthodologie. '.repeat(35);
  const feeds = await readPublicStatistics({now, fetchImpl:async url=>{
    const path = new URL(url).pathname;
    const text=path==='/fr/statistiques/2107840'?'<a href="/fr/statistiques/9100001">Insee</a>':
      path.endsWith('/euro-indicators')?'<a href="/eurostat/web/products-euro-indicators/w/2-18112026-ap">Publication</a><a href="/eurostat/web/products-euro-indicators/w/1-19112026-ap">Sans date</a>':
      '<title>Résultat statistique</title>'+(path.endsWith('9100001')?'<span id="libelle-details"><span data-i18n="[html]produit.bandeau-bleu.paru-le-impression">Paru le</span></span>19/11/2026':
        path.endsWith('2-18112026-ap')?'<meta property="article:published_time" content="2026-11-18T10:00:00Z">':'')+
        '<article>'+content+'</article>';
    return {url,text,contentType:'text/html',readAt:now.toISOString()};
  }});
  assert.deepEqual(feeds.flatMap(feed=>feed.items).map(raw=>{
    const item=validateItem(raw);
    const snapshot=readInstitutionalSnapshot(item);
    assert.equal(snapshot.text.length,1200);
    assert.equal(item.excerptTruncated,true);
    return snapshot.publishedAt;
  }),['2026-11-19T00:00:00.000Z','2026-11-18T10:00:00.000Z']);
  assert.deepEqual(feeds[1].errors,['PUBLIC_RESEARCH_STATISTICS_DATE_UNVERIFIED']);
});
