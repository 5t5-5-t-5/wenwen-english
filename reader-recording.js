const mic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>';
const stopIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>';
const ordinals = ['第一次', '第二次'];

export function practiceMarkup() {
  return `<section class="reading-practice" lang="zh-CN" aria-label="跟读录音，练习两遍">
    <div class="practice-heading"><strong>轮到你啦！</strong><span>每句话，读两遍</span></div>
    <div class="practice-steps" aria-label="录音进度">${ordinals.map((label, i) => `<span data-practice-step="${i}"><b>${i + 1}</b> ${label}<span class="practice-step-stars" aria-hidden="true"></span></span>`).join('')}</div>
    <button type="button" class="practice-record"><span class="practice-record-icon">${mic}</span><span><strong class="practice-record-label">第一次 · 点我录音</strong><small class="practice-record-help">读完后，再点一下完成</small></span></button>
    <p class="practice-status" role="status" aria-live="polite">点大按钮，录下自己的声音吧。</p>
    <div class="practice-playbacks" aria-label="回听自己的录音">${ordinals.map((label, i) => `<button type="button" data-practice-play="${i}" disabled aria-label="听${label}录音">▷ 听${label}</button>`).join('')}</div>
    <div class="practice-reward" hidden role="status" aria-live="polite"><div aria-hidden="true"><span>★</span><span>★</span><span>★</span></div><strong></strong><small>送你三颗鼓励星！</small></div>
    <small class="practice-note">录音可在本次阅读中回听，不会上传。</small>
  </section>`;
}

// Recordings live only in this reader session. Nothing is uploaded or persisted.
export function createReadingPractice({root, beforeAudio = () => {}, onBusyChange = () => {}}) {
  const button = root.querySelector('.practice-record');
  const label = root.querySelector('.practice-record-label');
  const help = root.querySelector('.practice-record-help');
  const icon = root.querySelector('.practice-record-icon');
  const status = root.querySelector('.practice-status');
  const reward = root.querySelector('.practice-reward');
  const replayButtons = [...root.querySelectorAll('[data-practice-play]')];
  const events = new AbortController();
  const pages = new Map();
  let pageKey, state = 'idle', pending = 0, disposed = false;
  let capture = null, timer = 0, rewardTimer = 0, player = null, playbackToken = 0;
  const takes = () => pages.get(pageKey) || [];
  const listen = (el, type, fn) => el.addEventListener(type, fn, {signal: events.signal});
  const release = stream => stream?.getTracks().forEach(track => track.stop());
  const closeReward = () => {clearTimeout(rewardTimer);reward.hidden = true;};
  const announce = message => {status.textContent = message;};
  function render() {
    const count = takes().length;
    const active = state !== 'idle';
    root.dataset.state = state;
    button.disabled = state === 'requesting' || state === 'stopping';
    icon.innerHTML = state === 'recording' ? stopIcon : mic;
    label.textContent = state === 'requesting' ? '正在打开麦克风…' : state === 'stopping' ? '正在保存录音…' : state === 'recording' ? `${ordinals[count]} · 点击完成` : count === 2 ? '再练两遍' : `${ordinals[count]} · 点我录音`;
    help.textContent = state === 'recording' ? '正在录音 · 00:00' : count === 2 && !active ? '你已经完成两遍啦！' : '读完后，再点一下完成';
    root.querySelectorAll('[data-practice-step]').forEach((el, i) => {
      el.classList.toggle('is-complete', i < count);
      el.classList.toggle('is-current', i === count);
      el.querySelector('.practice-step-stars').textContent = i < count ? '★★★' : '';
      el.setAttribute('aria-label', `${ordinals[i]}${i < count ? '已完成，三颗鼓励星' : i === count ? '，轮到这一遍' : '，还没开始'}`);
    });
    replayButtons.forEach((el, i) => {el.disabled = !takes()[i] || active;});
    onBusyChange(active);
  }
  function stopPlayback() {
    playbackToken++;
    if (player) {player.pause();player.removeAttribute('src');player.load();player = null;}
    replayButtons.forEach((el, i) => {el.textContent = `▷ 听${ordinals[i]}`;el.setAttribute('aria-pressed', 'false');});
  }
  function cancel(message) {
    pending++;
    clearInterval(timer);closeReward();stopPlayback();
    const old = capture;capture = null;
    if (old) {
      clearTimeout(old.timeout);
      old.recorder.ondataavailable = old.recorder.onstop = old.recorder.onerror = null;
      try {if (old.recorder.state !== 'inactive') old.recorder.stop();} catch {}
      release(old.stream);
    }
    state = 'idle';
    if (!disposed) {render();if (message) announce(message);}
  }
  function fail(message) {cancel(message);}
  function finish() {
    if (state !== 'recording' || !capture) return;
    state = 'stopping';capture.save = true;clearInterval(timer);render();
    const current = capture;
    current.timeout = setTimeout(() => {if (capture === current) fail('这次没有保存成功，点按钮再录一次吧。');}, 5000);
    try {current.recorder.stop();} catch {fail('录音中断了，再试一次吧。');}
  }
  async function start() {
    if (state !== 'idle' || disposed) return;
    if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) {
      announce('这个浏览器暂不支持录音，请用 Safari 或 Chrome 打开网页。');return;
    }
    // A retry starts a fresh pair, only after the child explicitly asks for it.
    if (takes().length === 2) {takes().forEach(take => URL.revokeObjectURL(take.url));pages.set(pageKey, []);}
    beforeAudio();stopPlayback();closeReward();state = 'requesting';render();
    announce('第一次使用时，请允许麦克风。');
    const token = ++pending, key = pageKey;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}, video: false});
      if (disposed || token !== pending || key !== pageKey || document.hidden) {release(stream);return;}
      const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(value => MediaRecorder.isTypeSupported?.(value));
      const recorder = new MediaRecorder(stream, type ? {mimeType: type} : undefined);
      const current = {recorder, stream, key, token, chunks: [], save: false, timeout: 0};capture = current;
      recorder.ondataavailable = event => {if (capture === current && event.data.size) current.chunks.push(event.data);};
      recorder.onerror = () => {if (capture === current) fail('麦克风暂时不可用，请再试一次。');};
      recorder.onstop = () => {
        release(stream);clearTimeout(current.timeout);
        if (disposed || capture !== current || token !== pending || key !== pageKey) return;
        clearInterval(timer);capture = null;state = 'idle';
        const blob = new Blob(current.chunks, {type: recorder.mimeType || current.chunks[0]?.type || type || 'audio/webm'});
        if (!current.save || !blob.size) {render();announce('这次录音没有保存，请点按钮再录一次。');return;}
        const list = takes();list.push({url: URL.createObjectURL(blob)});pages.set(key, list);render();
        const completed = list.length;
        announce(completed === 1 ? '第一次完成！准备好后，自己点击开始第二次。' : '两遍都完成啦！可以听听自己的声音，或翻到下一页。');
        reward.querySelector('strong').textContent = `${ordinals[completed - 1]}完成，太棒啦！`;
        reward.hidden = false;
        rewardTimer = setTimeout(closeReward, 2200);
      };
      for (const track of stream.getAudioTracks()) {
        track.addEventListener('ended', () => {if (capture === current && state === 'recording') fail('录音中断了，点按钮再试一次吧。');}, {once: true});
      }
      recorder.start();state = 'recording';render();announce('轮到你读啦！读完后，点大按钮完成。');
      const started = performance.now();
      timer = setInterval(() => {
        const seconds = Math.floor((performance.now() - started) / 1000);
        help.textContent = `正在录音 · ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        if (seconds >= 120) finish();
      }, 250);
    } catch (error) {
      release(stream);
      if (disposed || token !== pending || key !== pageKey) return;
      const message = error.name === 'NotAllowedError' || error.name === 'SecurityError' ? '请允许这个网页使用麦克风，再点按钮试一次。' : error.name === 'NotFoundError' ? '没有找到麦克风，请检查设备后再试。' : '麦克风暂时无法打开，请关闭其他录音后再试。';
      fail(message);
    }
  }
  listen(button, 'click', () => state === 'recording' ? finish() : start());
  replayButtons.forEach((el, i) => listen(el, 'click', async () => {
    if (state !== 'idle' || !takes()[i]) return;
    const wasPlaying = el.getAttribute('aria-pressed') === 'true';stopPlayback();
    if (wasPlaying) return;
    beforeAudio();closeReward();const token = playbackToken;
    const media = new Audio(takes()[i].url);player = media;media.setAttribute('playsinline', '');
    el.textContent = `Ⅱ ${ordinals[i]}`;el.setAttribute('aria-pressed', 'true');
    media.onended = () => {if (player === media) stopPlayback();};
    try {await media.play();} catch {if (token === playbackToken) {stopPlayback();announce('暂时不能回听，请再点一次。');}}
  }));
  listen(document, 'visibilitychange', () => {if (document.hidden) cancel('回来后，可以继续练习。');});
  listen(window, 'pagehide', () => cancel());
  return {
    get busy() {return state !== 'idle';},
    stopPlayback,
    setPage(key) {cancel();pageKey = key;if (!pages.has(key)) pages.set(key, []);render();announce(takes().length === 2 ? '这一页已读两遍！可以回听自己的声音。' : takes().length === 1 ? '第一次完成啦，准备好后开始第二次。' : '点大按钮，录下自己的声音吧。');},
    dispose() {disposed = true;cancel();events.abort();for (const list of pages.values()) for (const take of list) URL.revokeObjectURL(take.url);pages.clear();}
  };
}
