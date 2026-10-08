import {readyAudio, warmAudio} from './reader-media.a579e790e02b.js';
import {books, series} from './book-library.a579e790e02b.js';
import {assetURL, routeURL} from './paths.a579e790e02b.js';
import {readerRoute, wordAt, swipeDirection, readingRates, readBookRate, saveBookRate, readBookMode, saveBookMode} from './books-core.a579e790e02b.js';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const speaker = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 4-6 4H2v8h3l6 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const arrow = right => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${right?'m9 5 7 7-7 7':'m15 5-7 7 7 7'}"/></svg>`;
const key = 'wenwen:readers:progress:v1';
const sessionRates = new Map();
let sessionMode;
// Reuse the user-activated media element across pages for mobile Safari.
let sharedAudio;
const settingsIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';
function progress() {try {return JSON.parse(localStorage.getItem(key)||'{}')||{};} catch {return {};}}
function remember(id, index) {try {localStorage.setItem(key,JSON.stringify({...progress(),[id]:index}));} catch {}}
function savedIndex(book) {const index = progress()[book.id];return Number.isInteger(index)&&index>=0&&index<book.pages.length?index:0;}

export function bookshelfLink() {
  return `<a class="books-home-link" href="${routeURL('/books')}" data-nav="/books"><span class="books-link-icon" aria-hidden="true">▤</span><span><strong>Read picture books</strong><small>${books.length} picture books · Tap, listen & read</small></span><span aria-hidden="true">→</span></a>`;
}

export function mountBooks({app, route, navigate, header}) {
  const selected = readerRoute(route,books);
  const events = new AbortController();
  let audio = null, frame = 0, generation = 0, active = -1, touch = null;
  let playing = false, destroyed = false;
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
      ${series.map(group=>`<section class="book-series-group" id="${group.id}"><header class="book-series-heading"><img src="${assetURL(group.poster)}" width="640" height="360" alt="${escape(group.title)} ${group.version} video first frame" loading="lazy"><div><span class="book-version">${group.version}</span><h2>${group.title}</h2><p>${group.books.some(book=>book.kind==='words')?'6 stories + Words · Tap, listen & read':'6 little books · One sentence per page'}</p><a href="${assetURL(group.wordbook)}" target="_blank" rel="noopener">Separate word book ↗</a></div></header>${group.video?`<details class="book-animation"><summary>Watch the animation · Wenzhi’s voice</summary><video controls playsinline preload="none" poster="${assetURL(group.poster)}" src="${assetURL(group.video)}"></video></details>`:''}<div class="book-grid" aria-label="${escape(group.title)} ${group.version} picture books">${group.books.map(book=>{
        const page=savedIndex(book);return `<article class="book-card"><a class="book-open" href="${routeURL(`/books/${book.id}/${page+1}`)}" data-nav="/books/${book.id}/${page+1}" aria-label="Read ${escape(book.title)}"><div class="book-cover"><img src="${assetURL(book.cover)}" width="720" height="960" alt="${escape(book.title)} picture book" loading="lazy"></div><span class="book-meta">${book.kind==='words'?'WORDS':`LEVEL ${book.level}`}  <span>${book.pages.length} pages</span></span><h2>${escape(book.title)}</h2><span class="book-open-label">${page?'Continue reading':'Open book'} ${arrow(true)}</span></a><a class="book-print" href="${assetURL(book.pdf)}" target="_blank" rel="noopener">Print PDF ↗</a></article>`;
      }).join('')}</div></section>`).join('')}<aside class="books-extras"><div><h2>Paper, too.</h2><p>Each book has its own printable PDF and audio.<br>Open a book to read, listen or download.</p></div></aside><p class="books-credit">Stories prepared by a parent. AI-assisted pictures and narration, using Wenzhi’s voice.</p></main>`;
    listen(app,'pointerdown',event=>{const link=event.target.closest('.book-open');if(!link)return;const picked=readerRoute(link.dataset.nav,books);if(picked)warmAudio(assetURL(picked.book.pages[picked.index].audio));},{passive:true});
    const pausePreviews=()=>app.querySelectorAll('.book-animation video').forEach(video=>video.pause());
    app.querySelectorAll('.book-animation').forEach(details=>listen(details,'toggle',()=>{if(!details.open)details.querySelector('video').pause();}));
    listen(document,'visibilitychange',()=>{if(document.hidden)pausePreviews();});
    listen(window,'pagehide',pausePreviews);
  } else {
    document.body.classList.add('book-reading');
    const {book,index}=selected,page=book.pages[index];remember(book.id,index);
    let rate=sessionRates.get(book.id)??readBookRate(localStorage,book.id);
    let mode=sessionMode??readBookMode(localStorage,book.id);
    app.innerHTML=`<main class="reader" style="--book-accent:${book.color}"><header class="reader-header"><a class="books-back" href="${routeURL('/books')}" data-nav="/books">${arrow(false)} Bookshelf</a><a class="brand" href="${routeURL('/')}" data-nav="/">Wenwen’s World</a><span class="reader-level">${book.kind==='words'?'WORDS':`LEVEL ${book.level}`} </span></header>
      <div class="reader-title"><h1>${escape(book.title)}</h1><details class="reader-settings"><summary aria-label="Reading settings, speed ${rate.toFixed(1)} times">${settingsIcon}<span class="reader-rate-label">${rate.toFixed(1)}×</span></summary><div class="reader-settings-panel"><h2>Reading speed</h2><p>Applies to every page in this book.</p><div class="reader-rate-options" role="group" aria-label="Speed for this whole book">${readingRates.map(value=>`<button type="button" data-reading-rate="${value}" aria-pressed="${value===rate}" aria-label="${value.toFixed(1)} times speed">${value.toFixed(1)}×</button>`).join('')}</div><small>1.0× is normal speed.<br>Saved for this book on this device.</small></div></details></div>
      <article class="reading-page" aria-label="Page ${index+1} of ${book.pages.length}"><span class="paper-page-number">${String(index+1).padStart(2,'0')}</span><div class="reading-art"><img src="${assetURL(page.image)}" alt="${escape(page.text)}" draggable="false"></div>
      <div class="reading-sentence"><p class="read-words" lang="en" aria-label="${escape(page.text)}">${page.words.map((w,i)=>`<span class="read-word" data-read-word="${i}" aria-hidden="true">${escape(w.text)}</span>`).join(' ')}</p><button type="button" class="read-aloud" aria-label="Read aloud: ${escape(page.text)}" aria-busy="false">${speaker}</button></div>
      <p class="reader-hint" role="status" aria-live="polite">Tap the speaker. Tap again to hear it again.</p><div class="paper-bottom" aria-hidden="true">WENWEN’S WORLD <span>READ & SAY</span></div></article>
      <nav class="reader-navigation" aria-label="Turn pages"><button type="button" data-turn="-1" ${index===0?'disabled':''} aria-label="Previous page">${arrow(false)} <span>Back</span></button><span class="reader-count" aria-live="polite">${index+1} <span>/ ${book.pages.length}</span></span>${index===book.pages.length-1?`<a class="reader-done" href="${routeURL('/books')}" data-nav="/books">Bookshelf ${arrow(true)}</a>`:`<button type="button" data-turn="1" aria-label="Next page"><span>Next</span> ${arrow(true)}</button>`}</nav>
      <div class="reader-dots" aria-label="Go to page">${book.pages.map((_,i)=>`<button type="button" data-page="${i}" aria-label="Page ${i+1}" ${i===index?'aria-current="page"':''}><span></span></button>`).join('')}</div>
      <div class="reader-resources"><a href="${assetURL(book.pdf)}" target="_blank" rel="noopener">Print this book ↗</a><a href="${assetURL(book.audio)}" download>Download audio ↓</a></div></main>`;
    audio=sharedAudio??=new Audio();audio.src=readyAudio(assetURL(page.audio));audio.preload='auto';audio.setAttribute('playsinline','');audio.id='reader-audio';app.append(audio);
    const hint=app.querySelector('.reader-hint'),button=app.querySelector('.read-aloud');
    const settings=app.querySelector('.reader-settings'),summary=settings.querySelector('summary');
    const settingsNote=settings.querySelector('.reader-settings-panel small');
    settingsNote.innerHTML='Speed: this book. Reading mode: all books.<br>Saved on this device.';
    settingsNote.insertAdjacentHTML('beforebegin',`<section class="reader-mode-section"><h2>When a page opens</h2><p>Applies to all books.</p><div class="reader-mode-options" role="group" aria-label="Reading mode for all books"><button type="button" data-reading-mode="tap" aria-pressed="${mode==='tap'}">Tap the speaker</button><button type="button" data-reading-mode="auto" aria-pressed="${mode==='auto'}">Read automatically</button></div></section>`);
    function applyRate(){
      audio.defaultPlaybackRate=rate;audio.playbackRate=rate;
      audio.preservesPitch=true;
      if('webkitPreservesPitch' in audio)audio.webkitPreservesPitch=true;
    }
    applyRate();
    listen(audio,'loadedmetadata',applyRate);
    const prepareNext=()=>{for(const next of book.pages.slice(index+1,index+3))warmAudio(assetURL(next.audio));};
    listen(audio,'loadeddata',prepareNext,{once:true});
    if(audio.readyState>=2)prepareNext();
    listen(settings,'click',event=>{
      const modeChoice=event.target.closest('[data-reading-mode]');
      if(modeChoice){
        const value=modeChoice.dataset.readingMode;
        if(!['tap','auto'].includes(value)||value===mode)return;
        mode=value;sessionMode=mode;saveBookMode(localStorage,book.id,mode);
        settings.querySelectorAll('[data-reading-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.readingMode===mode)));
        if(mode==='auto')play({automatic:true});else{stop();hint.textContent='Tap the speaker to listen.';}
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
      stop();const mine=generation;
      button.setAttribute('aria-busy','true');hint.textContent='Loading audio…';
      try {
        audio.currentTime=0;
        applyRate();
        await audio.play();
        if(destroyed||mine!==generation)return;
        playing=true;button.classList.add('is-playing');button.setAttribute('aria-busy','false');hint.textContent='Listen and follow the words.';tick();
      } catch(error) {
        if(destroyed||mine!==generation)return;
        stop();hint.textContent=automatic&&error.name==='NotAllowedError'?'Tap the speaker to enable sound. Then pages will read automatically.':'Audio could not play. Tap the speaker to try again.';
        if(audio.error)audio.load();
      }
    }
    function turn(delta){const next=index+delta;if(next<0||next>=book.pages.length)return;navigate(`/books/${book.id}/${next+1}`);}
    listen(button,'click',play);
    listen(audio,'ended',()=>{stop();hint.textContent='Your turn! Tap the speaker to listen again.';});
    listen(audio,'error',()=>{stop();hint.textContent='Audio could not load. Check your connection and tap again.';});
    listen(audio,'waiting',()=>{hint.textContent='Loading audio…';});
    listen(audio,'playing',()=>{hint.textContent='Listen and follow the words.';});
    listen(app,'click',event=>{const el=event.target.closest('[data-turn],[data-page]');if(!el)return;if(el.dataset.turn)turn(Number(el.dataset.turn));else navigate(`/books/${book.id}/${el.dataset.page*1+1}`);});
    listen(document,'keydown',event=>{
      if(event.key==='Escape'&&settings.open){event.preventDefault();settings.open=false;summary.focus();return;}
      if(event.ctrlKey||event.metaKey||event.altKey||event.target.matches('input,textarea,select')||event.target.closest('.reader-settings')||document.querySelector('dialog[open]'))return;
      if(event.key==='ArrowLeft'){event.preventDefault();turn(-1);}
      if(event.key==='ArrowRight'){event.preventDefault();turn(1);}
      if(event.code==='Space'&&!event.target.closest('button,a')){event.preventDefault();play();}
    });
    const sheet=app.querySelector('.reading-page');
    listen(sheet,'touchstart',event=>{if(event.touches.length!==1||event.target.closest('button,a')){touch=null;return;}const t=event.touches[0];touch={x:t.clientX,y:t.clientY,time:performance.now()};},{passive:true});
    listen(sheet,'touchend',event=>{if(!touch)return;const t=event.changedTouches[0],direction=swipeDirection(t.clientX-touch.x,t.clientY-touch.y,performance.now()-touch.time);touch=null;if(direction)turn(direction);},{passive:true});
    listen(sheet,'touchcancel',()=>touch=null,{passive:true});
    listen(document,'visibilitychange',()=>{if(document.hidden){stop();hint.textContent='Tap the speaker to listen again.';}});
    listen(window,'pagehide',stop);
    const nextPage=book.pages[index+1];if(nextPage){const preload=new Image();preload.src=assetURL(nextPage.image);}
    if(mode==='auto'&&!document.hidden)play({automatic:true});
  }
  return ()=>{destroyed=true;stop();app.querySelectorAll('.book-animation video').forEach(video=>{video.pause();video.removeAttribute('src');video.load();});events.abort();if(audio){audio.removeAttribute('src');audio.load();audio.remove();audio=null;}};
}
