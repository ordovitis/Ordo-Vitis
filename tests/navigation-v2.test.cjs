const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),release=JSON.parse(fs.readFileSync(path.join(root,'release.json'),'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(([,a,c])=>!a.includes('src=')&&c.trim()).map(([,a,c])=>c);
const addon=fs.readFileSync(path.join(root,release.assets.script),'utf8');
test('Les scripts métier et de connexion sont conservés sans changement',()=>{
 assert.deepEqual(scripts.map(hash),release.inlineScriptHashes);
 for(const script of [...scripts,addon])assert.doesNotThrow(()=>new vm.Script(script));
 assert.ok(html.includes('supabase.createClient(SUPABASE_URL, SUPABASE_ANON)'));
});
test('Le paquet public exclut la configuration et les restrictions du test local',()=>{
 assert.doesNotMatch(html+addon,/ovTest|OV_TEST|LOCAL_TEST_UI|authNotice|test-config\.js|test-guard\.js|ov-test-organisation-v2-auth|Domaine de Développement|Ordo Vitis TEST/);
 assert.ok(html.includes('name="ov-release" content="'+release.version+'"'));
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).short_name,'Ordo Vitis');
});
test('Toutes les ressources propres à la nouvelle interface et les icônes existent',()=>{
 for(const url of Object.values(release.assets)){const content=fs.readFileSync(path.join(root,url));assert.ok(content.length>0);assert.ok(url.includes(hash(content).slice(0,12)),'Chemin versionné selon son contenu');}
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 for(const icon of manifest.icons){const content=fs.readFileSync(path.join(root,icon.src));assert.equal(content.subarray(1,4).toString(),'PNG');}
 assert.ok(html.lastIndexOf('<script src="'+release.assets.script+'">')>html.lastIndexOf('async function ovLoadProduits'));
});
test('Le cache inclut la nouvelle interface sans activer une mise à jour pendant la saisie',async()=>{
 const listeners={},added=[],skips=[];
 const context={URL,console:{log(){},warn(){}},caches:{open:async()=>({add:async url=>added.push(url)})},self:{addEventListener:(type,fn)=>listeners[type]=fn,skipWaiting:()=>skips.push(true)}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'service-worker.js'),'utf8'),context);
 let install;listeners.install({waitUntil:p=>install=p});await install;
 for(const url of Object.values(release.assets))assert.ok(added.includes(url));
 assert.deepEqual(skips,[],'La mise à jour attend une action explicite');
 for(const request of [{url:'https://example.supabase.co/rest/v1/parcelles',method:'GET'},{url:'https://ordovitis.fr/action',method:'POST'}])listeners.fetch({request,respondWith:()=>assert.fail('Pas de mise en cache des données ni des écritures')});
 listeners.message({data:{type:'SKIP_WAITING'}});assert.equal(skips.length,1);
});
