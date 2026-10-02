export const formatTime = t => `${Math.floor(Math.max(0,t||0)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,t||0)%60).toString().padStart(2,'0')}`;
export function sentenceAt(sentences,time){
  let index=0;
  for(let i=0;i<sentences.length;i++){if(sentences[i].start<=time+0.03)index=i;else break;}
  return index;
}
export function visibleLesson(filter,level,category,state){
  return (level==='全难度'||level==='A1') && category==='地道英语' && (filter==='视频总页'||(filter==='收藏视频'&&state.favorite)||(filter==='已看过'&&state.watched)||(filter==='已学完'&&state.completed));
}
export const normalizedWord = word => word.toLowerCase().replace(/[^a-z'-]/g,'');
export function readState(storage){
  const empty={favorite:false,watched:false,completed:false,progress:0,words:[],quotes:[],speed:1,subtitle:'dual',phonetic:false};
  try{
    const data=JSON.parse(storage.getItem('wenwen-english-v1'));
    if(!data||typeof data!=='object')return empty;
    return {...empty,...data,progress:Number.isFinite(data.progress)?Math.max(0,Math.min(data.progress,172.97)):0,words:Array.isArray(data.words)?data.words.filter(x=>typeof x==='string'):[],quotes:Array.isArray(data.quotes)?data.quotes.filter(Number.isInteger):[],speed:[.5,.75,.9,1,1.25,1.5,1.75,2].includes(data.speed)?data.speed:1,subtitle:['dual','en','zh'].includes(data.subtitle)?data.subtitle:'dual'};
  }catch{return empty;}
}
