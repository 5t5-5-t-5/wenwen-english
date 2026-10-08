// Small sentence clips only. Keep the next pages ready without downloading a whole library.
const clips=new Map(),LIMIT=18;
export function readyAudio(url){return clips.get(url)?.objectURL||url;}
export function warmAudio(url){
 if(clips.has(url))return clips.get(url).promise;
 const controller=new AbortController(),entry={controller,objectURL:null,promise:null};clips.set(url,entry);
 while(clips.size>LIMIT){const [key,old]=clips.entries().next().value;clips.delete(key);old.controller.abort();if(old.objectURL)URL.revokeObjectURL(old.objectURL);}
 const timer=setTimeout(()=>controller.abort(),20000);
 entry.promise=fetch(url,{signal:controller.signal,cache:'force-cache'}).then(async response=>{
  if(!response.ok)throw Error('Audio unavailable');const blob=await response.blob();if(blob.size>350000)throw Error('Not a sentence clip');
  if(clips.get(url)!==entry)return;entry.objectURL=URL.createObjectURL(blob);return entry.objectURL;
 }).catch(()=>{if(clips.get(url)===entry)clips.delete(url);}).finally(()=>clearTimeout(timer));
 return entry.promise;
}

// Load only pictures close to the viewport; native lazy loading can fetch several screens ahead.
export function loadVisibleImages(root){
 const images=[...root.querySelectorAll('img[data-image-src]')];
 const load=im=>{im.decoding='async';im.src=im.dataset.imageSrc;delete im.dataset.imageSrc;};
 if(!('IntersectionObserver' in window)){images.forEach(load);return()=>{};}
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);load(entry.target);}},{rootMargin:'200px 0px'});
 images.forEach(im=>observer.observe(im));return()=>observer.disconnect();
}
const pictures=new Map(),PICTURE_LIMIT=48;
export function warmImage(url){
 if(pictures.has(url))return pictures.get(url).promise;
 const controlledAtStart=Boolean(navigator.serviceWorker?.controller);
 const image=new Image();image.decoding='async';image.fetchPriority='low';
 const entry={image,promise:null};pictures.set(url,entry);
 entry.promise=new Promise(resolve=>{const timer=setTimeout(()=>{image.src='';if(pictures.get(url)===entry)pictures.delete(url);resolve(false);},20000);image.onload=()=>{clearTimeout(timer);if(!controlledAtStart&&navigator.serviceWorker?.controller)fetch(url,{cache:'force-cache',priority:'low'}).then(r=>r.arrayBuffer()).catch(()=>{}).finally(()=>resolve(true));else resolve(true);};image.onerror=()=>{clearTimeout(timer);if(pictures.get(url)===entry)pictures.delete(url);resolve(false);};image.src=url;});
 while(pictures.size>PICTURE_LIMIT)pictures.delete(pictures.keys().next().value);
 return entry.promise;
}
// Two low-priority downloads at a time, after the visible picture. Stop queuing when leaving the book.
export function createBookImageQueue(){
 let pending=[],active=0,stopped=false;const queued=new Set();
 function pump(){while(!stopped&&active<2&&pending.length){const url=pending.shift();active++;warmImage(url).finally(()=>{active--;pump();});}}
 return{add(urls){for(const url of urls)if(!queued.has(url)){queued.add(url);pending.push(url);}pump();},dispose(){stopped=true;pending=[];}};
}
// On a first visit, some pictures load before the worker takes control. Persist those too.
export async function cacheLoadedPictures(scope){
 const urls=[...new Set([...document.images].filter(im=>im.complete&&im.naturalWidth).map(im=>im.currentSrc||im.src).concat([...pictures].filter(([,entry])=>entry.image.complete&&entry.image.naturalWidth).map(([url])=>url)))].filter(url=>url.startsWith(scope)&&/\.(webp|jpg|png)$/.test(url)).slice(0,64);
 let index=0;await Promise.all([0,1].map(async()=>{while(index<urls.length){const url=urls[index++];try{const response=await fetch(url,{cache:'force-cache',priority:'low'});if(response.ok)await response.arrayBuffer();}catch{}}}));
}
