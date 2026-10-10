import {practiceMarkup, createReadingPractice} from './reader-recording.c77162e6acd9.js';
import {readyAudio, warmAudio, warmImage, loadVisibleImages, createBookImageQueue} from './reader-media.c77162e6acd9.js';
import {books, series} from './book-library.c77162e6acd9.js';
import {assetURL, routeURL} from './paths.c77162e6acd9.js';
import {readerRoute, wordAt, swipeDirection, readingRates, readBookRate, saveBookRate, readBookMode, saveBookMode, completedBooks, markBookCompleted, nextSeriesBook, completedReaderEntry} from './books-core.c77162e6acd9.js';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const speaker = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 4-6 4H2v8h3l6 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const arrow = right => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${right?'m9 5 7 7-7 7':'m15 5-7 7 7 7'}"/></svg>`;
const key = 'wenwen:readers:progress:v1';
const sessionRates = new Map();
const sessionCompleted = new Set();
let sessionMode;
// Reuse the user-activated media element across pages for mobile Safari.
let sharedAudio;
const settingsIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';
function progress() {try {return JSON.parse(localStorage.getItem(key)||'{}')||{};} catch {return {};}}
function remember(id, index) {try {localStorage.setItem(key,JSON.stringify({...progress(),[id]:index}));} catch {}}
function savedIndex(book,completed) {if(completed.has(book.id))return 0;const index = progress()[book.id];return Number.isInteger(index)&&index>=0&&index<book.pages.length?index:0;}

function readCompleted(){return new Set([...completedBooks(localStorage,books),...sessionCompleted]);}
export function restartCompletedBook(route){return completedReaderEntry(route,books,readCompleted());}

function wholeBookPlayer(book) {
  const rate=sessionRates.get(book.id)??readBookRate(localStorage,book.id);
  return `<details class="whole-book-player" data-audio-book="${book.id}"><summary>${speaker}<span>Listen to the whole book</span></summary><div class="whole-book-controls"><p>All ${book.pages.length} ${book.kind==='words'?'words':'pages'} · <span class="whole-book-rate">${rate.toFixed(1)}×</span></p><audio class="whole-book-audio" controls preload="none" playsinline src="${assetURL(book.audio)}" aria-label="Full audio: ${escape(book.title)}"></audio><small>Listen from start to finish, then practise one page at a time.</small><a href="${assetURL(book.audio)}" download>Download full audio ↓</a></div></details>`;
}

function seriesPicture(group,index) {
  const picture=`<img ${index===0?`src="${assetURL(group.poster)}" fetchpriority="high"`:`data-image-src="${assetURL(group.poster)}"`} decoding="async" width="640" height="360" alt="${escape(group.title)} ${group.version} video first frame">`;
  if(!group.audio)return picture;
  return `<button type="button" class="series-audio-cover" data-series-toggle="${group.id}" aria-label="Play full audio: ${escape(group.title)}" aria-pressed="false" aria-controls="${group.id}-audio">${picture}<span class="series-audio-badge">${speaker}<span>Full audio</span></span></button>`;
}
function seriesAudio(group) {
  if(!group.audio)return '';
  return `<div class="series-audio-controls" id="${group.id}-audio" hidden><div class="series-audio-caption"><strong>${escape(group.title)} · Full audio</strong><span class="series-audio-status" role="status" aria-live="polite">Tap the picture to listen.</span></div><audio class="series-full-audio" controls preload="none" playsinline data-series-src="${assetURL(group.audio)}" aria-label="Complete video audio: ${escape(group.title)}"></audio></div>`;
}

export function bookshelfLink() {
  return `<a class="books-home-link" href="${routeURL('/books')}" data-nav="/books"><span class="books-link-icon" aria-hidden="true">▤</span><span><strong>Read picture books</strong><small>${books.length} picture books · Tap, listen & read</small></span><span aria-hidden="true">→</span></a>`;
}

export function mountBooks({app, route, navigate, header}) {
  const selected = readerRoute(route,books);
  const completed=readCompleted();
  const events = new AbortController();
  let practice = null;
  let audio = null, frame = 0, generation = 0, active = -1, touch = null;
  let playing = false, destroyed = false, updateReader = null, readerResize = null, readerSizeFrame = 0, releaseImages = null, imageQueue = null;
  const pauseWholeBooks = () => app.querySelectorAll('.whole-book-audio').forEach(media=>media.pause());
  const listen = (target, name, fn, opts={}) => target.addEventListener(name,fn,{...opts,signal:events.signal});
  const cleanHighlight = () => {app.querySelectorAll('.read-word.is-reading').forEach(el => el.classList.remove('is-reading'));active=-1;};
  const stop = () => {
    generation++;playing=false;cancelAnimationFrame(frame);audio?.pause();cleanHighlight();
    const button=app.querySelector('.read-aloud');
    if(button){button.classList.remove('is-playing');button.setAttribute('aria-busy','false');}
  };
  if (!selected) {
    document.body.classList.add('book-library');
    app.innerHTML = header()+`<main class="bookshelf"><a class="books-back" href="${routeURL('/')}" data-nav="/">${arrow(false)} Back to videos</a>
      <header class="books-intro"><span class="books-eyebrow">THE READING CORNER</span><h1>Little books.<br>Big discoveries.</h1><p>Pick a story. Turn a page. Tap to hear it.</p><span class="books-series">${series.length} SERIES · ${books.length} BOOKS</span></header>
      ${series.map((group,groupIndex)=>`<section class="book-series-group" id="${group.id}"><header class="book-series-heading">${seriesPicture(group,groupIndex)}<div><span class="book-version">${group.version}</span><h2>${group.title}</h2><p>${group.books.some(book=>book.kind==='words')?'6 stories + Words · Tap, listen & read':'6 little books · One sentence per page'}</p><a href="${assetURL(group.wordbook)}" target="_blank" rel="noopener">Separate word book ↗</a></div></header>${seriesAudio(group)}${group.video?`<details class="book-animation"><summary>Watch the animation · Wenzhi’s voice</summary><video controls playsinline preload="none" data-poster="${assetURL(group.poster)}" data-video-src="${assetURL(group.video)}"></video></details>`:''}<div class="book-grid" aria-label="${escape(group.title)} ${group.version} picture books">${group.books.map((book,bookIndex)=>{
        const page=savedIndex(book,completed);return `<article class="book-card"><a class="book-open" href="${routeURL(`/books/${book.id}/${page+1}`)}" data-nav="/books/${book.id}/${page+1}" aria-label="Read ${escape(book.title)}"><div class="book-cover${book.coverShape==='square'?' book-cover-square':''}"><img ${groupIndex===0&&bookIndex<2?`src="${assetURL(book.cover)}"`:`data-image-src="${assetURL(book.cover)}"`} decoding="async" width="720" height="${book.coverShape==='square'?720:960}" alt="${escape(book.title)} picture book">${completed.has(book.id)?'<span class="book-read-badge" lang="zh-CN">✓ 已读</span>':''}</div><span class="book-meta">${book.kind==='words'?'WORDS':`LEVEL ${book.level}`}  <span>${book.pages.length} pages</span></span><h2>${escape(book.title)}</h2><span class="book-open-label">${page?'Continue reading':'Open book'} ${arrow(true)}</span></a><a class="book-print" href="${assetURL(book.pdf)}" target="_blank" rel="noopener">Print PDF ↗</a></article>`;
      }).join('')}</div></section>`).join('')}<aside class="books-extras"><div><h2>Paper, too.</h2><p>Each book has its own printable PDF and audio.<br>Open a book to read, listen or download.</p></div></aside><p class="books-credit">Stories prepared by a parent. AI-assisted pictures and narration, using Wenzhi’s voice.</p></main>`;
    releaseImages=loadVisibleImages(app);
    listen(app,'pointerdown',event=>{const link=event.target.closest('.book-open');if(!link)return;const picked=readerRoute(link.dataset.nav,books);if(picked){warmImage(assetURL(picked.book.pages[picked.index].image));warmAudio(assetURL(picked.book.pages[picked.index].audio));}},{passive:true});
    const seriesAudios=[...app.querySelectorAll('.series-full-audio')];
    seriesAudios.forEach(media=>{
      const panel=media.closest('.series-audio-controls'),group=panel.closest('.book-series-group'),button=group.querySelector('.series-audio-cover'),label=button.querySelector('.series-audio-badge span'),status=panel.querySelector('.series-audio-status');
      const title=group.querySelector('h2').textContent;
      const sync=()=>{
        const on=!media.paused&&!media.ended;
        button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',`${on?'Pause':'Play'} full audio: ${title}`);
        label.textContent=on?'Pause audio':media.ended?'Play again':'Full audio';
        status.textContent=media.ended?'Finished · Tap the picture to replay.':on?'Playing the complete video audio.':'Paused · Tap the picture to continue.';
      };
      listen(button,'click',()=>{
        panel.hidden=false;
        if(!media.paused){media.pause();return;}
        if(!media.getAttribute('src')||media.error){media.src=media.dataset.seriesSrc;media.load();}
        if(media.ended)media.currentTime=0;
        media.play().catch(error=>{if(destroyed||error.name==='AbortError')return;sync();status.textContent='Could not play. Tap the picture to try again.';});
      });
      listen(media,'play',()=>{seriesAudios.forEach(other=>{if(other!==media)other.pause();});app.querySelectorAll('.book-animation video').forEach(video=>video.pause());sync();});
      for(const event of ['playing','pause','ended'])listen(media,event,sync);
      listen(media,'waiting',()=>{if(!media.paused){label.textContent='Loading…';status.textContent='Loading audio…';}});
      listen(media,'error',()=>{sync();status.textContent='Audio could not load. Tap the picture to retry.';});
    });
    listen(window,'pagehide',()=>seriesAudios.forEach(media=>media.pause()));
    const pausePreviews=()=>app.querySelectorAll('.book-animation video').forEach(video=>video.pause());
    app.querySelectorAll('.book-animation').forEach(details=>listen(details,'toggle',()=>{const video=details.querySelector('video');if(!details.open)video.pause();else if(!video.getAttribute('src')){video.poster=video.dataset.poster;video.src=video.dataset.videoSrc;}}));
    listen(document,'visibilitychange',()=>{if(document.hidden)pausePreviews();});
    listen(window,'pagehide',pausePreviews);
  } else {
    document.body.classList.add('book-reading');
    const {book}=selected;let index=selected.index,page=book.pages[index];remember(book.id,index);
    const nextBook=nextSeriesBook(book,series),finishRoute=nextBook?`/books/${nextBook.id}/1`:'/books',finishLabel=nextBook?(nextBook.kind==='words'?'单词本':'下一本'):'返回书架';
    const recordCompletion=()=>{if(index!==book.pages.length-1||completed.has(book.id))return;completed.add(book.id);sessionCompleted.add(book.id);markBookCompleted(localStorage,book.id);};
    recordCompletion();
    let rate=sessionRates.get(book.id)??readBookRate(localStorage,book.id);
    let mode=sessionMode??readBookMode(localStorage,book.id);
    app.innerHTML=`<main class="reader" style="--book-accent:${book.color}"><header class="reader-header"><a class="books-back" href="${routeURL('/books')}" data-nav="/books">${arrow(false)} Bookshelf</a><a class="brand" href="${routeURL('/')}" data-nav="/">Wenwen’s World</a></header>
      <div class="reader-title"><div class="reader-heading"><span class="reader-level">${book.kind==='words'?'WORDS':`LEVEL ${book.level}`}</span><h1>${escape(book.title)}</h1></div><details class="reader-settings"><summary aria-label="Reading settings, speed ${rate.toFixed(1)} times">${settingsIcon}<span class="reader-rate-label">${rate.toFixed(1)}×</span></summary><div class="reader-settings-panel"><h2>Reading speed</h2><p>Applies to every page in this book.</p><div class="reader-rate-options" role="group" aria-label="Speed for this whole book">${readingRates.map(value=>`<button type="button" data-reading-rate="${value}" aria-pressed="${value===rate}" aria-label="${value.toFixed(1)} times speed">${value.toFixed(1)}×</button>`).join('')}</div><small>1.0× is normal speed.<br>Saved for this book on this device.</small></div></details></div>
      ${wholeBookPlayer(book)}
      <article class="reading-page" aria-label="Page ${index+1} of ${book.pages.length}"><span class="paper-page-number">${String(index+1).padStart(2,'0')}</span><div class="reading-art"><img fetchpriority="high" decoding="async" src="${assetURL(page.image)}" alt="${escape(page.text)}" draggable="false"></div>
      <div class="reading-sentence"><button type="button" class="read-aloud" aria-label="Read aloud: ${escape(page.text)}" aria-busy="false">${speaker}</button><p class="read-words" lang="en" aria-label="${escape(page.text)}">${page.words.map((w,i)=>`<span class="read-word" data-read-word="${i}" aria-hidden="true">${escape(w.text)}</span>`).join(' ')}</p></div>
      ${practiceMarkup()}
      </article>
      <nav class="reader-navigation" aria-label="Turn pages"><button type="button" data-turn="-1" ${index===0?'disabled':''} aria-label="Previous page">${arrow(false)} <span>上一页</span></button><span class="reader-count" aria-live="polite">${index+1} <span>/ ${book.pages.length}</span></span><button type="button" data-turn="1" aria-label="Next page" ${index===book.pages.length-1?'hidden':''}><span>下一页</span> ${arrow(true)}</button><a class="reader-done" href="${routeURL(finishRoute)}" data-nav="${finishRoute}" aria-label="${nextBook?(nextBook.kind==='words'?'Open Words':`Next Level: Level ${nextBook.level}`):'Back to bookshelf'}" ${index===book.pages.length-1?'':'hidden'}>${finishLabel} ${arrow(true)}</a></nav>
      <div class="reader-dots" aria-label="Go to page">${book.pages.map((_,i)=>`<button type="button" data-page="${i}" aria-label="Page ${i+1}" ${i===index?'aria-current="page"':''}><span></span></button>`).join('')}</div>
      <div class="reader-resources"><a href="${assetURL(book.pdf)}" target="_blank" rel="noopener">Print this book ↗</a><a href="${assetURL(book.audio)}" download>Download full audio ↓</a></div></main>`;
    audio=sharedAudio??=new Audio();audio.src=readyAudio(assetURL(page.audio));audio.preload='auto';audio.setAttribute('playsinline','');audio.id='reader-audio';app.append(audio);
    const hint=app.querySelector('.reader-hint'),button=app.querySelector('.read-aloud');
    practice=createReadingPractice({root:app.querySelector('.reading-practice'),beforeAudio:()=>{stop();pauseWholeBooks();},onBusyChange:busy=>{button.disabled=busy;hint.textContent='';}});
    practice.setPage(`${book.id}:${index}`);
    const settings=app.querySelector('.reader-settings'),summary=settings.querySelector('summary');
    const settingsNote=settings.querySelector('.reader-settings-panel small');
    settingsNote.innerHTML='Speed: this book. Reading mode: all books.<br>Saved on this device.<br>录音仅在设备上检查声音，不保存、不上传。';
    settingsNote.insertAdjacentHTML('beforebegin',`<section class="reader-mode-section"><h2>When a page opens</h2><p>Applies to all books.</p><div class="reader-mode-options" role="group" aria-label="Reading mode for all books"><button type="button" data-reading-mode="tap" aria-pressed="${mode==='tap'}">Tap the speaker</button><button type="button" data-reading-mode="auto" aria-pressed="${mode==='auto'}">Read automatically</button></div></section>`);
    function applyRate(){
      audio.defaultPlaybackRate=rate;audio.playbackRate=rate;
      app.querySelectorAll('.whole-book-audio').forEach(full=>{full.defaultPlaybackRate=rate;full.playbackRate=rate;full.preservesPitch=true;if('webkitPreservesPitch' in full)full.webkitPreservesPitch=true;});
      const fullRate=app.querySelector('.whole-book-rate');if(fullRate)fullRate.textContent=`${rate.toFixed(1)}×`;
      audio.preservesPitch=true;
      if('webkitPreservesPitch' in audio)audio.webkitPreservesPitch=true;
    }
    applyRate();
    listen(audio,'loadedmetadata',applyRate);
    const prepareNext=()=>{const current=index;app.querySelector('.reading-art img').decode().catch(()=>{}).then(()=>{if(destroyed||current!==index)return;for(const next of book.pages.slice(index+1,index+3))warmAudio(assetURL(next.audio));});};
    listen(audio,'loadeddata',prepareNext);
    if(audio.readyState>=2)prepareNext();
    listen(settings,'click',event=>{
      const modeChoice=event.target.closest('[data-reading-mode]');
      if(modeChoice){
        const value=modeChoice.dataset.readingMode;
        if(!['tap','auto'].includes(value)||value===mode)return;
        mode=value;sessionMode=mode;saveBookMode(localStorage,book.id,mode);
        settings.querySelectorAll('[data-reading-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.readingMode===mode)));
        if(mode==='auto')play({automatic:true});else{stop();hint.textContent='';}
        return;
      }
      const choice=event.target.closest('[data-reading-rate]');if(!choice)return;
      const value=Number(choice.dataset.readingRate);if(!readingRates.includes(value))return;
      rate=value;sessionRates.set(book.id,rate);saveBookRate(localStorage,book.id,rate);applyRate();
      settings.querySelector('.reader-rate-label').textContent=`${rate.toFixed(1)}×`;
      summary.setAttribute('aria-label',`Reading settings, speed ${rate.toFixed(1)} times`);
      settings.querySelectorAll('[data-reading-rate]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.readingRate)===rate)));
    });
    listen(document,'click',event=>{if(!settings.contains(event.target))settings.open=false;});
    listen(settings,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();settings.open=false;summary.focus();}});
    function tick(){
      if(destroyed||!playing)return;
      const next=wordAt(page.words,audio.currentTime);
      if(next!==active){cleanHighlight();active=next;if(next>=0)app.querySelector(`[data-read-word="${next}"]`)?.classList.add('is-reading');}
      frame=requestAnimationFrame(tick);
    }
    async function play({automatic=false}={}){
      if(practice?.busy){if(!automatic)hint.textContent='请先点击大按钮完成录音。';return;}
      practice?.stopPlayback();pauseWholeBooks();stop();const mine=generation;
      button.setAttribute('aria-busy','true');hint.textContent='';
      try {
        audio.currentTime=0;
        applyRate();
        await audio.play();
        if(destroyed||mine!==generation)return;
        playing=true;button.classList.add('is-playing');button.setAttribute('aria-busy','false');hint.textContent='';tick();
      } catch(error) {
        if(destroyed||mine!==generation)return;
        stop();hint.textContent=automatic&&error.name==='NotAllowedError'?'Tap the speaker to enable sound. Then pages will read automatically.':'Audio could not play. Tap the speaker to try again.';
        if(audio.error)audio.load();
      }
    }
    function turn(delta){const next=index+delta;if(next<0||next>=book.pages.length)return;navigate(`/books/${book.id}/${next+1}`);}
    listen(button,'click',play);
    listen(audio,'ended',()=>{stop();hint.textContent='';});
    listen(audio,'error',()=>{stop();hint.textContent='Audio could not load. Check your connection and tap again.';});
    listen(audio,'waiting',()=>{hint.textContent='';});
    listen(audio,'playing',()=>{hint.textContent='';});
    listen(app,'click',event=>{const el=event.target.closest('[data-turn],[data-page]');if(!el)return;if(el.dataset.turn)turn(Number(el.dataset.turn));else navigate(`/books/${book.id}/${el.dataset.page*1+1}`);});
    listen(document,'keydown',event=>{
      if(event.key==='Escape'&&settings.open){event.preventDefault();settings.open=false;summary.focus();return;}
      if(event.ctrlKey||event.metaKey||event.altKey||event.target.matches('input,textarea,select,audio')||event.target.closest('.whole-book-player')||event.target.closest('.reader-settings')||event.target.closest('.reading-practice')||document.querySelector('dialog[open]'))return;
      if(event.key==='ArrowLeft'){event.preventDefault();turn(-1);}
      if(event.key==='ArrowRight'){event.preventDefault();turn(1);}
      if(event.code==='Space'&&!event.target.closest('button,a')){event.preventDefault();play();}
    });
    const sheet=app.querySelector('.reading-page');
    listen(sheet,'touchstart',event=>{if(event.touches.length!==1||event.target.closest('button,a')){touch=null;return;}const t=event.touches[0];touch={x:t.clientX,y:t.clientY,time:performance.now()};},{passive:true});
    listen(sheet,'touchend',event=>{if(!touch)return;const t=event.changedTouches[0],direction=swipeDirection(t.clientX-touch.x,t.clientY-touch.y,performance.now()-touch.time);touch=null;if(direction)turn(direction);},{passive:true});
    listen(sheet,'touchcancel',()=>touch=null,{passive:true});
    listen(document,'visibilitychange',()=>{if(document.hidden){stop();hint.textContent='';}});
    listen(window,'pagehide',stop);
    const wordsElement=app.querySelector('.read-words'),art=app.querySelector('.reading-art img');
    // Reserve the longest sentence's space so the paper and navigation stay put.
    function sizeSentenceArea(){
      if(destroyed)return;
      const measure=wordsElement.cloneNode(false);
      measure.style.cssText=`position:absolute;visibility:hidden;pointer-events:none;min-height:0;width:${wordsElement.getBoundingClientRect().width}px;`;
      wordsElement.parentElement.append(measure);
      let height=0;
      for(const item of book.pages){measure.innerHTML=item.words.map(w=>`<span class="read-word">${escape(w.text)}</span>`).join(' ');height=Math.max(height,measure.getBoundingClientRect().height);}
      measure.remove();wordsElement.style.minHeight=`${Math.ceil(height)}px`;
    }
    sizeSentenceArea();document.fonts?.ready.then(()=>{if(!destroyed)sizeSentenceArea();});
    if('ResizeObserver' in window){let width=wordsElement.parentElement.clientWidth;readerResize=new ResizeObserver(()=>{const next=wordsElement.parentElement.clientWidth;if(Math.abs(width-next)>.5){width=next;cancelAnimationFrame(readerSizeFrame);readerSizeFrame=requestAnimationFrame(sizeSentenceArea);}});readerResize.observe(wordsElement.parentElement);}
    imageQueue=createBookImageQueue();
    const preloadImages=()=>{const current=index;art.decode().catch(()=>{}).then(()=>{if(destroyed||current!==index)return;const prepare=()=>{if(destroyed||current!==index)return;imageQueue.add([...book.pages.slice(index+1),...book.pages.slice(0,index)].map(next=>assetURL(next.image)).filter(url=>url!==art.src));};if(document.readyState==='complete')prepare();else window.addEventListener('load',prepare,{once:true});});};
    updateReader=route=>{
      const next=readerRoute(route,books);if(!next||next.book.id!==book.id)return false;
      if(next.index===index)return true;
      stop();pauseWholeBooks();index=next.index;page=book.pages[index];practice.setPage(`${book.id}:${index}`);remember(book.id,index);recordCompletion();
      sheet.setAttribute('aria-label',`Page ${index+1} of ${book.pages.length}`);
      app.querySelector('.paper-page-number').textContent=String(index+1).padStart(2,'0');
      art.src=assetURL(page.image);art.alt=page.text;
      wordsElement.setAttribute('aria-label',page.text);
      wordsElement.innerHTML=page.words.map((w,i)=>`<span class="read-word" data-read-word="${i}" aria-hidden="true">${escape(w.text)}</span>`).join(' ');
      button.setAttribute('aria-label',`Read aloud: ${page.text}`);
      hint.textContent='';
      app.querySelector('[data-turn="-1"]').disabled=index===0;
      const nextButton=app.querySelector('[data-turn="1"]'),done=app.querySelector('.reader-done');
      const wasNextFocused=document.activeElement===nextButton,wasDoneFocused=document.activeElement===done;
      nextButton.hidden=index===book.pages.length-1;done.hidden=!nextButton.hidden;
      if(wasNextFocused&&nextButton.hidden)done.focus({preventScroll:true});
      if(wasDoneFocused&&done.hidden)nextButton.focus({preventScroll:true});
      app.querySelector('.reader-count').innerHTML=`${index+1} <span>/ ${book.pages.length}</span>`;
      app.querySelectorAll('[data-page]').forEach(dot=>{if(Number(dot.dataset.page)===index)dot.setAttribute('aria-current','page');else dot.removeAttribute('aria-current');});
      audio.src=readyAudio(assetURL(page.audio));applyRate();preloadImages();
      if(mode==='auto'&&!document.hidden)play({automatic:true});
      return true;
    };
    preloadImages();
    if(mode==='auto'&&!document.hidden)play({automatic:true});
  }
  app.querySelectorAll('.whole-book-player').forEach(details=>{
    const full=details.querySelector('audio'),id=details.dataset.audioBook;
    const setRate=()=>{const rate=sessionRates.get(id)??readBookRate(localStorage,id);full.defaultPlaybackRate=rate;full.playbackRate=rate;full.preservesPitch=true;if('webkitPreservesPitch' in full)full.webkitPreservesPitch=true;details.querySelector('.whole-book-rate').textContent=`${rate.toFixed(1)}×`;};
    setRate();listen(full,'loadedmetadata',setRate);
    listen(details,'toggle',()=>{if(!details.open)full.pause();else{stop();app.querySelectorAll('.whole-book-audio').forEach(other=>{if(other!==full)other.pause();});}});
    listen(full,'play',()=>{
      if(practice?.busy){full.pause();return;}
      practice?.stopPlayback();stop();app.querySelectorAll('.whole-book-audio, .book-animation video').forEach(other=>{if(other!==full)other.pause();});
      const hint=app.querySelector('.reader-hint');if(hint)hint.textContent='';
    });
    listen(full,'error',()=>{details.querySelector('small').textContent='Audio could not load. Check your connection and try again, or download the full audio.';});
  });
  app.querySelectorAll('.book-animation video').forEach(video=>listen(video,'play',()=>{pauseWholeBooks();app.querySelectorAll('.series-full-audio').forEach(media=>media.pause());}));
  listen(document,'visibilitychange',()=>{if(document.hidden)pauseWholeBooks();});
  listen(window,'pagehide',pauseWholeBooks);
  const cleanup=()=>{destroyed=true;practice?.dispose();releaseImages?.();imageQueue?.dispose();readerResize?.disconnect();cancelAnimationFrame(readerSizeFrame);stop();pauseWholeBooks();app.querySelectorAll('.whole-book-audio, .series-full-audio').forEach(full=>{full.pause();full.removeAttribute('src');full.load();});app.querySelectorAll('.book-animation video').forEach(video=>{video.pause();video.removeAttribute('src');video.load();});events.abort();if(audio){audio.removeAttribute('src');audio.load();audio.remove();audio=null;}};
  cleanup.update=route=>updateReader?.(route)??false;
  return cleanup;
}
