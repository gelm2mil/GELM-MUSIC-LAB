const CACHE='gt-gelm-player-v13';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/icon.svg','./letras.html','./musica.json','./lyrics-index.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==location.origin)return;
 const path=url.pathname;
 const networkFirst=['/app.js','/musica.json','/index.html','/styles.css','/manifest.webmanifest'].some(item=>path.endsWith(item));
 if(networkFirst){
  event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
   return response;
  }).catch(()=>caches.match(request).then(cached=>cached||Response.error())));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
  if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
  return response;
 }).catch(()=>caches.match('./index.html'))));
});