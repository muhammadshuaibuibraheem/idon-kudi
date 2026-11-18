// Naira note identifier: on-device features + k-nearest-neighbour classifier.
//
// Why this and not a deep network? It needs no ML runtime, trains in seconds on a phone
// from photos the user takes, works fully offline, and is easy to inspect and reproduce.
// The classifier sits behind two functions (train, predict), so a TFLite/ONNX CNN can replace
// it later without touching the UI. Accuracy depends entirely on the data collected:
// check it with evaluateHeldOut() before trusting it.

export const DENOMINATIONS = [5, 10, 20, 50, 100, 200, 500, 1000];
export const GRID_W = 6;
export const GRID_H = 3;
export const HUE_BINS = 8;
export const FEATURE_LENGTH = GRID_W * GRID_H * 3 + HUE_BINS;
const K = 5;

// img: { data: Uint8ClampedArray (RGBA), width, height }. Returns an array of FEATURE_LENGTH numbers.
export function extractFeatures(img) {
  const { data, width: w, height: h } = img;
  const x0 = Math.floor(w * 0.05), x1 = Math.ceil(w * 0.95);
  const y0 = Math.floor(h * 0.05), y1 = Math.ceil(h * 0.95);
  const cw = (x1 - x0) / GRID_W, ch = (y1 - y0) / GRID_H;

  const sums = new Float64Array(GRID_W * GRID_H * 3);
  const counts = new Float64Array(GRID_W * GRID_H);
  const hue = new Float64Array(HUE_BINS);
  let lumTotal = 0, pixels = 0;

  for (let y = y0; y < y1; y++) {
    const gy = Math.min(GRID_H - 1, Math.floor((y - y0) / ch));
    for (let x = x0; x < x1; x++) {
      const gx = Math.min(GRID_W - 1, Math.floor((x - x0) / cw));
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const cell = gy * GRID_W + gx;
      sums[cell * 3] += r; sums[cell * 3 + 1] += g; sums[cell * 3 + 2] += b;
      counts[cell]++;
      lumTotal += 0.299 * r + 0.587 * g + 0.114 * b;
      pixels++;

      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat > 0.15 && max > 30) {
        let hh;
        const d = max - min;
        if (max === r) hh = ((g - b) / d) % 6;
        else if (max === g) hh = (b - r) / d + 2;
        else hh = (r - g) / d + 4;
        hh = (hh * 60 + 360) % 360;
        hue[Math.min(HUE_BINS - 1, Math.floor((hh / 360) * HUE_BINS))] += sat;
      }
    }
  }

  const meanLum = pixels ? lumTotal / pixels : 1;
  const out = [];
  for (let c = 0; c < GRID_W * GRID_H; c++) {
    const n = counts[c] || 1;
    const r = sums[c * 3] / n, g = sums[c * 3 + 1] / n, b = sums[c * 3 + 2] / n;
    const total = r + g + b || 1;
    // Chromaticity (colour independent of brightness) plus brightness relative to the whole frame.
    out.push(r / total, g / total, (0.299 * r + 0.587 * g + 0.114 * b) / (meanLum || 1));
  }
  const hueSum = hue.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < HUE_BINS; i++) out.push(hue[i] / hueSum);
  return out.map((v) => Math.round(v * 1e4) / 1e4);
}

// Quick quality check on a frame so we can say "too dark" before guessing.
export function frameBrightness(img) {
  const { data } = img;
  let sum = 0, n = 0;
  for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    n++;
  }
  return n ? sum / n : 0;
}

function dist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

// samples: [{ label: 500, features: [...], session: 'abc' }]
export function train(samples) {
  if (!samples.length) return null;
  const n = FEATURE_LENGTH;
  const mean = new Array(n).fill(0), std = new Array(n).fill(0);
  for (const s of samples) for (let i = 0; i < n; i++) mean[i] += s.features[i];
  for (let i = 0; i < n; i++) mean[i] /= samples.length;
  for (const s of samples) for (let i = 0; i < n; i++) std[i] += (s.features[i] - mean[i]) ** 2;
  for (let i = 0; i < n; i++) std[i] = Math.sqrt(std[i] / samples.length) || 1;

  const norm = (f) => f.map((v, i) => (v - mean[i]) / std[i]);
  const points = samples.map((s) => ({ label: s.label, session: s.session, x: norm(s.features) }));

  // Reject threshold: a new frame farther from every training point than ~1.5x the typical
  // nearest-neighbour distance (measured across different sessions) is "not a note I know".
  const nn = [];
  for (const p of points) {
    let best = Infinity;
    for (const q of points) {
      if (q.session === p.session) continue;
      const d = dist(p.x, q.x);
      if (d < best) best = d;
    }
    if (best < Infinity) nn.push(best);
  }
  nn.sort((a, b) => a - b);
  const p95 = nn.length ? nn[Math.min(nn.length - 1, Math.floor(nn.length * 0.95))] : 1e9;
  return { mean, std, points, rejectDist: p95 * 1.5, norm };
}

export function predict(model, features) {
  if (!model || !model.points.length) return { label: null, confidence: 0, rejected: true, nearest: Infinity };
  const x = features.map((v, i) => (v - model.mean[i]) / model.std[i]);
  const scored = model.points.map((p) => ({ label: p.label, d: dist(x, p.x) }));
  scored.sort((a, b) => a.d - b.d);
  const top = scored.slice(0, K);
  const votes = new Map();
  let total = 0;
  for (const t of top) {
    const w = 1 / (t.d + 1e-6);
    votes.set(t.label, (votes.get(t.label) || 0) + w);
    total += w;
  }
  let label = null, best = 0;
  for (const [l, v] of votes) if (v > best) { best = v; label = l; }
  const confidence = total ? best / total : 0;
  const nearest = top[0].d;
  return { label, confidence, nearest, rejected: nearest > model.rejectDist };
}

// Honest accuracy estimate: when testing a sample, hide every sample from the same capture
// session (otherwise near-identical consecutive frames make the score look far better than real life).
export function evaluateHeldOut(samples) {
  const labels = [...new Set(samples.map((s) => s.label))].sort((a, b) => a - b);
  const sessions = new Set(samples.map((s) => s.session));
  if (labels.length < 2 || sessions.size < 2) return { accuracy: null, tested: 0, confusion: {}, labels };

  const confusion = {};
  labels.forEach((l) => { confusion[l] = {}; labels.forEach((m) => (confusion[l][m] = 0)); });
  let correct = 0, tested = 0;
  for (const session of sessions) {
    const trainSet = samples.filter((s) => s.session !== session);
    const testSet = samples.filter((s) => s.session === session);
    const trainLabels = new Set(trainSet.map((s) => s.label));
    if (trainLabels.size < 2) continue;
    const model = train(trainSet);
    for (const s of testSet) {
      if (!trainLabels.has(s.label)) continue;
      const p = predict(model, s.features);
      confusion[s.label][p.label] = (confusion[s.label][p.label] || 0) + 1;
      tested++;
      if (p.label === s.label) correct++;
    }
  }
  return { accuracy: tested ? correct / tested : null, tested, confusion, labels };
}

export function classCounts(samples) {
  const c = {};
  for (const s of samples) c[s.label] = (c[s.label] || 0) + 1;
  return c;
}
