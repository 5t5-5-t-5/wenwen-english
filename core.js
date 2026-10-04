import {lesson,sentences} from './data.js';
export const formatTime = t => `${Math.floor(Math.max(0,t||0)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,t||0)%60).toString().padStart(2,'0')}`;
export function sentenceAt(sentences,time){
  let index=0;
  for(let i=0;i<sentences.length;i++){if(sentences[i].start<=time+0.03)index=i;else break;}
  return index;
}
export function visibleLesson(filter,level,category,state,lessonLevel='A1'){
  return (level==='全难度'||level===lessonLevel) && category==='地道英语' && (filter==='视频总页'||(filter==='收藏视频'&&state.favorite)||(filter==='已看过'&&state.watched)||(filter==='已学完'&&state.completed));
}
export const normalizedWord = word => word.toLowerCase().replace(/[^a-z'-]/g,'');
export const storageKey = id => id==='deep-sea'?'wenwen-english-v1':`wenwen-english:${id}:v1`;
export function readState(storage,course={lesson,sentences}){
  const {lesson:activeLesson,sentences:activeSentences}=course;
  return readCourseState(storage,activeLesson,activeSentences);
}
function readCourseState(storage,lesson,sentences){
  const empty={favorite:false,watched:false,completed:false,progress:0,words:[],quotes:[],speed:1,subtitle:'dual',phonetic:false,mediaVersion:lesson.mediaVersion};
  try{
    const data=JSON.parse(storage.getItem(storageKey(lesson.id)));
    if(!data||typeof data!=='object')return empty;
    const saved={...empty,...data,progress:Number.isFinite(data.progress)?Math.max(0,Math.min(data.progress,lesson.duration)):0,words:Array.isArray(data.words)?data.words.filter(x=>typeof x==='string'):[],quotes:Array.isArray(data.quotes)?data.quotes.filter(Number.isInteger):[],speed:[.5,.75,.9,1,1.25,1.5,1.75,2].includes(data.speed)?data.speed:1,subtitle:['dual','en','zh'].includes(data.subtitle)?data.subtitle:'dual'};
    // V8 adds a recap sentence before Red; keep old bookmarks on the same words.
    if(lesson.id==='deep-sea'&&(!data.mediaVersion||/^v[1-7]$/.test(data.mediaVersion))){
      saved.quotes=saved.quotes.filter(i=>i>=0&&i<62).map(i=>i>=51?i+1:i);
      if(saved.progress>0){
        const oldIndex=sentenceAt(legacyStarts.map(start=>({start})),Math.min(saved.progress,172.97));
        const newIndex=oldIndex>=51?oldIndex+1:oldIndex;
        saved.progress=Math.min(lesson.duration,sentences[newIndex].start+Math.max(0,saved.progress-legacyStarts[oldIndex]));
      }
    }
    saved.mediaVersion=lesson.mediaVersion;
    return saved;
  }catch{return empty;}
}

const legacyStarts=[1.42, 4.1, 6.64, 9.34, 10.84, 12.58, 15.34, 19.28, 20.56, 22.34, 24.66, 26.06, 28.52, 31.6, 33.62, 35.82, 37.74, 40.62, 43.16, 47.12, 49.22, 50.88, 52.88, 54.88, 57.82, 60.82, 63.02, 67.42, 70.22, 72.14, 74.12, 77.52, 79.24, 80.8, 82.82, 85.88, 88.54, 91.18, 94.64, 96.24, 97.94, 101.48, 103.98, 106.9, 110.3, 113.72, 116.72, 119.28, 122.68, 126.46, 129.7, 133.3, 136.64, 140.38, 143.72, 146.84, 149.88, 152.48, 153.78, 155.82, 157.66, 158.84];
