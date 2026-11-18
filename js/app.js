import { t, noteMessage, alertMessage, transferMessages } from './i18n.js';
import { analyzeAlert } from './alertguard.js';
import { assessTransfer, spokenToDigits, parseSpokenAmount } from './transferguard.js';
import {
  DENOMINATIONS, extractFeatures, frameBrightness, train, predict, evaluateHeldOut, classCounts,
} from './notes.js';
import { initSpeech, speak, cancelSpeech, missingVoice, recognitionAvailable, listenOnce } from './speech.js';
import { startCamera, stopCamera, cameraOn, grabFrame, torchSupported, setTorch } from './camera.js';
import { prefs, dataset, recipients, validateDataset, exportDataset } from './store.js';

const $ = (id) => document.getElementById(id);
const state = {
  lang: 'en',
  sr: false, // screen-reader mode: never speak aloud, rely on the screen reader
  model: null,
  scanning: false,
  scanTimer: null,
  history: [],
  lastAnnounce: { label: null, at: 0 },
  lastDark: 0,
  torch: false,
  pendingTransfer: null,
  confirmCount: 0,
  warnedVoice: false,
};

const video = $('video');
const canvas = $('canvas');

// ---------- Output: text on screen + (optionally) spoken ----------
function say(text, { long = false, quiet = false } = {}) {
  const el = long ? $('result') : $('status');
  el.textContent = text;
  el.classList.remove('flash');
  void el.offsetWidth; // restart the flash animation
  el.classList.add('flash');
  if (!state.sr && !quiet) {
    let spoken = text;
    // Tell the user once if their phone has no voice for the chosen language.
    if (!state.warnedVoice && state.lang === 'ha' && missingVoice('ha')) {
      state.warnedVoice = true;
      spoken += ' ' + t('ha', 'noVoice');
      el.textContent = spoken;
    }
    speak(spoken, state.lang);
  }
}

function buzz(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* not supported */ }
}

// Distinct vibration patterns so a result can be felt in a noisy market or by deafblind users.
// Small notes (5, 10, 20, 50) = 1, 2, 3, 4 SHORT pulses. Big notes (100, 200, 500, 1000) = 1, 2, 3, 4 LONG pulses.
const BUZZ_ORDER = { 5: [1, 120], 10: [2, 120], 20: [3, 120], 50: [4, 120], 100: [1, 500], 200: [2, 500], 500: [3, 500], 1000: [4, 500] };
function denominationBuzz(d) {
  const [count, ms] = BUZZ_ORDER[d] || [1, 120];
  const pattern = [];
  for (let i = 0; i < count; i++) pattern.push(ms, 150);
  buzz(pattern);
}

// ---------- Language and UI text ----------
function applyLanguage() {
  const L = state.lang;
  document.documentElement.lang = L === 'ha' ? 'ha' : 'en';
  const set = (id, key) => { $(id).textContent = t(L, key); };
  set('appName', 'appName'); set('tagline', 'tagline'); set('langLabel', 'language'); set('srLabel', 'screenReaderMode');
  set('tab-notes', 'tabNotes'); set('tab-alerts', 'tabAlerts'); set('tab-transfer', 'tabTransfer'); set('tab-teach', 'tabTeach');
  set('notesIntro', 'notesIntro');
  $('scanBtn').textContent = t(L, state.scanning ? 'scanStop' : 'scanStart');
  $('torchBtn').textContent = t(L, state.torch ? 'torchOff' : 'torchOn');
  set('alertsIntro', 'alertsIntro'); set('alertSenderLabel', 'alertSender'); set('alertTextLabel', 'alertText');
  set('alertPaste', 'alertPaste'); set('alertCheck', 'alertCheck');
  set('transferIntro', 'transferIntro'); set('tfAmountLabel', 'tfAmount'); set('tfAccountLabel', 'tfAccount');
  set('tfBankLabel', 'tfBank'); set('tfCheck', 'tfCheck'); set('tfConfirm', 'tfConfirm'); set('tfCancel', 'tfCancel');
  $('tfAmountMic').textContent = '🎤'; $('tfAmountMic').setAttribute('aria-label', t(L, 'tfSpeak') + ': ' + t(L, 'tfAmount'));
  $('tfAccountMic').textContent = '🎤'; $('tfAccountMic').setAttribute('aria-label', t(L, 'tfSpeak') + ': ' + t(L, 'tfAccount'));
  set('teachIntro', 'teachIntro'); set('denomLabel', 'teachPick'); set('captureBtn', 'teachCapture');
  set('countsHead', 'teachCounts'); set('evalBtn', 'teachCheck'); set('exportBtn', 'teachExport');
  set('importText', 'teachImport'); set('clearBtn', 'teachClear'); set('teachPrivacy', 'teachPrivacy');
  $('camBtn').textContent = t(L, cameraOn() ? 'cameraStop' : 'cameraStart');
  renderDenomOptions();
  renderCounts();
  const live = state.sr ? 'polite' : 'off';
  $('status').setAttribute('aria-live', live);
  $('result').setAttribute('aria-live', live);
}

function renderDenomOptions() {
  const sel = $('denom');
  const current = sel.value;
  sel.innerHTML = '';
  for (const d of DENOMINATIONS) {
    const o = document.createElement('option');
    o.value = String(d);
    o.textContent = '₦' + d;
    sel.appendChild(o);
  }
  if (current) sel.value = current;
}

function renderCounts() {
  const counts = classCounts(dataset.all());
  const ul = $('counts');
  ul.innerHTML = '';
  for (const d of DENOMINATIONS) {
    const li = document.createElement('li');
    li.textContent = '₦' + d + ': ' + (counts[d] || 0);
    ul.appendChild(li);
  }
}

function rebuildModel() {
  const samples = dataset.all();
  const classes = new Set(samples.map((s) => s.label));
  // A model with a single class would call every note by that name, so require two.
  state.model = classes.size >= 2 ? train(samples) : null;
}

// ---------- Tabs ----------
const TABS = ['notes', 'alerts', 'transfer', 'teach'];
function showTab(name) {
  for (const n of TABS) {
    const selected = n === name;
    $('tab-' + n).setAttribute('aria-selected', String(selected));
    $('tab-' + n).tabIndex = selected ? 0 : -1;
    $('panel-' + n).hidden = !selected;
  }
  if (name !== 'notes' && state.scanning) stopScanning(false);
  const wantsCamera = name === 'notes' ? state.scanning : name === 'teach' && cameraOn();
  $('cameraBox').hidden = !wantsCamera;
  if (name !== 'teach' && name !== 'notes' && cameraOn()) { stopCamera(video); $('camBtn').textContent = t(state.lang, 'cameraStart'); }
  $('status').textContent = '';
  $('result').textContent = '';
}
for (const n of TABS) {
  $('tab-' + n).addEventListener('click', () => showTab(n));
  $('tab-' + n).addEventListener('keydown', (e) => {
    const i = TABS.indexOf(n);
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % TABS.length;
    if (e.key === 'ArrowLeft') j = (i + TABS.length - 1) % TABS.length;
    if (j !== null) { e.preventDefault(); showTab(TABS[j]); $('tab-' + TABS[j]).focus(); }
  });
}

// ---------- Notes: scanning ----------
async function ensureCamera() {
  try {
    await startCamera(video);
    return true;
  } catch {
    say(t(state.lang, 'cameraError'));
    return false;
  }
}

async function startScanning() {
  if (!state.model) { say(t(state.lang, 'noModel')); return; }
  if (!(await ensureCamera())) return;
  state.scanning = true;
  state.history = [];
  state.lastAnnounce = { label: null, at: 0 };
  $('cameraBox').hidden = false;
  $('torchBtn').hidden = !torchSupported();
  $('scanBtn').textContent = t(state.lang, 'scanStop');
  say(t(state.lang, 'scanning'));
  state.scanTimer = setInterval(scanTick, 450);
}

function stopScanning(announce = true) {
  clearInterval(state.scanTimer);
  state.scanning = false;
  state.torch = false;
  setTorch(false);
  stopCamera(video);
  $('cameraBox').hidden = true;
  $('torchBtn').hidden = true;
  $('scanBtn').textContent = t(state.lang, 'scanStart');
  $('torchBtn').textContent = t(state.lang, 'torchOn');
  if (announce) say(t(state.lang, 'scanStopped'));
}

function scanTick() {
  if (!state.scanning || !video.videoWidth) return;
  const frame = grabFrame(video, canvas);
  const now = Date.now();

  if (frameBrightness(frame) < 35) {
    state.history = [];
    if (now - state.lastDark > 5000) { state.lastDark = now; say(t(state.lang, 'tooDark')); }
    return;
  }

  const p = predict(state.model, extractFeatures(frame));
  state.history.push(p.rejected ? { label: null, confidence: 0 } : p);
  if (state.history.length > 6) state.history.shift();
  if (state.history.length < 6) return;

  const tally = new Map();
  for (const h of state.history) if (h.label !== null) tally.set(h.label, (tally.get(h.label) || 0) + 1);
  let best = null, bestN = 0;
  for (const [l, n] of tally) if (n > bestN) { best = l; bestN = n; }

  if (best !== null && bestN >= 4) {
    const conf = state.history.filter((h) => h.label === best).reduce((s, h) => s + h.confidence, 0) / bestN;
    const sure = conf >= 0.7;
    const changed = state.lastAnnounce.label !== best;
    if (changed || now - state.lastAnnounce.at > 6000) {
      state.lastAnnounce = { label: best, at: now };
      say(noteMessage(state.lang, best, sure));
      if (sure) denominationBuzz(best);
    }
  } else if (now - state.lastAnnounce.at > 6000) {
    state.lastAnnounce = { label: null, at: now };
    say(t(state.lang, 'notSure'));
  }
}

$('scanBtn').addEventListener('click', () => (state.scanning ? stopScanning() : startScanning()));
$('torchBtn').addEventListener('click', async () => {
  state.torch = !state.torch;
  const ok = await setTorch(state.torch);
  if (!ok) state.torch = false;
  $('torchBtn').textContent = t(state.lang, state.torch ? 'torchOff' : 'torchOn');
});

// ---------- Alerts ----------
function checkAlert() {
  const r = analyzeAlert($('alertText').value, $('alertSender').value);
  const msg = alertMessage(state.lang, r);
  say(msg, { long: true });
  if (r.verdict === 'suspicious') buzz([300, 100, 300, 100, 300]);
}
$('alertCheck').addEventListener('click', checkAlert);
$('alertPaste').addEventListener('click', async () => {
  try {
    $('alertText').value = await navigator.clipboard.readText();
    checkAlert();
  } catch {
    say(t(state.lang, 'alertEmpty'));
  }
});

// ---------- Transfer ----------
function resetTransfer() {
  state.pendingTransfer = null;
  state.confirmCount = 0;
  $('tfConfirmBox').hidden = true;
}
for (const id of ['tfAmount', 'tfAccount', 'tfBank']) $(id).addEventListener('input', resetTransfer);

$('tfCheck').addEventListener('click', () => {
  resetTransfer();
  const a = assessTransfer({
    amountInput: $('tfAmount').value,
    accountInput: $('tfAccount').value,
    knownAccounts: recipients.all(),
  });
  const m = transferMessages(state.lang, a, $('tfBank').value.trim());
  if (m.problems.length) { say(m.problems.join(' '), { long: true }); buzz([200, 100, 200]); return; }
  state.pendingTransfer = a;
  $('tfConfirmBox').hidden = false;
  say(m.readback, { long: true });
  $('tfConfirm').focus();
});

$('tfConfirm').addEventListener('click', () => {
  const a = state.pendingTransfer;
  if (!a) return;
  state.confirmCount++;
  if (state.confirmCount < a.confirmsNeeded) {
    say(t(state.lang, 'tfHigh', { words: a.amountWords, amount: a.amountDigits }), { long: true });
    return;
  }
  recipients.add(a.account);
  resetTransfer();
  say(t(state.lang, 'tfConfirmed'), { long: true });
});
$('tfCancel').addEventListener('click', () => {
  resetTransfer();
  say(t(state.lang, 'tfCancelled'), { long: true });
});

function wireMic(btnId, inputId, convert) {
  const btn = $(btnId);
  if (!recognitionAvailable()) return;
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    cancelSpeech();
    say(t(state.lang, 'tfListening'), { quiet: true });
    try {
      const text = await listenOnce('en-NG');
      $(inputId).value = convert(text);
      resetTransfer();
      say(t(state.lang, 'tfHeard', { text: convert(text) }));
    } catch {
      say(t(state.lang, 'tfNoSpeech'));
    }
  });
}
wireMic('tfAmountMic', 'tfAmount', (txt) => { const n = parseSpokenAmount(txt); return n === null ? txt : String(n); });
wireMic('tfAccountMic', 'tfAccount', spokenToDigits);

// ---------- Teach ----------
$('camBtn').addEventListener('click', async () => {
  if (cameraOn()) {
    stopCamera(video);
    $('cameraBox').hidden = true;
  } else if (await ensureCamera()) {
    $('cameraBox').hidden = false;
  }
  $('camBtn').textContent = t(state.lang, cameraOn() ? 'cameraStop' : 'cameraStart');
});

let capturing = false;
$('captureBtn').addEventListener('click', async () => {
  if (capturing) return;
  if (!cameraOn()) { say(t(state.lang, 'teachCameraFirst')); return; }
  capturing = true;
  const label = Number($('denom').value);
  const session = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  say(t(state.lang, 'teachCapturing'));
  const samples = [];
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const frame = grabFrame(video, canvas);
    if (frameBrightness(frame) < 35) { i--; continue; } // skip dark frames instead of learning from them
    samples.push({ label, session, features: extractFeatures(frame) });
  }
  const ok = dataset.add(samples);
  capturing = false;
  if (!ok) { say('Storage is full. Export your data, then delete some samples.'); return; }
  rebuildModel();
  renderCounts();
  say(t(state.lang, 'teachDone', { n: classCounts(dataset.all())[label] || 0, d: label }));
  buzz([150]);
});

$('evalBtn').addEventListener('click', () => {
  const res = evaluateHeldOut(dataset.all());
  if (res.accuracy === null) { say(t(state.lang, 'teachNotEnough'), { long: true }); return; }
  let text = t(state.lang, 'teachAccuracy', { pct: Math.round(res.accuracy * 100), n: res.tested });
  // Find the weakest class (lowest recall) to tell the user what to capture more of.
  let worst = null, worstRecall = 2;
  for (const l of res.labels) {
    const total = Object.values(res.confusion[l]).reduce((a, b) => a + b, 0);
    if (!total) continue;
    const recall = res.confusion[l][l] / total;
    if (recall < worstRecall) { worstRecall = recall; worst = l; }
  }
  if (worst !== null && worstRecall < 0.9) {
    text += ' ' + t(state.lang, 'teachWeakest', { d: worst, pct: Math.round(worstRecall * 100) });
  }
  say(text, { long: true });
});

$('exportBtn').addEventListener('click', exportDataset);
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const samples = validateDataset(JSON.parse(await file.text()));
    const tag = 'imp' + Date.now().toString(36) + '-';
    dataset.add(samples.map((s) => ({ ...s, session: tag + s.session })));
    rebuildModel();
    renderCounts();
    say(t(state.lang, 'teachImported', { n: samples.length }));
  } catch (err) {
    say(String(err.message || err));
  }
});
$('clearBtn').addEventListener('click', () => {
  if (!window.confirm(t(state.lang, 'teachClear') + '?')) return;
  dataset.clear();
  rebuildModel();
  renderCounts();
  say(t(state.lang, 'teachCleared'));
});

// ---------- Settings ----------
$('lang').addEventListener('change', (e) => {
  state.lang = e.target.value;
  state.warnedVoice = false;
  prefs.set({ lang: state.lang, sr: state.sr });
  applyLanguage();
});
$('srMode').addEventListener('change', (e) => {
  state.sr = e.target.checked;
  if (state.sr) cancelSpeech();
  prefs.set({ lang: state.lang, sr: state.sr });
  applyLanguage();
});

// ---------- Start-up ----------
function init() {
  initSpeech();
  const p = prefs.get();
  state.lang = p.lang === 'ha' ? 'ha' : 'en';
  state.sr = !!p.sr;
  $('lang').value = state.lang;
  $('srMode').checked = state.sr;
  rebuildModel();
  applyLanguage();

  // Text shared from the Messages app arrives as ?text=...
  const params = new URLSearchParams(location.search);
  const shared = params.get('text') || params.get('title') || '';
  if (shared) {
    showTab('alerts');
    $('alertText').value = shared.slice(0, 2000);
    history.replaceState(null, '', location.pathname);
    checkAlert();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode unavailable, app still works */ });
  }
}
init();
