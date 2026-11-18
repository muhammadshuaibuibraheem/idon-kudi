// Local storage helpers. Everything stays on the phone.
import { DENOMINATIONS, FEATURE_LENGTH } from './notes.js';

const KEY_DATA = 'ik.dataset';
const KEY_RECIPIENTS = 'ik.recipients';
const KEY_PREFS = 'ik.prefs';
const MAX_SAMPLES = 5000;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

export const prefs = {
  get: () => read(KEY_PREFS, { lang: 'en', sr: false }),
  set: (p) => write(KEY_PREFS, p),
};

export const dataset = {
  all: () => read(KEY_DATA, []),
  add(samples) {
    const all = dataset.all().concat(samples).slice(-MAX_SAMPLES);
    return write(KEY_DATA, all);
  },
  clear: () => write(KEY_DATA, []),
};

export const recipients = {
  all: () => read(KEY_RECIPIENTS, []),
  add(account) {
    const list = recipients.all().filter((a) => a !== account);
    list.push(account);
    write(KEY_RECIPIENTS, list.slice(-50));
  },
};

// Imported files are untrusted: check every field before using it.
export function validateDataset(obj) {
  if (!obj || !Array.isArray(obj.samples)) throw new Error('Not a dataset file.');
  const out = [];
  for (const s of obj.samples.slice(0, MAX_SAMPLES)) {
    if (!s || !DENOMINATIONS.includes(s.label)) continue;
    if (!Array.isArray(s.features) || s.features.length !== FEATURE_LENGTH) continue;
    if (!s.features.every((v) => typeof v === 'number' && Number.isFinite(v))) continue;
    out.push({ label: s.label, session: String(s.session || 'x').slice(0, 40), features: s.features });
  }
  return out;
}

export function exportDataset() {
  const payload = {
    version: 1,
    app: 'idon-kudi',
    featureLength: FEATURE_LENGTH,
    denominations: DENOMINATIONS,
    samples: dataset.all(),
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'idon-kudi-dataset.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
