const mic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>';
const stopIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>';

export function practiceMarkup() {
  return `<section class="reading-practice" lang="zh-CN" aria-label="跟读录音">
    <button type="button" class="practice-record" aria-label="开始录音" aria-pressed="false"><span class="practice-record-icon">${mic}</span></button>
    <p class="practice-status reader-hint" role="status" aria-live="polite"></p>
    <div class="practice-reward" hidden role="status" aria-label="太棒啦，三颗鼓励星！"><span aria-hidden="true">★</span><span aria-hidden="true">★</span><span aria-hidden="true">★</span></div>
  </section>`;
}

// Detect sustained audible signal, not pronunciation or reading quality.
// A short click or encoded silence must not earn stars.
export function createSoundDetector() {
  let audibleMs = 0;
  return {sample(samples, elapsedMs) {
    if (!samples.length) return false;
    let sum = 0, squares = 0;
    for (const value of samples) {sum += value;squares += value * value;}
    const rms = Math.sqrt(Math.max(0, squares / samples.length - (sum / samples.length) ** 2));
    if (rms >= .0032) audibleMs += Math.max(0, Math.min(50, elapsedMs));
    return audibleMs >= 120;
  }};
}

// Audio is checked on the device, then discarded. Nothing is uploaded or stored.
export function createReadingPractice({root, beforeAudio = () => {}, onBusyChange = () => {}}) {
  const button = root.querySelector('.practice-record');
  const icon = root.querySelector('.practice-record-icon');
  const status = root.querySelector('.practice-status');
  const reward = root.querySelector('.practice-reward');
  const events = new AbortController();
  let pageKey, state = 'idle', pending = 0, disposed = false;
  let capture = null, limitTimer = 0, rewardTimer = 0, meterTimer = 0, soundContext = null, pendingStream = null;
  const listen = (el, type, fn) => el.addEventListener(type, fn, {signal: events.signal});
  const release = stream => stream?.getTracks().forEach(track => track.stop());
  const closeReward = () => {clearTimeout(rewardTimer);reward.hidden = true;};
  const announce = message => {status.textContent = message;};
  function render() {
    root.dataset.state = state;
    button.disabled = state === 'requesting' || state === 'checking';
    button.setAttribute('aria-busy', String(button.disabled));
    button.setAttribute('aria-pressed', String(state === 'recording'));
    button.setAttribute('aria-label', state === 'recording' ? '完成录音' : state === 'requesting' ? '正在打开麦克风' : state === 'checking' ? '正在检查录音' : '开始录音');
    icon.innerHTML = state === 'recording' ? stopIcon : mic;
    onBusyChange(state !== 'idle');
  }
  function cancel(message = '') {
    pending++;
    clearTimeout(limitTimer);clearInterval(meterTimer);closeReward();
    if (soundContext) {soundContext.close().catch(() => {});soundContext = null;}
    release(pendingStream);pendingStream = null;
    const old = capture;capture = null;
    if (old) {
      clearTimeout(old.timeout);
      old.recorder.ondataavailable = old.recorder.onstop = old.recorder.onerror = null;
      try {if (old.recorder.state !== 'inactive') old.recorder.stop();} catch {}
      release(old.stream);
    }
    state = 'idle';
    if (!disposed) {render();announce(message);}
  }
  function finish() {
    if (state !== 'recording' || !capture) return;
    capture.sample();clearInterval(meterTimer);
    state = 'checking';capture.save = true;clearTimeout(limitTimer);render();
    const current = capture;
    current.timeout = setTimeout(() => {if (capture === current) cancel('录音没能完成，请再试一次。');}, 8000);
    try {current.recorder.stop();} catch {cancel('录音中断了，再试一次吧。');}
  }
  async function start() {
    if (state !== 'idle' || disposed) return;
    if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder || !(globalThis.AudioContext || globalThis.webkitAudioContext)) {
      announce('这个浏览器暂不支持录音，请用 Safari 或 Chrome 打开。');return;
    }
    beforeAudio();closeReward();state = 'requesting';render();announce('');
    const token = ++pending, key = pageKey;
    let stream, context;
    try {
      // Resume in the button gesture, before permission resolves (Safari).
      context = new (globalThis.AudioContext || globalThis.webkitAudioContext)();soundContext = context;
      const resumed = context.resume().then(() => true, () => false);
      stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}, video: false});
      if (disposed || token !== pending || key !== pageKey || document.hidden) {release(stream);if (context.state !== 'closed') context.close().catch(() => {});return;}
      pendingStream = stream;
      if (!await resumed) throw new Error('Audio input is unavailable');
      if (disposed || token !== pending || key !== pageKey || document.hidden) {release(stream);return;}
      const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(value => MediaRecorder.isTypeSupported?.(value));
      const recorder = new MediaRecorder(stream, type ? {mimeType: type} : undefined);
      const analyser = context.createAnalyser();analyser.fftSize = 1024;
      const source = context.createMediaStreamSource(stream), muted = context.createGain();muted.gain.value = 0;
      source.connect(analyser);analyser.connect(muted);muted.connect(context.destination);
      const samples = new Float32Array(analyser.fftSize), detector = createSoundDetector();
      let lastSample = performance.now();
      const current = {recorder, stream, key, token, chunks: [], save: false, timeout: 0, audible: false, sample() {
        const now = performance.now();analyser.getFloatTimeDomainData(samples);
        current.audible = detector.sample(samples, now - lastSample) || current.audible;lastSample = now;
      }};capture = current;if (pendingStream === stream) pendingStream = null;
      const valid = () => !disposed && capture === current && token === pending && key === pageKey && !document.hidden;
      recorder.ondataavailable = event => {if (capture === current && event.data.size) current.chunks.push(event.data);};
      recorder.onerror = () => {if (capture === current) cancel('麦克风暂时不可用，请再试一次。');};
      recorder.onstop = () => {
        release(stream);clearInterval(meterTimer);
        if (soundContext === context) soundContext = null;
        if (context.state !== 'closed') context.close().catch(() => {});
        if (!valid()) return;
        try {
          const blob = new Blob(current.chunks, {type: recorder.mimeType || current.chunks[0]?.type || type || 'audio/webm'});
          if (!current.save || !blob.size) {cancel('没有录到声音，请再试一次。');return;}
          const audible = current.audible;
          clearTimeout(current.timeout);capture = null;state = 'idle';render();announce('');
          if (audible) {
            reward.hidden = false;
            rewardTimer = setTimeout(closeReward, 2000);
          } else {
            button.setAttribute('aria-label', '没有录到声音，点击重新录音');
          }
        } catch {
          if (valid()) cancel('这次录音没能处理，请再试一次。');
        }
      };
      for (const track of stream.getAudioTracks()) {
        track.addEventListener('ended', () => {if (capture === current && state === 'recording') cancel('录音中断了，点按钮再试一次。');}, {once: true});
      }
      recorder.start();state = 'recording';render();
      meterTimer = setInterval(() => {if (capture === current) current.sample();}, 20);
      limitTimer = setTimeout(finish, 120000);
    } catch (error) {
      release(stream);
      if (disposed || token !== pending || key !== pageKey) return;
      const message = error.name === 'NotAllowedError' || error.name === 'SecurityError' ? '请允许麦克风，再点按钮试一次。' : error.name === 'NotFoundError' ? '没有找到麦克风，请检查设备。' : '麦克风暂时无法打开，请稍后重试。';
      cancel(message);
    }
  }
  listen(button, 'click', () => state === 'recording' ? finish() : start());
  listen(document, 'visibilitychange', () => {if (document.hidden) cancel();});
  listen(window, 'pagehide', () => cancel());
  return {
    get busy() {return state !== 'idle';},
    stopPlayback: closeReward,
    setPage(key) {cancel();pageKey = key;},
    dispose() {disposed = true;cancel();events.abort();}
  };
}
