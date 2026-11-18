// Run with: node tests/run.mjs   (no dependencies)
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { analyzeAlert } from '../js/alertguard.js';
import {
  numberToWords, parseSpokenAmount, spokenToDigits, normalizeAccount, spellDigits, assessTransfer, HIGH_VALUE,
} from '../js/transferguard.js';
import {
  extractFeatures, frameBrightness, train, predict, evaluateHeldOut, FEATURE_LENGTH, DENOMINATIONS,
} from '../js/notes.js';
import { STRINGS, t, alertMessage, transferMessages, noteMessage } from '../js/i18n.js';

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ---------- Alert Guard ----------
test('normal credit alert parsed with amount and balance', () => {
  const r = analyzeAlert('Acct:012***789 Credit Amt: NGN 5,000.00 Desc: TRF FROM JOHN Avail Bal: NGN 23,450.50', 'GTBANK');
  assert.equal(r.type, 'credit');
  assert.equal(r.amount, 5000);
  assert.equal(r.balance, 23450.5);
  assert.equal(r.verdict, 'normal');
});

test('debit alert parsed', () => {
  const r = analyzeAlert('Debit alert: N2,500 purchase at SHOPRITE. Bal: N10,000', 'ACCESS');
  assert.equal(r.type, 'debit');
  assert.equal(r.amount, 2500);
  assert.equal(r.balance, 10000);
  assert.equal(r.verdict, 'normal');
});

test('phishing link + urgency is suspicious', () => {
  const r = analyzeAlert('Your account will be blocked immediately. Verify now at http://bank-secure.xyz/login');
  assert.equal(r.verdict, 'suspicious');
  assert.ok(r.flags.some((f) => f.id === 'link'));
  assert.ok(r.flags.some((f) => f.id === 'urgency'));
});

test('asking for OTP is suspicious', () => {
  const r = analyzeAlert('Please send your OTP and BVN to confirm your account.');
  assert.equal(r.verdict, 'suspicious');
  assert.ok(r.flags.some((f) => f.id === 'secret'));
});

test('real-looking alert warning "never share your PIN" does not trigger the secret flag', () => {
  const r = analyzeAlert('Credit N5,000. Bal N9,000. Never share your PIN or OTP with anyone.', 'UBA');
  assert.ok(!r.flags.some((f) => f.id === 'secret'), 'warning text should not be treated as a request');
  assert.equal(r.verdict, 'normal');
});

test('credit alert from a phone number is flagged', () => {
  const r = analyzeAlert('Credit alert N50,000 received. Bal N51,200', '08031234567');
  assert.ok(r.flags.some((f) => f.id === 'phoneSender'));
  assert.equal(r.verdict, 'suspicious');
});

test('"wrongly sent, please refund" story is flagged', () => {
  const r = analyzeAlert('N20,000 sent to you wrongly, refund me. Credit will reflect shortly.');
  assert.ok(r.flags.some((f) => f.id === 'reversal'));
});

test('empty text handled', () => {
  const r = analyzeAlert('   ');
  assert.equal(r.empty, true);
});

test('credit with no balance gets a mild caution', () => {
  const r = analyzeAlert('Credit alert N5,000 from Musa', 'FIRSTBANK');
  assert.equal(r.verdict, 'caution');
});

// ---------- Transfer Guard ----------
test('numberToWords', () => {
  assert.equal(numberToWords(0), 'zero');
  assert.equal(numberToWords(5000), 'five thousand');
  assert.equal(numberToWords(50000), 'fifty thousand');
  assert.equal(numberToWords(500000), 'five hundred thousand');
  assert.equal(numberToWords(1250), 'one thousand two hundred and fifty');
  assert.equal(numberToWords(2000005), 'two million and five');
});

test('parseSpokenAmount handles digits, commas, k, words', () => {
  assert.equal(parseSpokenAmount('5000'), 5000);
  assert.equal(parseSpokenAmount('₦5,000.50'), 5000.5);
  assert.equal(parseSpokenAmount('5k'), 5000);
  assert.equal(parseSpokenAmount('5 thousand'), 5000);
  assert.equal(parseSpokenAmount('five thousand naira'), 5000);
  assert.equal(parseSpokenAmount('five thousand five hundred'), 5500);
  assert.equal(parseSpokenAmount('two hundred and fifty'), 250);
  assert.equal(parseSpokenAmount('twenty-one'), 21);
  assert.equal(parseSpokenAmount('banana'), null);
  assert.equal(parseSpokenAmount(''), null);
});

test('spokenToDigits', () => {
  assert.equal(spokenToDigits('zero one two 3 4 five six seven eight nine'), '0123456789');
  assert.equal(spokenToDigits('oh eight oh three'), '0803');
  assert.equal(spokenToDigits('my number is 0803 123 4567'), '08031234567');
});

test('account normalisation and spelling', () => {
  assert.equal(normalizeAccount('012 345-6789'), '0123456789');
  assert.equal(spellDigits('0123456789'), '0 1 2, 3 4 5, 6 7 8 9');
});

test('assessTransfer: valid, high value, new recipient', () => {
  const a = assessTransfer({ amountInput: '5000', accountInput: '0123456789', knownAccounts: [] });
  assert.equal(a.valid, true);
  assert.equal(a.high, false);
  assert.equal(a.newRecipient, true);
  assert.equal(a.confirmsNeeded, 1);
  const b = assessTransfer({ amountInput: String(HIGH_VALUE), accountInput: '0123456789', knownAccounts: ['0123456789'] });
  assert.equal(b.high, true);
  assert.equal(b.newRecipient, false);
  assert.equal(b.confirmsNeeded, 2);
});

test('assessTransfer catches bad account length and bad amount', () => {
  const a = assessTransfer({ amountInput: 'lots', accountInput: '12345' });
  assert.equal(a.valid, false);
  assert.deepEqual(a.issues.sort(), ['badAccount', 'noAmount']);
});

// ---------- i18n ----------
test('English and Hausa have the same keys', () => {
  const en = Object.keys(STRINGS.en).sort();
  const ha = Object.keys(STRINGS.ha).sort();
  assert.deepEqual(ha, en);
});

test('every {placeholder} in English exists in Hausa where used', () => {
  const ph = (s) => (typeof s === 'string' ? (s.match(/\{\w+\}/g) || []).sort() : []);
  const allowedMissing = new Set(['tfReadback', 'tfHigh']); // Hausa read-back says the amount only once
  for (const k of Object.keys(STRINGS.en)) {
    if (allowedMissing.has(k)) continue;
    assert.deepEqual(ph(STRINGS.ha[k]), ph(STRINGS.en[k]), 'placeholder mismatch in ' + k);
  }
});

test('every denomination has a spoken word in both languages', () => {
  for (const lang of ['en', 'ha']) {
    for (const d of DENOMINATIONS) assert.ok(STRINGS[lang].noteWord[d], `${lang} missing word for ${d}`);
  }
});

test('alertMessage builds the right text', () => {
  const normal = alertMessage('en', analyzeAlert('Credit N5,000. Bal N9,000.', 'UBA'));
  assert.match(normal, /Check your balance/);
  const scam = alertMessage('ha', analyzeAlert('Send your OTP now, account will be blocked immediately'));
  assert.match(scam, /Gargaɗi/);
  assert.match(scam, /PIN ko OTP/);
});

test('transferMessages: problems vs read-back', () => {
  const bad = transferMessages('en', assessTransfer({ amountInput: '5000', accountInput: '123' }));
  assert.equal(bad.problems.length, 1);
  const ok = transferMessages('en', assessTransfer({ amountInput: '5000', accountInput: '0123456789' }), 'GTBank');
  assert.match(ok.readback, /five thousand naira/);
  assert.match(ok.readback, /0 1 2, 3 4 5, 6 7 8 9/);
  assert.match(ok.readback, /GTBank/);
});

test('noteMessage uses Hausa words in Hausa', () => {
  assert.match(noteMessage('ha', 500, true), /dari biyar/);
  assert.match(noteMessage('en', 500, true), /500 naira/);
});

// ---------- Notes (synthetic images) ----------
// Each fake "denomination" gets its own colour layout. We vary lighting and add noise,
// so the test checks that classification survives realistic variation. It does NOT measure
// real-world accuracy on real notes; that needs real photos.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const PALETTE = {
  100: [[120, 90, 60], [160, 130, 80]],
  200: [[70, 130, 70], [110, 170, 100]],
  500: [[60, 90, 160], [110, 130, 190]],
  1000: [[150, 60, 70], [200, 110, 120]],
};
function fakeNote(denom, rand, light) {
  const w = 96, h = 48;
  const data = new Uint8ClampedArray(w * h * 4);
  const [a, b] = PALETTE[denom];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const mix = x < w / 2 ? 0.2 + 0.6 * (x / w) : 0.5 + 0.4 * (y / h);
    const i = (y * w + x) * 4;
    for (let c = 0; c < 3; c++) {
      const v = (a[c] * (1 - mix) + b[c] * mix) * light + (rand() - 0.5) * 24;
      data[i + c] = Math.max(0, Math.min(255, v));
    }
    data[i + 3] = 255;
  }
  return { data, width: w, height: h };
}
function makeDataset(sessionsPerClass = 4, framesPerSession = 6, seed = 7) {
  const rand = rng(seed);
  const samples = [];
  let sid = 0;
  for (const d of Object.keys(PALETTE).map(Number)) {
    for (let s = 0; s < sessionsPerClass; s++) {
      const light = 0.6 + rand() * 0.8;
      sid++;
      for (let f = 0; f < framesPerSession; f++) {
        samples.push({ label: d, session: 's' + sid, features: extractFeatures(fakeNote(d, rand, light * (0.95 + rand() * 0.1))) });
      }
    }
  }
  return samples;
}

test('extractFeatures returns a fixed-length finite vector', () => {
  const f = extractFeatures(fakeNote(200, rng(1), 1));
  assert.equal(f.length, FEATURE_LENGTH);
  assert.ok(f.every(Number.isFinite));
});

test('frameBrightness separates dark from bright', () => {
  assert.ok(frameBrightness(fakeNote(200, rng(2), 0.1)) < 40);
  assert.ok(frameBrightness(fakeNote(200, rng(2), 1.4)) > 90);
});

test('classifier recognises held-out synthetic notes under new lighting', () => {
  const ds = makeDataset();
  const res = evaluateHeldOut(ds);
  assert.ok(res.accuracy >= 0.9, 'held-out accuracy was ' + res.accuracy);
});

test('classifier rejects an unseen colour pattern', () => {
  const model = train(makeDataset());
  const rand = rng(99);
  const w = 96, h = 48;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) { data[i] = 250; data[i + 1] = 250; data[i + 2] = 20 + rand() * 10; data[i + 3] = 255; } // bright yellow
  const p = predict(model, extractFeatures({ data, width: w, height: h }));
  assert.equal(p.rejected, true);
});

test('predict on empty model is safe', () => {
  const p = predict(null, new Array(FEATURE_LENGTH).fill(0));
  assert.equal(p.rejected, true);
  assert.equal(p.label, null);
});

test('evaluateHeldOut refuses to score a single session', () => {
  const ds = makeDataset(1);
  assert.equal(evaluateHeldOut(ds).accuracy, null);
});

// Export a synthetic dataset so tools/evaluate.py can be cross-checked against the JS result.
test('write synthetic dataset for the python cross-check', () => {
  const ds = makeDataset();
  const dir = new URL('../tests/fixtures/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  const js = evaluateHeldOut(ds);
  writeFileSync(new URL('synthetic_dataset.json', dir), JSON.stringify({ version: 1, samples: ds }));
  writeFileSync(new URL('synthetic_expected.json', dir), JSON.stringify({ accuracy: js.accuracy, tested: js.tested }));
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e.message || e).split('\n')[0]); }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
