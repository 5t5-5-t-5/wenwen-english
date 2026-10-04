// Cache the learning interface, not the large video or the user's recordings.
const PREFIX=`wenwen-mobile:${self.registration.scope}:`;
const CACHE=PREFIX+'20261004-fullscreen-v3.6';
const SHELL=['./index.html','./assets/wenwen-world-logo-v1.png','./apple-touch-icon.png','./assets/wenwen-world-icon-152-v1.png','./assets/wenwen-world-icon-167-v1.png','./assets/wenwen-world-icon-180-v1.png','./assets/wenwen-world-icon-192-v1.png','./assets/wenwen-world-icon-512-v1.png','./assets/wenwen-world-maskable-512-v1.png','./assets/wenwen-world-favicon-32-v1.png','./assets/wenwen-world-favicon-64-v1.png','./style.css','./app.js','./core.js','./paths.js','./fullscreen.js','./data.js','./ancient-data.js','./greenland-data.js','./trex-data.js','./assets/cover-t-rex-v3.jpg','./assets/t-rex-en-v3.vtt','./assets/t-rex-zh-v3.vtt','./assets/cover-greenland-shark-v2.jpg','./assets/greenland-shark-en-v2.vtt','./assets/greenland-shark-zh-v2.vtt','./courses.js','./assets/cover-ancient-ocean-v5.jpg','./assets/ancient-ocean-en-v5.vtt','./assets/ancient-ocean-zh-v5.vtt','./favicon.svg','./manifest.webmanifest','./assets/poster-v8.jpg','./assets/cover-sperm-whale-v8.jpg','./assets/en-v8.vtt','./assets/zh-v8.vtt','./assets/icon-180.png','./assets/icon-192.png','./assets/icon-512.png'];
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
