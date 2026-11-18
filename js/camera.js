// Camera access shared by the Notes and Teach tabs.

let stream = null;
let track = null;
const FRAME_W = 128;
const FRAME_H = 72;

export function cameraOn() {
  return !!stream;
}

export async function startCamera(video) {
  if (stream) return;
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  track = stream.getVideoTracks()[0];
  video.srcObject = stream;
  await video.play();
}

export function stopCamera(video) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  track = null;
  if (video) video.srcObject = null;
}

export function torchSupported() {
  try {
    return !!(track && track.getCapabilities && track.getCapabilities().torch);
  } catch {
    return false;
  }
}

export async function setTorch(on) {
  if (!torchSupported()) return false;
  try {
    await track.applyConstraints({ advanced: [{ torch: on }] });
    return true;
  } catch {
    return false;
  }
}

// Returns ImageData-like { data, width, height } of the current frame, downscaled.
export function grabFrame(video, canvas) {
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, FRAME_W, FRAME_H);
  return ctx.getImageData(0, 0, FRAME_W, FRAME_H);
}
