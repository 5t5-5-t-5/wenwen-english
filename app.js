import {appBase,assetURL,routeURL,currentRoute} from './paths.js';
import {courses,courseById} from './courses.js';
let {lesson,sentences,vocabulary}=courses[0];
import {formatTime,sentenceAt,visibleLesson,normalizedWord,readState,storageKey} from './core.js';

const paths={
 back:'M19 12H5m7-7-7 7 7 7', next:'M5 12h14m-7-7 7 7-7 7', play:'m8 5 11 7-11 7V5Z', pause:'M8 5v14M16 5v14',
 star:'m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z',
 book:'M12 5v15M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Z',
 quote:'M4 5h16v12H9l-5 4V5Z',grid:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
 language:'M3 5h12M9 2v3M5 5c0 5 4 8 8 10M13 5c0 5-4 8-8 10M14 21l4-11 4 11m-7-3h6',
 gauge:'M5 18a9 9 0 1 1 14 0M12 13l5-6M12 13h.01',mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-3 6v1a6 6 0 0 0 12 0v-1M12 18v4m-4 0h8',
 menu:'M4 5h16M4 12h16M4 19h16',eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 eyeoff:'m3 3 18 18M9 5c1-.3 2-.4 3-.4 7 0 10 7.4 10 7.4a19 19 0 0 1-3 4M6 6c-3 2-4 6-4 6s3 7 10 7c2 0 4-1 5-2',
 download:'M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5',close:'m6 6 12 12M6 18 18 6',
 speaker:'m11 4-6 4H2v8h3l6 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
 user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
 check:'m5 12 4 4L19 6',loop:'m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3',
 info:'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z', fullscreen:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'
};
const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.info}"/></svg>`;
const app=document.querySelector('#app'), modal=document.querySelector('#modal'), modalContent=document.querySelector('#modal-content');
const states=Object.fromEntries(courses.map(course=>[course.lesson.id,readState(localStorage,course)]));
let state=states[lesson.id], video, videoEvents, readingObserver, current=0, catalogFilter='视频总页',levelFilter='全难度',category='地道英语',reviewTab='words';
let follow=false, awaiting=false, loop=false, hidden=false, abA=null, abB=null, popup=null, lastSaved=0, pendingSeek=null, toastTimer, currentWord=null, currentContext=0;
let recorder=null, mediaStream=null, recordTimer=null, recordSeconds=0, recordURL=null, recordingGeneration=0;
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(target=state,id=lesson.id){try{localStorage.setItem(storageKey(id),JSON.stringify(target));}catch{toast('浏览器存储空间不足，本次进度暂时无法保存');}}
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}
function header(){return `<header class="site-header"><a href="${routeURL('/')}" data-nav="/" class="brand">问问 English</a><span class="profile">${icon('user')} 我的学习空间</span></header>`;}
function releaseVideo(){readingObserver?.disconnect();if(video){persist();videoEvents?.abort();video.pause();video=null;}}
const isReview=()=>currentRoute().startsWith('/review');
function navigate(path){releaseVideo();closeModal();history.pushState({},'',routeURL(path));render();}
function render(){
  const route=currentRoute();
  const chosen=courseById(route.split('/')[2]||(route==='/review'?'deep-sea':lesson.id));
  if(chosen){({lesson,sentences,vocabulary}=chosen);state=states[lesson.id];}
  lastSaved=0;video=null;popup=null;awaiting=false;abA=null;abB=null;follow=false;loop=false;hidden=false;
  document.body.className=currentRoute().startsWith('/lesson/')?'learning':'';
  if(currentRoute().startsWith('/lesson/'))renderLesson();else if(isReview())renderReview();else renderCatalog();
}
function renderCatalog(){
  const shown=courses.filter(c=>visibleLesson(catalogFilter,levelFilter,category,states[c.lesson.id],c.lesson.level));
  app.innerHTML=header()+`<main class="catalog"><nav class="tabs" aria-label="课程状态">${['视频总页','收藏视频','已看过','已学完'].map(t=>`<button class="pill ${catalogFilter===t?'selected':''}" data-filter="${t}" aria-pressed="${catalogFilter===t}">${t}</button>`).join('')}</nav>
  <nav class="tabs levels" aria-label="课程难度">${['全难度','A1','A2','B1','B2','C1','C2'].map(t=>`<button class="pill ${levelFilter===t?'selected':''}" data-level="${t}" aria-pressed="${levelFilter===t}">${t}</button>`).join('')}</nav>
  <button class="review-link" data-nav="/review/${lesson.id}">${icon('star')} 进入复习中心（生词本与金句）</button>
  <nav class="categories" aria-label="课程分类">${['地道英语','越听越清晰'].map(t=>`<button class="category ${category===t?'selected':''}" data-category="${t}">${t}</button>`).join('')}<button class="category" data-action="install">添加到主屏幕</button></nav>
  <section class="lesson-grid" aria-label="视频课程">${shown.length?shown.map(courseCard).join(''):empty(catalogFilter==='收藏视频'?'还没有收藏的视频':catalogFilter==='已看过'?'还没有学习记录':catalogFilter==='已学完'?'还没有学完的课程':'暂时没有这一分类的课程',catalogFilter==='收藏视频'?'点击视频封面上的星星，就能在这里找到它。':'可以返回视频总页，选择一节课开始学习。',true)}</section>
  <p class="catalog-note">问问 English · 把每一句听懂，把每一次进步记住。<br>学习进度与收藏保存在当前浏览器。</p></main>`;
}
function courseCard(course){
  const l=course.lesson,st=states[l.id],path=`/lesson/${l.id}`;
  return `<article class="lesson-card"><a class="cover" href="${routeURL(path)}" data-nav="${path}"><img src="${l.cover||l.poster}" alt="${esc(l.title)}课程封面">${st.watched?`<span class="watched">${st.completed?'已学完':'已学习'}</span>`:''}</a><button class="favorite card-star ${st.favorite?'is-saved':''}" data-action="favorite" data-lesson="${l.id}" aria-label="${st.favorite?'取消收藏':'收藏'}${esc(l.title)}" aria-pressed="${st.favorite}">${icon('star')}</button><a class="card-copy" href="${routeURL(path)}" data-nav="${path}"><h2>${esc(l.title)}</h2><p>${esc(l.description)}</p><span class="level-tag">${l.level}</span><span class="course-duration">${formatTime(Math.ceil(l.duration))}</span></a></article>`;
}
function empty(title,description,reset=false){return `<div class="empty"><div class="empty-icon">${reviewTab==='quotes'&&isReview()?'✦':'📖'}</div><h3>${title}</h3><p>${description}</p>${reset?'<button class="primary" data-action="reset-filters">查看全部视频</button>':''}</div>`;}
function sentenceHTML(s){
  const text=s.en.split(/([A-Za-z]+(?:'[A-Za-z]+)?)/g).map(part=>{
    if(!/[A-Za-z]/.test(part))return esc(part);
    const key=normalizedWord(part),v=vocabulary[key];
    return `<button class="word ${v?'key':''}" data-word="${key}" data-context="${s.id}" aria-label="查看 ${esc(part)} 的释义">${state.phonetic&&v?`<ruby>${esc(part)}<rt>/${v.ipa}/</rt></ruby>`:esc(part)}</button>`;
  }).join('');
  return `<article class="sentence ${s.id===current?'active':''}" data-sentence="${s.id}" tabindex="0" aria-label="播放第 ${s.id+1} 句：${esc(s.en)}" ${s.id===current?'aria-current="true"':''}><div class="sentence-top"><span class="time-badge">${formatTime(s.start)}</span><button class="save-quote ${state.quotes.includes(s.id)?'is-saved':''}" data-quote="${s.id}" aria-label="${state.quotes.includes(s.id)?'取消收藏':'收藏'}第 ${s.id+1} 句" aria-pressed="${state.quotes.includes(s.id)}">${icon('star')}</button></div><div class="sentence-en">${text}</div><div class="sentence-zh">${s.zh}</div></article>`;
}
function renderLesson(){
  current=sentenceAt(sentences,pendingSeek??state.progress);
  app.innerHTML=`<main class="lesson-shell"><header class="lesson-header"><button class="icon-button" data-nav="/" aria-label="返回视频目录">${icon('back')}</button><a class="brand" href="${routeURL('/')}" data-nav="/">问问 English</a><a class="icon-button download" href="${lesson.video}" download="问问English-${lesson.id}.mp4" aria-label="下载无底部字幕视频">${icon('download')}</a></header>
  <div class="lesson-layout"><section class="video-column" aria-label="视频播放"><div class="video-box"><video id="video" src="${lesson.video}" poster="${lesson.poster}" controls playsinline preload="metadata" aria-label="${esc(lesson.title)}英语教学视频"><track kind="subtitles" src="${lesson.tracks.en}" srclang="en" label="English"><track kind="subtitles" src="${lesson.tracks.zh}" srclang="zh" label="中文"></video><button class="big-play" data-action="play" aria-label="播放视频">${icon('play')}</button><div id="media-error" class="media-error" hidden><strong>视频暂时没有加载成功</strong><span>检查网络连接后可以继续学习。</span><button class="primary" data-action="retry-video">重新加载视频</button></div><span class="video-corner">${esc(lesson.englishTitle)}</span></div><div class="video-details"><div class="eyebrow">问问 ENGLISH · ${lesson.level} 入门</div><h1>${esc(lesson.title)}</h1><p>${lesson.description}</p><div class="detail-chips"><span>${formatTime(Math.ceil(lesson.duration))}</span><span>${sentences.length} 句双语字幕</span><span>${lesson.tags}</span></div><div class="learning-tip">${icon('info')}<span>点击字幕可跳转到对应片段；点击英文单词查看释义。<br>按空格播放 / 暂停，按 ← → 切换上一句、下一句。</span></div></div></section>
  <section class="reading-column" aria-label="逐句双语字幕"><div class="reading-heading"><strong>逐句精听</strong><span id="sentence-count">${current+1} / ${sentences.length}</span></div><div id="follow-banner" class="follow-banner" hidden><span>轮到你了，试着读出这一句</span><button data-action="record-dialog">${icon('mic')}录音</button><button data-action="next">下一句 ${icon('next')}</button></div><div id="sentences" class="sentences subtitle-${state.subtitle} ${state.phonetic?'phonetics':''}">${sentences.map(sentenceHTML).join('')}<div class="lesson-complete">每学会一句，就离自信表达更近一步。<button class="primary" data-action="complete">${state.completed?'✓ 已学完这节课':'标记为已学完'}</button></div></div></section></div>
  <footer class="toolbar"><div class="tool-row"><button class="tool" data-action="directory"><span class="tool-icon">${icon('grid')}</span><span>目录</span></button><button class="tool ${state.phonetic?'active':''}" id="phonetic-tool" data-action="phonetic" aria-pressed="${state.phonetic}"><span class="tool-icon">æ</span><span>音标</span></button><button class="tool" id="ab-tool" data-action="ab"><span class="tool-icon">A</span><span>AB点</span></button><button class="tool active" id="subtitle-tool" data-action="subtitle"><span class="tool-icon">${icon('language')}</span><span>${subtitleLabel()}</span></button><button class="tool active" id="speed-tool" data-action="speed"><span class="tool-icon">${icon('gauge')}</span><span>${state.speed}x</span></button><button class="tool" id="follow-tool" data-action="follow" aria-pressed="false"><span class="tool-icon">${icon('mic')}</span><span>跟读</span></button></div>
  <div class="seek-wrap"><div class="seek-track"><input id="seek" class="seek" type="range" min="0" max="${lesson.duration}" step="0.05" value="0" aria-label="视频播放进度"><span id="marker-a" class="ab-marker" hidden>A</span><span id="marker-b" class="ab-marker" hidden>B</span></div><span class="progress-label" id="progress-label">00:00 / ${formatTime(Math.ceil(lesson.duration))}</span></div>
  <div class="transport"><button class="transport-side" data-action="mode" aria-label="播放模式">${icon('menu')}</button><div class="transport-center"><button class="skip" data-action="previous" aria-label="上一句">${icon('back')}</button><button class="play" id="play-button" data-action="play" aria-label="播放">${icon('play')}</button><button class="skip" data-action="next" aria-label="下一句">${icon('next')}</button></div><span id="follow-label" class="follow-label"></span><button class="transport-side" id="eye-button" data-action="hide" aria-label="隐藏字幕，练习盲听" aria-pressed="false">${icon('eye')}</button></div></footer></main>`;
  video=document.querySelector('#video');video.playbackRate=state.speed;
  videoEvents=new AbortController();
  const on=(type,handler)=>video.addEventListener(type,handler,{signal:videoEvents.signal});
  const resume=pendingSeek??state.progress;pendingSeek=null;video.dataset.resume=String(resume);
  on('loadedmetadata',()=>{const resume=Number(video.dataset.resume||0);delete video.dataset.resume;if(resume>0&&resume<video.duration-.5)video.currentTime=resume;document.querySelector('#seek').max=video.duration;updateTime();scrollActive();});
  on('play',()=>{state.watched=true;awaiting=false;setFollowBanner(false);updatePlay();save();});
  on('pause',()=>{updatePlay();persist();});
  on('ended',()=>{state.completed=true;state.progress=0;save();updatePlay();toast('这节课学完啦，去复习中心回顾收藏吧');});
  on('timeupdate',onTimeUpdate);
  on('error',()=>{document.querySelector('#media-error').hidden=false;toast(navigator.onLine?'视频暂时无法加载，点击重试。':'网络已断开，联网后点击重试。');});
  on('canplay',()=>{document.querySelector('#media-error').hidden=true;});
  on('ratechange',()=>{state.speed=video.playbackRate;setToolLabel('speed-tool',`${state.speed}x`);save();});
  document.querySelector('#seek').addEventListener('input',e=>{video.currentTime=Number(e.target.value);awaiting=false;setFollowBanner(false);updateTime();});
  if('ResizeObserver' in window){readingObserver=new ResizeObserver(()=>{if(video)scrollActive();});readingObserver.observe(document.querySelector('#sentences'));}
}
const subtitleLabel=()=>({dual:'双语',en:'英文',zh:'中文'}[state.subtitle]);
function setToolLabel(id,label){const el=document.querySelector(`#${id} > span:last-child`);if(el)el.textContent=label;}
function updatePlay(){if(!video)return;document.querySelector('#play-button').innerHTML=icon(video.paused?'play':'pause');document.querySelector('#play-button').setAttribute('aria-label',video.paused?'播放':'暂停');document.querySelector('.big-play').hidden=!video.paused;}
async function play(){if(!video)return;try{await video.play();}catch(e){if(e.name!=='AbortError')toast('无法开始播放，请点击视频上的播放按钮重试');}}
function persist(){if(!video)return;state.progress=video.ended?0:video.currentTime;save();}
function updateTime(){
  if(!video)return;
  const t=video.currentTime,duration=video.duration||lesson.duration,seek=document.querySelector('#seek');
  seek.value=t;seek.style.setProperty('--progress',`${t/duration*100}%`);seek.setAttribute('aria-valuetext',`${formatTime(t)} / ${formatTime(duration)}`);
  document.querySelector('#progress-label').textContent=`${formatTime(t)} / ${formatTime(duration)}`;
  const idx=sentenceAt(sentences,t);
  if(idx!==current){document.querySelector('.sentence.active')?.classList.remove('active');document.querySelector('[aria-current="true"]')?.removeAttribute('aria-current');current=idx;const active=document.querySelector(`[data-sentence="${current}"]`);active.classList.add('active');active.setAttribute('aria-current','true');document.querySelector('#sentence-count').textContent=`${current+1} / ${sentences.length}`;scrollActive();}
}
function scrollActive(){const container=document.querySelector('#sentences'),active=document.querySelector('.sentence.active');if(!active||!container)return;const ar=active.getBoundingClientRect(),cr=container.getBoundingClientRect();if(ar.top<cr.top+8||ar.bottom>cr.bottom-15)container.scrollTo({top:container.scrollTop+ar.top-cr.top-12,behavior:'smooth'});}
function onTimeUpdate(){
  if(!video)return;
  const t=video.currentTime,s=sentences[current];
  if(!video.paused&&abA!==null&&abB!==null&&t>=abB){video.currentTime=abA;updateTime();return;}
  if(!video.paused&&t>=s.end&&t<(sentences[current+1]?.start??s.end+1)+.3){
    if(loop&&abB===null){video.currentTime=s.start;return;}
    if(follow&&!awaiting&&abB===null){awaiting=true;video.pause();setFollowBanner(true);document.querySelector('#follow-label').textContent='轮到你跟读了';}
  }
  updateTime();if(Math.abs(t-lastSaved)>4){persist();lastSaved=t;}
}
function seekSentence(idx,shouldPlay=true){
  if(!video)return;
  const clamped=Math.max(0,Math.min(sentences.length-1,idx));
  video.currentTime=sentences[clamped].start;awaiting=false;setFollowBanner(false);updateTime();scrollActive();if(shouldPlay)play();
}
function setFollowBanner(show){const el=document.querySelector('#follow-banner');if(el)el.hidden=!show;}
function closePopup(){document.querySelector('.popup')?.remove();popup=null;}
function showPopup(type){
  if(popup===type){closePopup();return;}closePopup();popup=type;
  let content='';
  if(type==='speed')content=`<div class="popup-title">播放倍速</div>${[.5,.75,.9,1,1.25,1.5,1.75,2].map(v=>`<button data-speed="${v}" class="${state.speed===v?'selected':''}">${v}x</button>`).join('')}`;
  if(type==='subtitle')content=`<div class="popup-title">字幕显示</div>${[['dual','中英双语'],['en','仅英文'],['zh','仅中文']].map(([v,t])=>`<button data-subtitle="${v}" class="${state.subtitle===v?'selected':''}">${t}</button>`).join('')}`;
  if(type==='mode')content=`<div class="popup-title">播放模式</div><button data-mode="continuous" class="${!loop?'selected':''}">连续播放</button><button data-mode="loop" class="${loop?'selected':''}">单句循环</button>`;
  if(type==='ab')content=`<div class="popup-title">AB 片段循环</div><div class="time-pair">A ${abA===null?'--:--':formatTime(abA)} &nbsp; B ${abB===null?'--:--':formatTime(abB)}</div><p>在想重复听的片段起点和终点，分别设置 A、B 点。</p><button data-action="set-a">将当前时间设为 A 点</button><button data-action="set-b" ${abA===null?'disabled':''}>将当前时间设为 B 点</button><button data-action="clear-ab">清除 AB 点</button>`;
  document.querySelector('.toolbar').insertAdjacentHTML('beforeend',`<div class="popup popup-${type}" role="group" aria-label="${type==='speed'?'播放倍速':type==='ab'?'AB循环设置':'播放设置'}">${content}</div>`);
}
function updateAB(){
  const duration=video.duration||lesson.duration;
  for(const [key,value] of [['a',abA],['b',abB]]){const el=document.querySelector(`#marker-${key}`);el.hidden=value===null;el.style.left=`${(value||0)/duration*100}%`;}
  document.querySelector('#ab-tool').classList.toggle('active',abA!==null);setToolLabel('ab-tool',abB!==null?'AB循环':abA!==null?'已设A点':'AB点');
}
function modalFrame(title,body){modalContent.innerHTML=`<div class="modal-body"><div class="modal-head"><h2>${title}</h2><button class="icon-button" data-action="close-modal" aria-label="关闭弹窗">${icon('close')}</button></div>${body}</div>`;if(!modal.open)modal.showModal();}
function closeModal(){if(modal.open)modal.close();stopRecording(true);}
function showWord(key,context){
  video?.pause();currentWord=key;currentContext=context;const v=vocabulary[key],s=sentences[context]||sentences[0],saved=state.words.includes(key);
  modalFrame(esc(v?.word||key),`${v?`<div class="ipa">/${v.ipa}/</div><p class="meaning">${v.meaning}</p>`:'<p class="meaning">结合这一句，理解它的用法</p>'}<div class="example-box">${s.en}<span>${s.zh}</span></div><div class="modal-actions"><button class="secondary" data-speak="${key}">${icon('speaker')} 听发音</button>${v?`<button class="primary" data-action="save-word">${icon(saved?'check':'star')}${saved?'已加入生词本':'加入生词本'}</button>`:''}</div>${!v?'<p class="modal-note">这个词暂未收录独立释义，先参考整句翻译。</p>':''}`);
}
function speak(text){
  if(!('speechSynthesis'in window)){toast('当前浏览器不支持单词朗读，可以回到视频听原声');return;}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.8;
  const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang==='en-US'&&/Samantha|Google|Natural/i.test(v.name))||voices.find(v=>v.lang==='en-US')||null;
  u.onerror=event=>{if(!['interrupted','canceled'].includes(event.error))toast('单词朗读不可用，请听视频中的原声');};speechSynthesis.speak(u);
}
function renderReview(){
  const words=state.words.filter(k=>vocabulary[k]),quotes=state.quotes.filter(k=>sentences[k]);
  const items=reviewTab==='words'?words:quotes;
  app.innerHTML=header()+`<main class="review"><button class="back-link" data-nav="/">${icon('back')}返回目录</button><h1>我的复习中心</h1><p class="review-subtitle">${esc(lesson.title)}</p><nav class="review-courses" aria-label="选择复习课程">${courses.map(c=>`<button class="pill ${c.lesson.id===lesson.id?'selected':''}" data-nav="/review/${c.lesson.id}" aria-pressed="${c.lesson.id===lesson.id}">${esc(c.lesson.title)}</button>`).join('')}</nav><nav class="review-tabs" aria-label="复习分类"><button class="review-tab ${reviewTab==='words'?'selected':''}" data-review="words">${icon('book')}生词本 (${words.length})</button><button class="review-tab ${reviewTab==='quotes'?'selected':''}" data-review="quotes">${icon('quote')}金句库 (${quotes.length})</button></nav>${items.length?'<div class="review-tools"><button data-action="export">'+icon('download')+'导出学习笔记</button></div>':''}<section class="review-items">${items.length?items.map(id=>reviewTab==='words'?wordReview(id):quoteReview(id)).join(''):empty(reviewTab==='words'?'生词本空空如也':'金句库空空如也',reviewTab==='words'?'在看视频时点击单词，加入生词本即可收藏哦':'点击字幕卡片右上角的星星，留住喜欢的句子。')}</section></main>`;
}
function wordReview(key){const v=vocabulary[key];const idx=sentences.findIndex(s=>s.en.toLowerCase().includes(key));return `<article class="review-item"><button class="save-quote is-saved" data-remove-word="${key}" aria-label="取消收藏单词 ${key}">${icon('star')}</button><h3>${v.word}</h3><span class="ipa">/${v.ipa}/</span><p>${v.meaning}</p><div class="example">${v.example}<span>${v.translation}</span></div><div class="review-actions"><button class="secondary" data-speak="${key}">${icon('speaker')} 听发音</button><button class="secondary" data-jump="${Math.max(0,idx)}">回到视频</button></div></article>`;}
function quoteReview(id){const s=sentences[id];return `<article class="review-item"><button class="save-quote is-saved" data-quote="${id}" aria-label="取消收藏第 ${id+1} 句">${icon('star')}</button><span class="time-badge">${formatTime(s.start)}</span><p style="font-weight:650;color:#334155;font-size:16px;padding-right:15px">${s.en}</p><p>${s.zh}</p><div class="review-actions"><button class="secondary" data-jump="${id}">${icon('play')}听原句</button></div></article>`;}
function directory(){
  modalFrame('视频目录',`<button class="directory-item" data-jump="0"><img src="${lesson.poster}" alt="${esc(lesson.title)}"><p>${lesson.title}<small>${lesson.level} · ${formatTime(Math.ceil(lesson.duration))} · ${sentences.length} 句</small></p></button><div class="chapter-list">${lesson.chapters.map(([id,t])=>`<button data-jump="${id}"><span>${t}</span><time>${formatTime(sentences[id].start)}</time></button>`).join('')}</div><div class="modal-actions"><button class="secondary" data-nav="/">所有视频</button><button class="primary" data-nav="/review/${lesson.id}">复习中心</button></div>`);
}
function recordDialog(){
  video?.pause();closeModal();const s=sentences[current];
  modalFrame('跟读练习',`<div class="example-box">${s.en}<span>${s.zh}</span></div><div class="recorder"><div class="recording-time" id="record-time">00:00</div><div class="recording-actions"><button class="secondary" data-action="original">${icon('speaker')}听原句</button><button class="primary" id="record-button" data-action="record"><span class="record-dot"></span>开始录音</button></div><div id="record-result"></div><p class="modal-note">录音仅在本机回听，不上传。每次最长 60 秒。<br>先听一句，再用自己的声音读出来。</p></div>`);
}
async function startRecording(){
  if(recorder?.state==='recording'){recorder.stop();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('当前浏览器不支持录音，请使用 Chrome、Safari 或 Edge 打开本页');return;}
  const generation=++recordingGeneration;const button=document.querySelector('#record-button');button.disabled=true;button.textContent='等待麦克风权限…';
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    if(generation!==recordingGeneration||!modal.open){stream.getTracks().forEach(t=>t.stop());return;}
    mediaStream=stream;const chunks=[];recorder=new MediaRecorder(stream);
    recorder.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data);});
    recorder.addEventListener('stop',()=>{
      clearInterval(recordTimer);stream.getTracks().forEach(t=>t.stop());
      if(generation!==recordingGeneration||!modal.open)return;
      const blob=new Blob(chunks,{type:recorder.mimeType});if(recordURL)URL.revokeObjectURL(recordURL);recordURL=URL.createObjectURL(blob);
      document.querySelector('#record-result').innerHTML=`<audio controls src="${recordURL}" aria-label="我的跟读录音"></audio><p class="modal-note">听听自己的发音，再和视频原声比一比。</p>`;
      button.innerHTML='<span class="record-dot"></span>重新录音';button.disabled=false;
    });
    recorder.start();recordSeconds=0;button.disabled=false;button.innerHTML='<span class="record-dot live"></span>停止录音';document.querySelector('#record-result').innerHTML='';document.querySelector('#record-time').textContent='00:00';
    recordTimer=setInterval(()=>{recordSeconds++;document.querySelector('#record-time').textContent=formatTime(recordSeconds);if(recordSeconds>=60&&recorder?.state==='recording')recorder.stop();},1000);
  }catch{mediaStream?.getTracks().forEach(t=>t.stop());if(modal.open&&generation===recordingGeneration){button.disabled=false;button.innerHTML='<span class="record-dot"></span>重新尝试';toast('未能使用麦克风，请在浏览器中允许麦克风权限后重试');}}
}
function stopRecording(discard=false){if(discard)recordingGeneration++;clearInterval(recordTimer);if(recorder?.state==='recording')recorder.stop();mediaStream?.getTracks().forEach(t=>t.stop());mediaStream=null;if(discard&&recordURL){URL.revokeObjectURL(recordURL);recordURL=null;}}
function exportNotes(){const text=['问问 English · 我的学习笔记',lesson.title+' · '+lesson.englishTitle,'','生词本',...state.words.filter(k=>vocabulary[k]).map(k=>{const v=vocabulary[k];return `${v.word} /${v.ipa}/\n${v.meaning}\n${v.example}\n${v.translation}\n`;}),'金句库',...state.quotes.filter(i=>sentences[i]).map(i=>`${formatTime(sentences[i].start)} ${sentences[i].en}\n${sentences[i].zh}\n`) ].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='问问English-学习笔记.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

document.addEventListener('click',event=>{
  const el=event.target.closest('button,a,[data-sentence]');
  if(!event.target.closest('.toolbar'))closePopup();
  if(!el)return;
  if(el.dataset.nav){event.preventDefault();navigate(el.dataset.nav);return;}
  if(el.dataset.filter){catalogFilter=el.dataset.filter;renderCatalog();return;}
  if(el.dataset.level){levelFilter=el.dataset.level;renderCatalog();return;}
  if(el.dataset.category){category=el.dataset.category;renderCatalog();return;}
  if(el.dataset.review){reviewTab=el.dataset.review;renderReview();return;}
  if(el.dataset.word){showWord(el.dataset.word,Number(el.dataset.context));return;}
  if(el.dataset.speak){speak(el.dataset.speak);return;}
  if(el.dataset.removeWord){state.words=state.words.filter(k=>k!==el.dataset.removeWord);save();renderReview();return;}
  if(el.dataset.quote!==undefined){const id=Number(el.dataset.quote),has=state.quotes.includes(id);state.quotes=has?state.quotes.filter(x=>x!==id):[...state.quotes,id];save();if(isReview())renderReview();else{el.classList.toggle('is-saved',!has);el.setAttribute('aria-pressed',String(!has));el.setAttribute('aria-label',`${has?'收藏':'取消收藏'}第 ${id+1} 句`);}toast(has?'已取消收藏金句':'已加入金句库');return;}
  if(el.dataset.jump!==undefined){const idx=Number(el.dataset.jump);closeModal();if(video)seekSentence(idx);else{pendingSeek=sentences[idx].start;navigate(`/lesson/${lesson.id}`);}return;}
  if(el.dataset.sentence!==undefined){if(!hidden)seekSentence(Number(el.dataset.sentence));return;}
  if(el.dataset.speed){state.speed=Number(el.dataset.speed);video.playbackRate=state.speed;save();closePopup();return;}
  if(el.dataset.subtitle){state.subtitle=el.dataset.subtitle;const list=document.querySelector('#sentences');list.classList.remove('subtitle-dual','subtitle-en','subtitle-zh');list.classList.add(`subtitle-${state.subtitle}`);setToolLabel('subtitle-tool',subtitleLabel());save();closePopup();return;}
  if(el.dataset.mode){loop=el.dataset.mode==='loop';follow=false;awaiting=false;setFollowBanner(false);document.querySelector('#follow-tool').classList.remove('active');document.querySelector('#follow-tool').setAttribute('aria-pressed','false');document.querySelector('#follow-label').textContent=loop?'单句循环':'';if(loop){abA=null;abB=null;updateAB();seekSentence(current);}closePopup();toast(loop?'已开启单句循环':'已切换连续播放');return;}
  const action=el.dataset.action;
  if(!action)return;
  switch(action){
    case 'favorite':{const id=el.dataset.lesson;states[id].favorite=!states[id].favorite;save(states[id],id);renderCatalog();break;}
    case 'reset-filters':catalogFilter='视频总页';levelFilter='全难度';category='地道英语';renderCatalog();break;
    case 'retry-video':video.dataset.resume=String(video.currentTime||state.progress||0);document.querySelector('#media-error').hidden=true;video.load();break;
    case 'play':if(video.paused){if(awaiting)seekSentence(current);else play();}else video.pause();break;
    case 'previous':seekSentence(current-1);break;
    case 'next':seekSentence(current+1);break;
    case 'phonetic':state.phonetic=!state.phonetic;save();document.querySelector('#sentences').innerHTML=sentences.map(sentenceHTML).join('')+`<div class="lesson-complete"><button class="primary" data-action="complete">${state.completed?'✓ 已学完这节课':'标记为已学完'}</button></div>`;document.querySelector('#sentences').classList.toggle('phonetics',state.phonetic);el.classList.toggle('active',state.phonetic);el.setAttribute('aria-pressed',String(state.phonetic));scrollActive();break;
    case 'subtitle':showPopup('subtitle');break;
    case 'speed':showPopup('speed');break;
    case 'ab':showPopup('ab');break;
    case 'mode':showPopup('mode');break;
    case 'set-a':abA=video.currentTime;abB=null;updateAB();closePopup();toast(`A 点已设为 ${formatTime(abA)}，播放到终点后设置 B 点`);break;
    case 'set-b':if(video.currentTime<abA+.5){toast('B 点需要比 A 点至少晚半秒');return;}abB=video.currentTime;loop=false;follow=false;setFollowBanner(false);document.querySelector('#follow-tool').classList.remove('active');document.querySelector('#follow-tool').setAttribute('aria-pressed','false');updateAB();closePopup();video.currentTime=abA;play();toast('AB 片段循环已开启');break;
    case 'clear-ab':abA=null;abB=null;updateAB();closePopup();toast('已清除 AB 循环');break;
    case 'follow':follow=!follow;loop=false;awaiting=false;abA=null;abB=null;updateAB();el.classList.toggle('active',follow);el.setAttribute('aria-pressed',String(follow));setFollowBanner(false);document.querySelector('#follow-label').textContent=follow?'逐句跟读':'';if(follow){seekSentence(current);toast('每句结束会自动暂停，点击「录音」练习跟读');}else toast('已关闭逐句跟读');break;
    case 'hide':hidden=!hidden;document.querySelector('#sentences').classList.toggle('listening-hidden',hidden);el.innerHTML=icon(hidden?'eyeoff':'eye');el.setAttribute('aria-label',hidden?'显示字幕':'隐藏字幕，练习盲听');el.setAttribute('aria-pressed',String(hidden));toast(hidden?'字幕已隐藏，专心听一听':'字幕已显示');break;
    case 'directory':video?.pause();directory();break;
    case 'close-modal':closeModal();break;
    case 'save-word':if(state.words.includes(currentWord)){state.words=state.words.filter(k=>k!==currentWord);toast('已从生词本移除');}else{state.words.push(currentWord);toast('已加入生词本');}save();showWord(currentWord,currentContext);break;
    case 'complete':state.completed=true;state.watched=true;save();el.textContent='✓ 已学完这节课';toast('已记录完成，继续复习你收藏的生词和金句吧');break;
    case 'record-dialog':recordDialog();break;
    case 'record':startRecording();break;
    case 'original':closeModal();follow=true;loop=false;document.querySelector('#follow-tool').classList.add('active');document.querySelector('#follow-tool').setAttribute('aria-pressed','true');seekSentence(current);break;
    case 'export':exportNotes();break;
    case 'install':modalFrame('把问问 English 放到桌面',`<div class="example-box"><strong>iPhone / iPad</strong><span>在 Safari 中打开本站 → 点击分享 → 添加到主屏幕。</span></div><div class="example-box" style="margin-top:12px"><strong>安卓手机</strong><span>在 Chrome 中打开本站 → 菜单 → 添加到主屏幕。</span></div><p class="modal-note">电脑端可以把网址加入书签，方便下次继续学习。添加到主屏幕后，下次点图标就能进入。视频播放需要联网。</p>`);break;
  }
});
modal.addEventListener('click',event=>{if(event.target===modal){const rect=modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
modal.addEventListener('close',()=>stopRecording(true));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closePopup();
  if(!video||modal.open||e.target.matches('input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target.closest('[data-sentence]')&&e.key==='Enter'&&e.target.matches('[data-sentence]')){e.preventDefault();seekSentence(Number(e.target.dataset.sentence));return;}
  if(e.target.matches('button,a')&&(e.code==='Space'||e.key==='Enter'))return;
  if(e.code==='Space'){e.preventDefault();video.paused?play():video.pause();}
  if(e.key==='ArrowLeft'){e.preventDefault();seekSentence(current-1);}
  if(e.key==='ArrowRight'){e.preventDefault();seekSentence(current+1);}
});
window.addEventListener('popstate',()=>{releaseVideo();closeModal();render();});
window.addEventListener('pagehide',()=>{persist();stopRecording(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
render();

function showConnection(){document.querySelector('#connection-status').hidden=navigator.onLine;}
window.addEventListener('offline',showConnection);
window.addEventListener('online',()=>{showConnection();toast('网络已恢复，可以继续播放');});
showConnection();
if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register(assetURL('sw.js'),{scope:appBase.pathname}).catch(()=>{});}
