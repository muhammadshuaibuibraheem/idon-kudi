// Text-to-speech and (optional) speech-to-text wrappers.

const LANG_TAG = { en: 'en-NG', ha: 'ha-NG' };
let voices = [];

export function initSpeech() {
  if (!('speechSynthesis' in window)) return;
  const load = () => { voices = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

function pickVoice(lang) {
  const prefixes = lang === 'ha' ? ['ha'] : ['en-ng', 'en'];
  for (const p of prefixes) {
    const v = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(p));
    if (v) return v;
  }
  return null;
}

// True when we know voices are listed and none matches the language.
export function missingVoice(lang) {
  return voices.length > 0 && !pickVoice(lang);
}

export function ttsAvailable() {
  return 'speechSynthesis' in window;
}

export function cancelSpeech() {
  if (ttsAvailable()) window.speechSynthesis.cancel();
}

export function speak(text, lang) {
  return new Promise((resolve) => {
    if (!ttsAvailable() || !text) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_TAG[lang] || 'en-NG';
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.rate = 0.9; // slightly slower than default; clearer for numbers
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function recognitionAvailable() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Resolves with the transcript, or rejects with an Error whose message is the error code.
// Browser speech recognition often needs an internet connection, so typing always stays available.
export function listenOnce(lang = 'en-NG') {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject(new Error('unsupported'));
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => resolve(e.results[0][0].transcript);
    rec.onerror = (e) => reject(new Error(e.error || 'error'));
    rec.onnomatch = () => reject(new Error('nomatch'));
    try { rec.start(); } catch (e) { reject(e); }
  });
}
