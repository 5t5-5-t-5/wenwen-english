// Cache the learning interface, not the large video or the user's recordings.
const PREFIX=`wenwen-mobile:${self.registration.scope}:`;
const CACHE=PREFIX+'20261002-v1';
const SHELL=['./index.html','./style.css','./app.js','./core.js','./paths.js','./data.js','./favicon.svg','./manifest.webmanifest','./assets/poster.jpg','./assets/en.vtt','./assets/zh.vtt','./assets/icon-180.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL.map(path=>new URL(path,self.registration.scope).href));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope)||request.headers.has('range')||url.pathname.endsWith('.mp4'))return;
  const allowed=SHELL.some(path=>new URL(path,self.registration.scope).pathname===url.pathname);
  if(!allowed&&request.mode!=='navigate')return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request,{cache:'no-cache'});
      if(response.ok){
        const key=request.mode==='navigate'?new URL('./index.html',self.registration.scope).href:request;
        await cache.put(key,response.clone());
      }
      return response;
    }catch{
      const fallback=await cache.match(request.mode==='navigate'?new URL('./index.html',self.registration.scope).href:request);
      return fallback||new Response('网络连接已断开，请联网后重试。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
