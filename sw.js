// Versioned code and small reading assets are reusable. Videos stay on demand.
const PREFIX=`wenwen-mobile:${self.registration.scope}:`;
const RELEASE='27e47321a1f0';
const CACHE=PREFIX+RELEASE,MEDIA=PREFIX+'reading-media-v1';
// Course and reader data are included in the single application bundle.
const SHELL=['./index.html','./app.27e47321a1f0.js','./style.27e47321a1f0.css','./books.27e47321a1f0.css','./manifest.webmanifest','./assets/wenwen-world-icon-180-v1.png'];
const scopeURL=path=>new URL(path,self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(SHELL.map(path=>new Request(scopeURL(path),{cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE&&name!==MEDIA)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='GET_APP_RELEASE')event.source?.postMessage({type:'APP_RELEASE',release:RELEASE});});
async function ranged(response,range){
 const bytes=await response.arrayBuffer(),size=bytes.byteLength,match=/^bytes=(\d*)-(\d*)$/.exec(range);
 let start=0,end=size-1;
 if(match&&(match[1]||match[2])){start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));end=match[1]&&match[2]?Math.min(Number(match[2]),size-1):size-1;}else start=size;
 if(start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 const headers=new Headers(response.headers);headers.delete('Content-Encoding');headers.set('Content-Length',String(end-start+1));headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Accept-Ranges','bytes');return new Response(bytes.slice(start,end+1),{status:206,headers});
}
async function cacheMedia(cache,key,response){
 const partial=response.headers.get('Content-Range');
 if(response.status!==200&&!(response.status===206&&/^bytes 0-\d+\/\d+$/.test(partial||'')&&Number(partial.match(/-(\d+)/)[1])+1===Number(partial.split('/')[1])))return;
 const declared=Number(response.headers.get('Content-Length'));if(declared>6*1024*1024)return;
 const bytes=await response.arrayBuffer();if(bytes.byteLength>6*1024*1024)return;
 const headers=new Headers(response.headers);headers.delete('Content-Range');headers.delete('Content-Encoding');headers.set('Content-Length',String(bytes.byteLength));headers.set('Accept-Ranges','bytes');
 await cache.put(key,new Response(bytes,{status:200,headers}));
 // Bounded persistent cache; never includes recordings or videos.
 const keys=await cache.keys();for(const old of keys.slice(0,Math.max(0,keys.length-128)))await cache.delete(old);
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope)||/\.mp4$/i.test(url.pathname))return;
 const media=/\/assets\/[^/]+-fast1\.(webp|mp3|pdf)$/.test(url.pathname);
 // Legacy PDF/audio navigation must never overwrite the application entry.
 if(!media&&/\.(mp3|pdf)$/i.test(url.pathname))return;
 if(media){
  let storing=Promise.resolve();
  const responseJob=(async()=>{
   const cache=await caches.open(MEDIA),key=url.origin+url.pathname,cached=await cache.match(key),range=request.headers.get('range');
   if(cached)return range?ranged(cached,range):cached;
   const response=await fetch(request);if(response.ok)storing=cacheMedia(cache,key,response.clone()).catch(()=>{});return response;
  })();
  event.respondWith(responseJob);event.waitUntil?.(responseJob.then(()=>storing).catch(()=>{}));return;
 }
 const basePath=new URL(self.registration.scope).pathname;
 const navigation=request.mode==='navigate'&&(url.pathname===basePath||url.pathname===basePath+'index.html'),allowed=SHELL.some(path=>new URL(path,self.registration.scope).pathname===url.pathname);
 if(!allowed&&!navigation)return;
 if(navigation){
  const key=scopeURL('./index.html');
  const refresh=(async()=>{const response=await fetch(request,{cache:'no-cache'});if(response.ok){const cache=await caches.open(CACHE);try{await cache.put(key,response.clone());}catch{}}return response;})().catch(()=>null);
  event.waitUntil?.(refresh.then(()=>{}));
  event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(key);if(cached)return cached;return (await refresh)||new Response('Please reconnect to open your stories.',{status:503});})());
 }else{
  event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)try{await cache.put(request,response.clone());}catch{}return response;})());
 }
});
