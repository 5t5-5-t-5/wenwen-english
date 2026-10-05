// Cache the learning interface, not large videos, audio or PDFs or the user's recordings.
const PREFIX=`wenwen-mobile:${self.registration.scope}:`;
const RELEASE='f66b8fbe0e68';
const CACHE=PREFIX+RELEASE;
const SHELL=['./index.html','./assets/wenwen-world-logo-v1.png','./apple-touch-icon.png','./assets/wenwen-world-icon-152-v1.png','./assets/wenwen-world-icon-167-v1.png','./assets/wenwen-world-icon-180-v1.png','./assets/wenwen-world-icon-192-v1.png','./assets/wenwen-world-icon-512-v1.png','./assets/wenwen-world-maskable-512-v1.png','./assets/wenwen-world-favicon-32-v1.png','./assets/wenwen-world-favicon-64-v1.png','./style.f66b8fbe0e68.css','./app.f66b8fbe0e68.js','./core.f66b8fbe0e68.js','./paths.f66b8fbe0e68.js','./data.f66b8fbe0e68.js','./ancient-data.f66b8fbe0e68.js','./greenland-data.f66b8fbe0e68.js','./trex-data.f66b8fbe0e68.js','./carnotaurus-data.f66b8fbe0e68.js','./assets/cover-carnotaurus-v2.jpg','./assets/carnotaurus-en-v2.vtt','./assets/carnotaurus-zh-v2.vtt','./assets/cover-t-rex-v4.jpg','./assets/t-rex-en-v4.vtt','./assets/t-rex-zh-v4.vtt','./assets/cover-greenland-shark-v3.jpg','./assets/greenland-shark-en-v3.vtt','./assets/greenland-shark-zh-v3.vtt','./courses.f66b8fbe0e68.js','./assets/cover-ancient-ocean-v6.jpg','./assets/ancient-ocean-en-v6.vtt','./assets/ancient-ocean-zh-v6.vtt','./favicon.svg','./manifest.webmanifest','./assets/cover-deep-sea-v9.jpg','./assets/en-v9.vtt','./assets/zh-v9.vtt','./assets/icon-180.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL.map(path=>new Request(new URL(path,self.registration.scope).href,{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  if(event.data?.type==='GET_APP_RELEASE')event.source?.postMessage({type:'APP_RELEASE',release:RELEASE});
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope)||request.headers.has('range')||/\.(mp4|mp3|pdf)$/i.test(url.pathname))return;
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
