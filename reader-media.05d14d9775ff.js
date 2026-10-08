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
