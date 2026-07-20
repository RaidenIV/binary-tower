// loop.js — generated module split of app.js (behavior unchanged)
import { loopDefaults } from "./config.js";
import { updateHistory } from "./analysis.js";
import { audio, elements, state } from "./core.js";
import { clamp, formatPreciseTime, markRenderDirty } from "./utils.js";

export function setLoopStatus(message, status = "idle") {
  elements.loopStatus.textContent = message;
  elements.loopStatus.dataset.state = status;
}

export function setLoopControlsEnabled(enabled) {
  [
    elements.loopBpmValue,
    elements.loopBarsValue,
    elements.loopSnap,
    elements.detectLoopBpm,
    elements.fullTrackLoop,
    elements.loopZoomOut,
    elements.loopZoomIn,
    elements.loopZoomFit,
    elements.loopStartHandle,
    elements.loopEndHandle
  ].forEach((control) => {
    control.disabled = !enabled;
  });
  elements.loopSelectionRegion.classList.toggle("is-disabled", !enabled);
}

function getLoopBeatDuration() {
  return state.loopBpm > 0 ? 60 / state.loopBpm : 0;
}

function getLoopBarDuration() {
  return getLoopBeatDuration() * 4;
}

export function getSelectedLoopRange() {
  const duration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  if (!state.loopReady || duration <= 0) {
    return { start: 0, end: duration, duration };
  }

  const start = clamp(state.loopStart, 0, duration);
  const end = clamp(state.loopEnd, start, duration);
  return { start, end, duration: Math.max(0, end - start) };
}

export function hasPartialLoopSelection() {
  const trackDuration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  const range = getSelectedLoopRange();
  return state.loopReady && range.duration > 0.01 && range.duration < trackDuration - 0.01;
}

export function updateAudioLoopMode() {
  // Native media looping is used only for a full-track loop. A partial
  // selection is enforced from the render clock so its boundaries stay
  // aligned with the visualizer and can be moved without recreating audio.
  audio.loop = Boolean(state.audioLoop && !hasPartialLoopSelection());
}

export function resetSmoothPlaybackTo(time = audio.currentTime || 0) {
  state.smoothPlaybackTime = Number.isFinite(time) ? time : 0;
  state.smoothPlaybackValid = false;
  state.smoothPlaybackLastTimestamp = 0;
}

export function resetBinaryStreamClock(time = 0) {
  const normalizedTime = Number.isFinite(time) ? Math.max(0, time) : 0;
  state.binaryStreamTime = normalizedTime;
  state.binaryStreamTargetTime = normalizedTime;
  state.binaryStreamFrameInterval = 0;
  state.binaryStreamClockValid = false;
  state.lastBinaryStreamTimestamp = 0;
  state.binaryDeletionFrameDelta = 0;
}

export function updateBinaryStreamClock(timestamp, isPlaying) {
  if (!isPlaying) {
    state.binaryStreamTargetTime = state.binaryStreamTime;
    state.binaryStreamClockValid = false;
    state.lastBinaryStreamTimestamp = timestamp;
    state.binaryDeletionFrameDelta = 0;
    return;
  }

  if (
    !state.binaryStreamClockValid ||
    state.lastBinaryStreamTimestamp <= 0
  ) {
    state.binaryStreamClockValid = true;
    state.binaryStreamTargetTime = state.binaryStreamTime;
    state.binaryStreamFrameInterval = 0;
    state.lastBinaryStreamTimestamp = timestamp;
    state.binaryDeletionFrameDelta = 0;
    return;
  }

  const rawDelta = clamp(
    (timestamp - state.lastBinaryStreamTimestamp) / 1000,
    0,
    0.25
  );
  state.lastBinaryStreamTimestamp = timestamp;

  if (rawDelta <= 0) {
    state.binaryDeletionFrameDelta = 0;
    return;
  }

  state.binaryStreamTargetTime += rawDelta;

  // Estimate the normal refresh interval without letting an isolated delayed
  // frame redefine the cadence. This supports 30/60/120/144 Hz displays.
  const observedInterval = clamp(rawDelta, 1 / 240, 1 / 24);
  if (state.binaryStreamFrameInterval <= 0) {
    state.binaryStreamFrameInterval = observedInterval;
  } else {
    const intervalBlend = 1 - Math.exp(-rawDelta * 4);
    state.binaryStreamFrameInterval +=
      (observedInterval - state.binaryStreamFrameInterval) * intervalBlend;
  }

  const remaining = Math.max(
    0,
    state.binaryStreamTargetTime - state.binaryStreamTime
  );
  const cadenceStep = Math.min(
    remaining,
    state.binaryStreamFrameInterval
  );
  const catchUpStep = Math.min(
    Math.max(0, remaining - cadenceStep),
    state.binaryStreamFrameInterval * 0.12
  );
  const visualDelta = Math.min(remaining, cadenceStep + catchUpStep);

  state.binaryStreamTime += visualDelta;
  state.binaryDeletionFrameDelta = visualDelta;
}

export function getLoopZoomRange() {
  const duration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  if (duration <= 0) return { start: 0, end: 0, duration: 0, width: 0 };
  const start = clamp(state.loopZoomStart, 0, duration);
  const end = clamp(
    state.loopZoomEnd > start ? state.loopZoomEnd : duration,
    start,
    duration
  );
  return { start, end, duration, width: Math.max(0, end - start) };
}

function updateLoopZoomUi() {
  const range = getLoopZoomRange();
  const zoom = range.width > 0 ? range.duration / range.width : 1;
  elements.loopZoomLevel.textContent = `${zoom.toFixed(1)}×`;
  elements.loopZoomOut.disabled = !state.loopReady || zoom <= 1.001;
  elements.loopZoomIn.disabled = !state.loopReady || zoom >= 63.9;
  elements.loopZoomFit.disabled = !state.loopReady || zoom <= 1.001;
  elements.loopMinimapWindow.setAttribute("aria-valuemin", "0");
  elements.loopMinimapWindow.setAttribute(
    "aria-valuemax",
    String(Math.max(0, range.duration - range.width))
  );
  elements.loopMinimapWindow.setAttribute(
    "aria-valuenow",
    String(range.start)
  );
  elements.loopMinimapWindow.setAttribute(
    "aria-valuetext",
    `${formatPreciseTime(range.start)} to ${formatPreciseTime(range.end)}`
  );
}

function updateLoopMinimapWindow() {
  const range = getLoopZoomRange();
  const left = range.duration > 0 ? range.start / range.duration * 100 : 0;
  const width = range.duration > 0 ? range.width / range.duration * 100 : 100;
  elements.loopMinimapWindow.style.left = `${left}%`;
  elements.loopMinimapWindow.style.width = `${clamp(width, 0, 100)}%`;
  updateLoopZoomUi();
}

export function setLoopZoomWindow(start, end) {
  const duration = state.decodedAudioBuffer?.duration || 0;
  if (!state.loopReady || duration <= 0) {
    state.loopZoomStart = 0;
    state.loopZoomEnd = 0;
    updateLoopMinimapWindow();
    return;
  }

  const minimumWidth = Math.max(0.05, duration / 64);
  const requestedWidth = clamp(end - start, minimumWidth, duration);
  let nextStart = clamp(start, 0, Math.max(0, duration - requestedWidth));
  let nextEnd = nextStart + requestedWidth;
  if (nextEnd > duration) {
    nextEnd = duration;
    nextStart = Math.max(0, nextEnd - requestedWidth);
  }

  state.loopZoomStart = nextStart;
  state.loopZoomEnd = nextEnd;
  drawLoopWaveform();
  updateLoopSelectionUi();
  updateLoopPlayhead(audio.currentTime || 0);
}

export function fitLoopZoom() {
  const duration = state.decodedAudioBuffer?.duration || 0;
  setLoopZoomWindow(0, duration);
}

export function zoomLoopAtX(x, factor) {
  const range = getLoopZoomRange();
  const rect = elements.loopWaveWrap.getBoundingClientRect();
  if (!state.loopReady || range.duration <= 0 || rect.width <= 0) return;
  const relativeX = clamp(x / rect.width, 0, 1);
  const anchorTime = range.start + relativeX * range.width;
  const minimumWidth = Math.max(0.05, range.duration / 64);
  const nextWidth = clamp(range.width / factor, minimumWidth, range.duration);
  const nextStart = anchorTime - relativeX * nextWidth;
  setLoopZoomWindow(nextStart, nextStart + nextWidth);
}

export function updateLoopSelectionUi() {
  const trackDuration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  const safeDuration = Math.max(0, trackDuration);
  const start = clamp(state.loopStart, 0, safeDuration);
  const end = clamp(state.loopEnd, start, safeDuration);
  const zoomRange = getLoopZoomRange();
  const visibleWidth = Math.max(1e-9, zoomRange.width || safeDuration || 1);
  const startPercent = ((start - zoomRange.start) / visibleWidth) * 100;
  const endPercent = ((end - zoomRange.start) / visibleWidth) * 100;
  const clippedStart = clamp(startPercent, 0, 100);
  const clippedEnd = clamp(endPercent, 0, 100);

  elements.loopSelectionRegion.style.left = `${clippedStart}%`;
  elements.loopSelectionRegion.style.width = `${Math.max(0, clippedEnd - clippedStart)}%`;
  elements.loopSelectionRegion.style.display =
    endPercent < 0 || startPercent > 100 ? "none" : "block";
  elements.loopStartHandle.style.left = `${clamp(startPercent, 0, 100)}%`;
  elements.loopEndHandle.style.left = `${clamp(endPercent, 0, 100)}%`;
  elements.loopStartHandle.style.display =
    startPercent >= 0 && startPercent <= 100 ? "block" : "none";
  elements.loopEndHandle.style.display =
    endPercent >= 0 && endPercent <= 100 ? "block" : "none";
  elements.loopStartReadout.textContent = `Start ${formatPreciseTime(start)}`;
  elements.loopEndReadout.textContent = `End ${formatPreciseTime(end)}`;
  elements.loopDurationReadout.textContent =
    `Duration ${formatPreciseTime(Math.max(0, end - start))}`;
  elements.loopBeatReadout.textContent = state.loopBpm > 0
    ? `Beat ${formatPreciseTime(getLoopBeatDuration())}`
    : "Beat —";
  elements.loopBpmValue.value = String(Math.round(state.loopBpm || loopDefaults.bpm));
  elements.loopBarsValue.value = String(Math.max(1, Math.round(state.loopBars || 1)));
  elements.loopSnap.checked = state.loopSnap;
  updateAudioLoopMode();
  drawLoopMinimap();
  updateLoopMinimapWindow();
}

export function updateLoopPlayhead(time = audio.currentTime || 0) {
  const range = getLoopZoomRange();
  if (!state.loopReady || range.duration <= 0 || range.width <= 0 || time < range.start || time > range.end) {
    elements.loopPlayhead.style.display = "none";
    return;
  }
  elements.loopPlayhead.style.display = "block";
  elements.loopPlayhead.style.left = `${clamp((time - range.start) / range.width, 0, 1) * 100}%`;
}

function buildLoopWaveformPeaks() {
  const buffer = state.decodedAudioBuffer;
  if (!buffer) {
    state.loopWaveformPeaks = null;
    return;
  }

  const peakCount = 4096;
  const peaks = new Float32Array(peakCount);
  const channels = Array.from(
    { length: buffer.numberOfChannels },
    (_, channel) => buffer.getChannelData(channel)
  );
  const samplesPerPeak = Math.max(1, Math.floor(buffer.length / peakCount));

  for (let peakIndex = 0; peakIndex < peakCount; peakIndex += 1) {
    const start = peakIndex * samplesPerPeak;
    const end = Math.min(buffer.length, start + samplesPerPeak);
    let peak = 0;
    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      for (const channel of channels) {
        peak = Math.max(peak, Math.abs(channel[sampleIndex] || 0));
      }
    }
    peaks[peakIndex] = peak;
  }
  state.loopWaveformPeaks = peaks;
}

export function drawLoopWaveform() {
  const canvasElement = elements.loopWaveCanvas;
  const wrap = elements.loopWaveWrap;
  if (!canvasElement || !wrap) return;

  const rect = wrap.getBoundingClientRect();
  const cssWidth = Math.max(1, rect.width);
  const cssHeight = Math.max(1, rect.height);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(cssWidth * dpr);
  const height = Math.round(cssHeight * dpr);
  if (canvasElement.width !== width || canvasElement.height !== height) {
    canvasElement.width = width;
    canvasElement.height = height;
  }

  const loopContext = canvasElement.getContext("2d", { alpha: false });
  loopContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  loopContext.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--control-bg").trim() || "#0f0f17";
  loopContext.fillRect(0, 0, cssWidth, cssHeight);

  const peaks = state.loopWaveformPeaks;
  const duration = state.decodedAudioBuffer?.duration || 0;
  const zoomRange = getLoopZoomRange();
  if (!peaks || peaks.length === 0 || duration <= 0 || zoomRange.width <= 0) return;

  const beatDuration = getLoopBeatDuration();
  if (beatDuration > 0) {
    const firstBeat = Math.floor(zoomRange.start / beatDuration);
    const lastBeat = Math.ceil(zoomRange.end / beatDuration);
    const visibleBeatCount = Math.max(1, lastBeat - firstBeat + 1);
    const beatStep = Math.max(1, Math.ceil(visibleBeatCount / 180));
    loopContext.lineWidth = 1;
    for (let beatIndex = firstBeat; beatIndex <= lastBeat; beatIndex += beatStep) {
      const beatTime = beatIndex * beatDuration;
      const x = ((beatTime - zoomRange.start) / zoomRange.width) * cssWidth;
      if (x < 0 || x > cssWidth) continue;
      loopContext.strokeStyle = beatIndex % 4 === 0
        ? "rgba(154,154,165,0.25)"
        : "rgba(154,154,165,0.10)";
      loopContext.beginPath();
      loopContext.moveTo(x, 0);
      loopContext.lineTo(x, cssHeight);
      loopContext.stroke();
    }
  }

  loopContext.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--sidebar-accent").trim() || "#9a9aa5";
  loopContext.lineWidth = 1;
  loopContext.beginPath();
  const center = cssHeight / 2;
  const peakIndexForX = (x) => {
    const time = zoomRange.start + (x / Math.max(1, cssWidth - 1)) * zoomRange.width;
    return Math.min(
      peaks.length - 1,
      Math.max(0, Math.round((time / duration) * (peaks.length - 1)))
    );
  };
  for (let x = 0; x < Math.ceil(cssWidth); x += 1) {
    const amplitude = peaks[peakIndexForX(x)] * cssHeight * 0.43;
    if (x === 0) loopContext.moveTo(x, center - amplitude);
    else loopContext.lineTo(x, center - amplitude);
  }
  for (let x = Math.ceil(cssWidth) - 1; x >= 0; x -= 1) {
    const amplitude = peaks[peakIndexForX(x)] * cssHeight * 0.43;
    loopContext.lineTo(x, center + amplitude);
  }
  loopContext.closePath();
  loopContext.globalAlpha = 0.22;
  loopContext.fillStyle = loopContext.strokeStyle;
  loopContext.fill();
  loopContext.globalAlpha = 1;
  loopContext.stroke();
}

export function drawLoopMinimap() {
  const canvasElement = elements.loopMinimapCanvas;
  const wrap = elements.loopMinimapWrap;
  if (!canvasElement || !wrap) return;

  const rect = wrap.getBoundingClientRect();
  const cssWidth = Math.max(1, rect.width);
  const cssHeight = Math.max(1, rect.height);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(cssWidth * dpr);
  const height = Math.round(cssHeight * dpr);
  if (canvasElement.width !== width || canvasElement.height !== height) {
    canvasElement.width = width;
    canvasElement.height = height;
  }

  const minimapContext = canvasElement.getContext("2d", { alpha: false });
  minimapContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  minimapContext.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--control-bg").trim() || "#0f0f17";
  minimapContext.fillRect(0, 0, cssWidth, cssHeight);

  const peaks = state.loopWaveformPeaks;
  const duration = state.decodedAudioBuffer?.duration || 0;
  if (!peaks || peaks.length === 0 || duration <= 0) {
    updateLoopMinimapWindow();
    return;
  }

  const selectionStartX = clamp(state.loopStart / duration, 0, 1) * cssWidth;
  const selectionEndX = clamp(state.loopEnd / duration, 0, 1) * cssWidth;
  minimapContext.fillStyle = "rgba(154,154,165,0.15)";
  minimapContext.fillRect(
    selectionStartX,
    0,
    Math.max(0, selectionEndX - selectionStartX),
    cssHeight
  );

  minimapContext.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue("--sidebar-accent").trim() || "#9a9aa5";
  minimapContext.lineWidth = 1;
  minimapContext.beginPath();
  const center = cssHeight / 2;
  for (let x = 0; x < Math.ceil(cssWidth); x += 1) {
    const index = Math.min(
      peaks.length - 1,
      Math.round((x / Math.max(1, cssWidth - 1)) * (peaks.length - 1))
    );
    const amplitude = peaks[index] * cssHeight * 0.39;
    if (x === 0) minimapContext.moveTo(x, center - amplitude);
    else minimapContext.lineTo(x, center - amplitude);
  }
  for (let x = Math.ceil(cssWidth) - 1; x >= 0; x -= 1) {
    const index = Math.min(
      peaks.length - 1,
      Math.round((x / Math.max(1, cssWidth - 1)) * (peaks.length - 1))
    );
    minimapContext.lineTo(x, center + peaks[index] * cssHeight * 0.39);
  }
  minimapContext.closePath();
  minimapContext.globalAlpha = 0.2;
  minimapContext.fillStyle = minimapContext.strokeStyle;
  minimapContext.fill();
  minimapContext.globalAlpha = 1;
  minimapContext.stroke();
  updateLoopMinimapWindow();
}

export function applyLoopBars({ preserveStart = true } = {}) {
  const duration = state.decodedAudioBuffer?.duration || 0;
  const barDuration = getLoopBarDuration();
  if (!state.loopReady || duration <= 0 || barDuration <= 0) return;

  const loopDuration = Math.min(duration, Math.max(0.05, barDuration * state.loopBars));
  let start = preserveStart ? state.loopStart : 0;
  start = clamp(start, 0, Math.max(0, duration - loopDuration));
  state.loopStart = start;
  state.loopEnd = Math.min(duration, start + loopDuration);
  updateLoopSelectionUi();
  drawLoopWaveform();
}

export function setFullTrackLoop() {
  const duration = state.decodedAudioBuffer?.duration || 0;
  if (duration <= 0) return;
  state.loopStart = 0;
  state.loopEnd = duration;
  const barDuration = getLoopBarDuration();
  if (barDuration > 0) {
    state.loopBars = Math.max(1, Math.round(duration / barDuration));
  }
  updateLoopSelectionUi();
  drawLoopWaveform();
  setLoopStatus("Full-track loop selected.", "active");
}

async function detectLoopBpm(audioBuffer) {
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineContext) throw new Error("Offline audio analysis is unavailable.");

  const sampleRate = audioBuffer.sampleRate;
  const maxLength = Math.min(audioBuffer.length, sampleRate * 90);
  const mono = new Float32Array(maxLength);
  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channel = audioBuffer.getChannelData(channelIndex);
    for (let index = 0; index < maxLength; index += 1) mono[index] += channel[index];
  }
  if (audioBuffer.numberOfChannels > 1) {
    const scale = 1 / audioBuffer.numberOfChannels;
    for (let index = 0; index < maxLength; index += 1) mono[index] *= scale;
  }

  const offline = new OfflineContext(1, maxLength, sampleRate);
  const analysisBuffer = offline.createBuffer(1, maxLength, sampleRate);
  analysisBuffer.getChannelData(0).set(mono);
  const source = offline.createBufferSource();
  source.buffer = analysisBuffer;
  const lowPass = offline.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 180;
  lowPass.Q.value = 0.8;
  source.connect(lowPass);
  lowPass.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  const filtered = rendered.getChannelData(0);

  const hopSize = 512;
  const frameCount = Math.floor(filtered.length / hopSize);
  const energy = new Float32Array(frameCount);
  let maximumEnergy = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    const offset = frame * hopSize;
    for (let index = 0; index < hopSize; index += 1) {
      const sample = filtered[offset + index];
      sum += sample * sample;
    }
    energy[frame] = sum;
    maximumEnergy = Math.max(maximumEnergy, sum);
  }
  if (maximumEnergy <= 0) throw new Error("No usable beat energy was detected.");
  for (let index = 0; index < energy.length; index += 1) energy[index] /= maximumEnergy;

  const framesPerSecond = sampleRate / hopSize;
  const minimumLag = Math.max(2, Math.floor(framesPerSecond * 60 / 200));
  const maximumLag = Math.min(frameCount - 1, Math.ceil(framesPerSecond * 60 / 60));
  let bestLag = minimumLag;
  let bestCorrelation = -Infinity;
  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let correlation = 0;
    const limit = frameCount - lag;
    for (let index = 0; index < limit; index += 1) {
      correlation += energy[index] * energy[index + lag];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  let bpm = 60 * framesPerSecond / bestLag;
  while (bpm < 80) bpm *= 2;
  while (bpm > 160) bpm /= 2;
  if (!Number.isFinite(bpm)) throw new Error("BPM detection failed.");
  return Math.round(bpm);
}

let cachedLoopBpmBuffer = null;
let cachedLoopBpmPromise = null;

function getLoopBpmDetection(audioBuffer) {
  if (cachedLoopBpmBuffer === audioBuffer && cachedLoopBpmPromise) {
    return cachedLoopBpmPromise;
  }

  cachedLoopBpmBuffer = audioBuffer;
  cachedLoopBpmPromise = detectLoopBpm(audioBuffer).catch((error) => {
    if (cachedLoopBpmBuffer === audioBuffer) {
      cachedLoopBpmBuffer = null;
      cachedLoopBpmPromise = null;
    }
    throw error;
  });
  return cachedLoopBpmPromise;
}

export async function runLoopBpmDetection() {
  if (!state.decodedAudioBuffer) return;
  const version = ++state.loopBpmDetectionVersion;
  elements.detectLoopBpm.disabled = true;
  setLoopStatus("Detecting BPM from the first 90 seconds…", "active");
  try {
    const bpm = await getLoopBpmDetection(state.decodedAudioBuffer);
    if (version !== state.loopBpmDetectionVersion || !state.loopReady) return;
    state.loopBpm = clamp(bpm, 40, 300);
    applyLoopBars();
    setLoopStatus(
      `Detected ${Math.round(state.loopBpm)} BPM · drag the selected region to reposition it.`,
      "active"
    );
  } catch (error) {
    if (version !== state.loopBpmDetectionVersion) return;
    console.warn("BPM detection failed", error);
    setLoopStatus(
      `BPM detection failed · enter BPM manually. ${error.message || ""}`.trim(),
      "error"
    );
  } finally {
    if (version === state.loopBpmDetectionVersion) {
      elements.detectLoopBpm.disabled = !state.loopReady;
    }
  }
}

export function initializeLoopSelection(audioBuffer) {
  state.loopBpmDetectionVersion += 1;
  state.loopBpm = loopDefaults.bpm;
  state.loopBars = loopDefaults.bars;
  state.loopSnap = loopDefaults.snap;
  const presetDuration = Math.max(
    0.05,
    Math.min(
      audioBuffer.duration,
      loopDefaults.end - loopDefaults.start || getLoopBarDuration() * state.loopBars
    )
  );
  state.loopStart = clamp(
    loopDefaults.start,
    0,
    Math.max(0, audioBuffer.duration - presetDuration)
  );
  state.loopEnd = Math.min(audioBuffer.duration, state.loopStart + presetDuration);
  const presetZoomStart = clamp(
    loopDefaults.zoomStart,
    0,
    Math.max(0, audioBuffer.duration - 0.05)
  );
  const presetZoomEnd = clamp(
    loopDefaults.zoomEnd,
    presetZoomStart + 0.05,
    audioBuffer.duration
  );
  state.loopZoomStart = presetZoomStart;
  state.loopZoomEnd = presetZoomEnd;
  state.loopReady = true;
  buildLoopWaveformPeaks();
  setLoopControlsEnabled(true);
  updateLoopSelectionUi();
  drawLoopWaveform();
  drawLoopMinimap();
  setLoopStatus(
    `Using ${Math.round(state.loopBpm)} BPM while automatic detection runs…`,
    "active"
  );
  void runLoopBpmDetection();
}

export function moveLoopSelectionTo(startTime) {
  const duration = state.decodedAudioBuffer?.duration || 0;
  const selectionDuration = Math.max(0.05, state.loopEnd - state.loopStart);
  let nextStart = startTime;
  const beatDuration = getLoopBeatDuration();
  if (state.loopSnap && beatDuration > 0) {
    nextStart = Math.round(nextStart / beatDuration) * beatDuration;
  }
  nextStart = clamp(nextStart, 0, Math.max(0, duration - selectionDuration));
  state.loopStart = nextStart;
  state.loopEnd = Math.min(duration, nextStart + selectionDuration);
  updateLoopSelectionUi();
}

export function beginLoopSelectionDrag(event) {
  if (!state.loopReady || event.button > 0) return;
  state.loopDragPointerId = event.pointerId;
  state.loopDragStartX = event.clientX;
  state.loopDragOriginalStart = state.loopStart;
  event.currentTarget.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

export function continueLoopSelectionDrag(event) {
  if (event.pointerId !== state.loopDragPointerId || !state.loopReady) return;
  const rect = elements.loopWaveWrap.getBoundingClientRect();
  const zoomRange = getLoopZoomRange();
  const deltaTime =
    ((event.clientX - state.loopDragStartX) / Math.max(1, rect.width)) *
    zoomRange.width;
  moveLoopSelectionTo(state.loopDragOriginalStart + deltaTime);
  event.preventDefault();
}

export function endLoopSelectionDrag(event) {
  if (event.pointerId !== state.loopDragPointerId) return;
  state.loopDragPointerId = null;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  setLoopStatus(
    `Loop ${formatPreciseTime(state.loopStart)}–${formatPreciseTime(state.loopEnd)} · ${Math.round(state.loopBpm)} BPM`,
    "active"
  );
}

export function enforceSelectedLoop() {
  if (!state.audioLoop || !hasPartialLoopSelection() || audio.paused || audio.ended) return;
  const range = getSelectedLoopRange();
  if (audio.currentTime < range.start - 0.03 || audio.currentTime >= range.end - 0.012) {
    const overflow = audio.currentTime >= range.end
      ? Math.max(0, audio.currentTime - range.end)
      : 0;
    audio.currentTime = clamp(range.start + overflow, range.start, Math.max(range.start, range.end - 0.001));
    resetSmoothPlaybackTo(audio.currentTime);
    updateHistory(true);
  }
}

export const galaxyLoopController = (() => {
  // ── BPM Detective popup — fully integrated with the main visualizer ──

  // ── Popup-local state ──
  let popupOpen      = false;
  let popupCtx       = null;
  let popupGain      = null;
  let popupBuffer    = null;
  let popupSource    = null;
  let popupIsPlaying = false;
  let popupLoopOn    = true;
  let popupVolume    = 80;
  let popupMuted     = false;
  let popupOffset    = 0;
  let popupCtxStart  = 0;
  let popupBpm       = 120;
  let popupLoopBars  = 4;
  let popupLoopStart = 0;
  let popupLoopEnd   = 4;
  let popupZoomStart = 0;
  let popupZoomEnd   = 1;
  let popupPeaks     = null;
  let popupAnimRaf   = null;
  let popupResizeObs = null;
  let popupForceRestartFromLoopStart = true;
  let popupDocMouseMoveHandler = null;
  let popupDocMouseUpHandler = null;
  let popupDocKeydownHandler = null;
  // Canvas dims
  let cW = 0, cH = 0, mmW = 0, mmH = 0;
  // Drag state
  let dragging = null, dragX0 = 0, dragVal0 = 0, dragMoved = false;
  let dragLoopDuration = 0, dragLoopStart0 = 0;
  let mmDrag = false, mmX0 = 0, mmZS0 = 0, mmZE0 = 0;

  // ── Entry point ──
  function openLoopPopup() {
      if (popupOpen || !state.hasAudio || !state.decodedAudioBuffer) return;
      popupOpen = true;
      popupIsPlaying = false;
      popupSource = null;
      popupVolume = clamp(state.volume, 0, 100);
      popupMuted = Boolean(state.muted);
      popupBpm = clamp(state.loopBpm || 120, 40, 300);
      popupLoopBars = Math.max(1, Math.round(state.loopBars || 4));

      if (audio) {
          try { audio.pause(); } catch (_) {}
      }
      const mainPlayBtn = document.getElementById('playPause');
      if (mainPlayBtn) {
          mainPlayBtn.textContent = '▶ Play';
      }

      const overlay = document.createElement('div');
      overlay.id = 'loop-modal-overlay';
      overlay.tabIndex = -1;
      overlay.innerHTML = buildPopupHTML();
      document.body.appendChild(overlay);
      overlay.focus();

      // Wire up all popup events
      wirePopupEvents(overlay);
      const popupQuery = id => overlay.querySelector("#" + id);
      popupQuery("popup-vol-slider").value = String(popupVolume);
      popupQuery("popup-vol-pct").textContent = `${popupVolume}%`;
      refreshVolSlider(popupQuery);
      updateVolIcon(popupQuery);
      popupQuery("popup-bars-val").value = String(popupLoopBars);

      // Load and decode audio from state
      initPopupAudio(state.decodedAudioBuffer);
  }

  // ── HTML builder ──
  function buildPopupHTML() {
      return `
  <div class="loop-modal-panel" id="loop-panel">
    <div class="loop-header">
      <div class="loop-title">Loop Region</div>
      <button class="loop-close-btn" id="popup-close-btn" title="Close">✕</button>
    </div>

    <div class="loop-wave-section">
      <div class="loop-wave-header">
        <span class="loop-section-label">Waveform · Loop Region</span>
        <div class="loop-zoom-controls">
          <button class="loop-zoom-btn" id="popup-zoom-out">−</button>
          <span class="loop-zoom-level" id="popup-zoom-level">1×</span>
          <button class="loop-zoom-btn" id="popup-zoom-in">+</button>
          <button class="loop-zoom-btn loop-fit-btn" id="popup-zoom-fit">FIT</button>
        </div>
      </div>

      <div class="loop-waveform-wrap" id="popup-wave-wrap">
        <div class="loop-wave-clip">
          <canvas id="popup-wave-canvas"></canvas>
          <div id="popup-playhead"></div>
        </div>
        <div class="popup-lhandle" id="popup-h-left" style="left:0%">
          <div class="popup-handle-tag" id="popup-tag-left">0.00s</div>
          <div class="popup-handle-knob"></div>
        </div>
        <div class="popup-lhandle" id="popup-h-right" style="left:50%">
          <div class="popup-handle-tag" id="popup-tag-right">4.00s</div>
          <div class="popup-handle-knob"></div>
        </div>
        <div class="loop-analyzing" id="popup-analyzing">
          <div class="loop-dots"><span></span><span></span><span></span></div>
          <div class="loop-analyzing-text">Analysing audio…</div>
        </div>
      </div>

      <div class="loop-minimap-wrap" id="popup-minimap-wrap">
        <canvas id="popup-minimap-canvas"></canvas>
      </div>

      <div class="loop-progress-wrap" id="popup-progress-wrap">
        <div class="loop-progress-fill" id="popup-progress-fill"></div>
      </div>
      <div class="loop-time-row">
        <span class="loop-time-mono" id="popup-t-current">0:00.000</span>
        <span class="loop-time-mono" id="popup-t-total">0:00.000</span>
      </div>
    </div>

    <div class="loop-controls-section">
      <div class="loop-ctrl-block">
        <div class="loop-transport-row">
          <button class="loop-tbtn" id="popup-play-btn" disabled>▶ Play</button>
          <button class="loop-tbtn" id="popup-stop-btn" disabled>■ Stop</button>
          <div class="loop-pill">
            <div class="loop-pill-switch on" id="popup-loop-switch"></div>
            <span class="loop-pill-label">Loop</span>
          </div>
        </div>
        <div class="loop-option-row">
          <label class="loop-check-label">
            <input type="checkbox" id="popup-force-start-toggle" class="loop-check-input" checked>
            <span class="loop-check-box"></span>
            <span class="loop-check-text">Always start preview from loop start</span>
          </label>
        </div>
        <div class="loop-volume-row">
          <button class="loop-vol-btn" id="popup-mute-btn">🔊</button>
          <input class="loop-vol-slider" id="popup-vol-slider" type="range" min="0" max="100" value="80">
          <span class="loop-vol-pct" id="popup-vol-pct">80%</span>
        </div>
      </div>

      <div class="loop-ctrl-block loop-bpm-block">
        <div class="loop-section-label">Detected Tempo</div>
        <div class="loop-bpm-row">
          <input class="loop-bpm-input" id="popup-bpm-input" type="number" min="40" max="300" placeholder="—" disabled>
          <span class="loop-bpm-unit">BPM</span>
        </div>
        <div class="loop-bpm-hint">Click to edit · Enter to confirm</div>
      </div>

      <div class="loop-ctrl-block loop-bars-block">
        <div class="loop-section-label">Loop Length</div>
        <div class="loop-bars-row">
          <div class="value-editor has-suffix loop-bars-editor">
            <input class="value-input loop-bars-val" id="popup-bars-val" type="number" min="1" max="999" value="4" aria-label="Loop Length in Bars Value">
            <span class="value-suffix loop-bars-unit" aria-hidden="true">Bars</span>
            <button class="value-stepper loop-bars-stepper" id="popup-bars-decr" type="button" aria-label="Decrease Loop Length">−</button>
            <button class="value-stepper loop-bars-stepper" id="popup-bars-incr" type="button" aria-label="Increase Loop Length">+</button>
          </div>
        </div>
        <div class="loop-time-info" id="popup-loop-time-info">—</div>
      </div>
    </div>

    <div class="loop-status-bar">
      <span class="loop-stat">Rate: <b id="popup-stat-rate">—</b></span>
      <span class="loop-stat">Duration: <b id="popup-stat-dur">—</b></span>
      <span class="loop-stat">Loop: <b id="popup-stat-loop">—</b></span>
      <span class="loop-stat">Beat: <b id="popup-stat-beat">—</b></span>
    </div>

    <div class="loop-action-row">
      <button class="loop-action-btn loop-cancel-btn" id="popup-cancel-btn">Cancel</button>
      <button class="loop-action-btn loop-clear-btn" id="popup-clear-btn">Clear Loop</button>
      <button class="loop-action-btn loop-apply-btn" id="popup-apply-btn" disabled>Apply Loop</button>
    </div>
  </div>`;
  }

  // ── Wire all popup events ──
  function wirePopupEvents(overlay) {
      const $ = id => overlay.querySelector('#' + id);

      // Close
      $('popup-close-btn').addEventListener('click', closePopup);
      $('popup-cancel-btn').addEventListener('click', closePopup);

      // Clear loop
      $('popup-clear-btn').addEventListener('click', () => {
          clearAudioLoop();
          closePopup();
      });

      // Apply loop
      $('popup-apply-btn').addEventListener('click', () => {
          applyAudioLoop(popupLoopStart, popupLoopEnd);
          state.loopBpm = popupBpm;
          const btn = document.getElementById('loopButton');
          if (btn) {
              btn.textContent = 'Loop';
              btn.classList.add('loop-active');
          }
          closePopup();
      });

      // Transport
      $('popup-play-btn').addEventListener('click', () => popupIsPlaying ? popupPause() : popupPlay($));
      $('popup-stop-btn').addEventListener('click', () => popupStop($));
      $('popup-loop-switch').addEventListener('click', () => {
          popupLoopOn = !popupLoopOn;
          $('popup-loop-switch').classList.toggle('on', popupLoopOn);
          if (popupSource && popupIsPlaying) { popupSource.loop = popupLoopOn; if (popupLoopOn) { popupSource.loopStart = popupLoopStart; popupSource.loopEnd = popupLoopEnd; } }
      });
      $('popup-force-start-toggle').checked = popupForceRestartFromLoopStart;
      $('popup-force-start-toggle').addEventListener('change', () => {
          popupForceRestartFromLoopStart = $('popup-force-start-toggle').checked;
      });

      // Volume
      $('popup-vol-slider').addEventListener('input', () => {
          popupVolume = +$('popup-vol-slider').value;
          $('popup-vol-pct').textContent = popupVolume + '%';
          if (!popupMuted && popupGain) popupGain.gain.value = popupMuted ? 0 : popupVolume / 100;
          refreshVolSlider($);
      });
      $('popup-mute-btn').addEventListener('click', () => {
          popupMuted = !popupMuted;
          if (popupGain) popupGain.gain.value = popupMuted ? 0 : popupVolume / 100;
          updateVolIcon($);
      });

      // BPM
      $('popup-bpm-input').addEventListener('blur', () => commitBPM($));
      $('popup-bpm-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('popup-bpm-input').blur(); });

      // Bars
      $('popup-bars-val').addEventListener('blur', () => commitBars($));
      $('popup-bars-val').addEventListener('keydown', e => { if (e.key === 'Enter') $('popup-bars-val').blur(); });
      $('popup-bars-decr').addEventListener('click', () => {
          popupLoopBars = Math.max(1, popupLoopBars - 1);
          $('popup-bars-val').value = popupLoopBars;
          applyLoopChange($);
      });
      $('popup-bars-incr').addEventListener('click', () => {
          const maxBars = getMaxLoopBars();
          popupLoopBars = Math.min(maxBars, popupLoopBars + 1);
          $('popup-bars-val').value = popupLoopBars;
          applyLoopChange($);
      });

      // Zoom
      $('popup-zoom-in').addEventListener('click',  () => zoomAtX(cW / 2, 2, $));
      $('popup-zoom-out').addEventListener('click', () => zoomAtX(cW / 2, 0.5, $));
      $('popup-zoom-fit').addEventListener('click', () => { if (popupBuffer) setZoomWindow(0, popupBuffer.duration, $); });

      // Wave click to seek
      $('popup-wave-wrap').addEventListener('click', e => {
          if (dragMoved) { dragMoved = false; return; }
          if (!popupBuffer) return;
          const rect = $('popup-wave-wrap').getBoundingClientRect();
          seekTo(xToTime(e.clientX - rect.left), $);
      });

      // Wheel zoom
      $('popup-wave-wrap').addEventListener('wheel', e => {
          if (!popupBuffer) return;
          e.preventDefault();
          const rect = $('popup-wave-wrap').getBoundingClientRect();
          zoomAtX(e.clientX - rect.left, e.deltaY < 0 ? 1.6 : 0.625, $);
      }, { passive: false });

      // Progress click
      $('popup-progress-wrap').addEventListener('click', e => {
          if (!popupBuffer) return;
          const r = $('popup-progress-wrap').getBoundingClientRect();
          seekTo(((e.clientX - r.left) / r.width) * popupBuffer.duration, $);
      });

      // Handle drag — left
      $('popup-h-left').addEventListener('mousedown', e => { startHandleDrag('left', e, $); });
      $('popup-h-right').addEventListener('mousedown', e => { startHandleDrag('right', e, $); });
      $('popup-h-left').addEventListener('click', e => e.stopPropagation());
      $('popup-h-right').addEventListener('click', e => e.stopPropagation());

      // Minimap drag
      $('popup-minimap-wrap').addEventListener('mousedown', e => {
          if (!popupBuffer) return;
          const rect = $('popup-minimap-wrap').getBoundingClientRect();
          const x = e.clientX - rect.left;
          const vL = (popupZoomStart / popupBuffer.duration) * mmW;
          const vR = (popupZoomEnd   / popupBuffer.duration) * mmW;
          if (x < vL - 8 || x > vR + 8) {
              const ct = (x / mmW) * popupBuffer.duration, hw = (popupZoomEnd - popupZoomStart) / 2;
              setZoomWindow(ct - hw, ct + hw, $);
          }
          mmDrag = true; mmX0 = e.clientX; mmZS0 = popupZoomStart; mmZE0 = popupZoomEnd;
          e.preventDefault();
      });

      // Global handlers while popup is open
      popupDocMouseMoveHandler = e => onMouseMove(e, $);
      popupDocMouseUpHandler = () => onMouseUp($);
      document.addEventListener('mousemove', popupDocMouseMoveHandler);
      document.addEventListener('mouseup', popupDocMouseUpHandler);

      popupDocKeydownHandler = e => {
          if (!popupOpen) return;
          const active = document.activeElement;
          const editingInput = active && (active.id === 'popup-bpm-input' || active.id === 'popup-bars-val');
          if (editingInput && e.key !== 'Escape') return;

          if (e.key === ' ' || e.code === 'Space') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              popupIsPlaying ? popupPause() : popupPlay($);
              return;
          }
          if (e.key === '+' || e.key === '=') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              zoomAtX(cW / 2, 2, $);
              return;
          }
          if (e.key === '-') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              zoomAtX(cW / 2, 0.5, $);
              return;
          }
          if (e.key === '0' && popupBuffer) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              setZoomWindow(0, popupBuffer.duration, $);
              return;
          }
          if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              closePopup();
          }
      };
      document.addEventListener('keydown', popupDocKeydownHandler, true);

      // Canvas resize observer
      popupResizeObs = new ResizeObserver(() => resizeCanvases($));
      popupResizeObs.observe(overlay.querySelector('#loop-panel'));
      setTimeout(() => resizeCanvases($), 60);
  }

  // ── Canvas resize ──
  function resizeCanvases($) {
      const wWrap = $('popup-wave-wrap');
      const mmWrap = $('popup-minimap-wrap');
      if (!wWrap || !mmWrap) return;
      const dpr = window.devicePixelRatio || 1;
      const wr = wWrap.getBoundingClientRect();
      const mr = mmWrap.getBoundingClientRect();
      cW = wr.width; cH = wr.height;
      const wc = $('popup-wave-canvas');
      wc.width = cW * dpr; wc.height = cH * dpr;
      wc.style.width = cW + 'px'; wc.style.height = cH + 'px';
      const wCtx = wc.getContext('2d'); wCtx.scale(dpr, dpr);
      mmW = mr.width; mmH = mr.height;
      const mc = $('popup-minimap-canvas');
      mc.width = mmW * dpr; mc.height = mmH * dpr;
      mc.style.width = mmW + 'px'; mc.style.height = mmH + 'px';
      const mCtx = mc.getContext('2d'); mCtx.scale(dpr, dpr);
      if (popupBuffer) buildPeaks();
      updateHandles($);
      renderWaveform($); renderMinimap($);
  }

  // ── Init audio ──
  async function initPopupAudio(buffer) {
      const overlay = document.getElementById('loop-modal-overlay');
      if (!overlay) return;
      const $ = id => overlay.querySelector('#' + id);
      $('popup-analyzing').classList.add('show');

      try {
          popupCtx = new (window.AudioContext || window.webkitAudioContext)();
          popupGain = popupCtx.createGain();
          popupGain.gain.value = popupVolume / 100;
          popupGain.connect(popupCtx.destination);

          popupBuffer = buffer;

          $('popup-stat-rate').textContent = popupBuffer.sampleRate + ' Hz';
          $('popup-stat-dur').textContent  = fmtDur(popupBuffer.duration);
          $('popup-t-total').textContent   = fmtTime(popupBuffer.duration);

          // BPM detection
          popupBpm = await getLoopBpmDetection(popupBuffer);
          $('popup-bpm-input').value = popupBpm;
          $('popup-bpm-input').disabled = false;
          $('popup-stat-beat').textContent = (60 / popupBpm).toFixed(3) + 's';

          // If existing loop in state, use it
          if (state.audioLoop && state.loopEnd > state.loopStart) {
              popupLoopStart = state.loopStart;
              popupLoopEnd   = state.loopEnd;
              if (state.loopBpm > 0) {
                  popupBpm = state.loopBpm;
                  $('popup-bpm-input').value = popupBpm;
                  const bd = (60 / popupBpm) * 4;
                  popupLoopBars = Math.max(1, Math.round((popupLoopEnd - popupLoopStart) / bd));
                  $('popup-bars-val').value = popupLoopBars;
              }
          } else {
              popupLoopStart = 0;
              updateLoopEnd($);
          }

          popupZoomStart = 0;
          popupZoomEnd   = popupBuffer.duration;
          updateZoomDisplay($);

          buildPeaks();
          renderWaveform($); renderMinimap($);
          syncBarsLimit($);
          updateHandles($); updateLoopInfo($);

          $('popup-play-btn').disabled = false;
          $('popup-stop-btn').disabled = false;
          $('popup-apply-btn').disabled = false;
          popupOffset = popupLoopStart;

      } catch (err) {
          console.error('Popup audio init error:', err);
          $('popup-analyzing').querySelector('.loop-analyzing-text').textContent = 'Error decoding audio.';
          return;
      }
      $('popup-analyzing').classList.remove('show');
  }

  // ── Peaks ──
  function buildPeaks() {
      if (!popupBuffer || cW < 1) return;
      const N = Math.ceil(cW * 4);
      popupPeaks = new Float32Array(N);
      const ch = popupBuffer.getChannelData(0);
      const blk = Math.floor(popupBuffer.length / N);
      for (let i = 0; i < N; i++) {
          let pk = 0, off = i * blk;
          for (let j = 0; j < blk; j++) { const a = Math.abs(ch[off + j] || 0); if (a > pk) pk = a; }
          popupPeaks[i] = pk;
      }
  }

  // ── Coordinates ──
  const timeToX = t => (popupZoomEnd > popupZoomStart) ? ((t - popupZoomStart) / (popupZoomEnd - popupZoomStart)) * cW : 0;
  const xToTime = x => (popupZoomEnd > popupZoomStart) ? popupZoomStart + (x / cW) * (popupZoomEnd - popupZoomStart) : 0;

  // ── Waveform render ──
  function renderWaveform($) {
      const wc = document.getElementById('popup-wave-canvas');
      if (!wc) return;
      const ctx = wc.getContext('2d');
      ctx.clearRect(0, 0, cW, cH);
      ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, cW, cH);
      ctx.strokeStyle = 'rgba(255,255,255,0.055)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cH / 2); ctx.lineTo(cW, cH / 2); ctx.stroke();

      if (!popupPeaks || !popupBuffer) {
          ctx.fillStyle = 'rgba(140,140,140,0.80)'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
          ctx.fillText('Loading…', cW / 2, cH / 2 + 4); return;
      }

      const lsX = timeToX(popupLoopStart), leX = timeToX(popupLoopEnd);
      ctx.fillStyle = 'rgba(255,42,26,0.09)'; ctx.fillRect(lsX, 0, leX - lsX, cH);

      // Beat grid
      if (popupBpm > 0) {
          const bd = 60 / popupBpm;
          let first = Math.floor(popupZoomStart / bd) * bd, bi = Math.round(first / bd);
          for (let t = first; t < popupZoomEnd; t += bd, bi++) {
              const x = timeToX(t), isBar = (bi % 4 === 0);
              ctx.strokeStyle = isBar ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)';
              ctx.lineWidth = isBar ? 0.8 : 0.5;
              ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cH); ctx.stroke();
              if (isBar) {
                  ctx.fillStyle = 'rgba(140,140,140,0.70)'; ctx.font = '8px monospace'; ctx.textAlign = 'left';
                  ctx.fillText(Math.round(t / (bd * 4)) + 1, x + 2, 10);
              }
          }
      }

      // Waveform
      const N = popupPeaks.length, dur = popupBuffer.duration;
      const p0 = Math.floor((popupZoomStart / dur) * N), p1 = Math.ceil((popupZoomEnd / dur) * N);
      const sl = p1 - p0;
      for (let i = 0; i < cW; i++) {
          const pi = p0 + Math.round((i / cW) * sl);
          const pk = popupPeaks[Math.min(pi, N - 1)] || 0;
          const h = pk * cH * 0.88, y = (cH - h) / 2;
          const t = xToTime(i), inL = (t >= popupLoopStart && t <= popupLoopEnd);
          ctx.fillStyle = inL
              ? `rgba(255,${Math.round(82 + pk * 80)},${Math.round(58 + pk * 48)},${0.62 + pk * 0.34})`
              : `rgba(120,120,120,${0.22 + pk * 0.45})`;
          ctx.fillRect(i, y, 1, Math.max(0.5, h));
      }

      // Loop boundary lines
      ctx.strokeStyle = 'rgba(255,42,26,0.92)'; ctx.lineWidth = 1;
      [lsX, leX].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cH); ctx.stroke(); });
  }

  // ── Minimap render ──
  function renderMinimap($) {
      const mc = document.getElementById('popup-minimap-canvas');
      if (!mc) return;
      const ctx = mc.getContext('2d');
      ctx.clearRect(0, 0, mmW, mmH);
      ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, mmW, mmH);
      if (!popupPeaks || !popupBuffer) return;

      const N = popupPeaks.length, dur = popupBuffer.duration;
      for (let i = 0; i < mmW; i++) {
          const pi = Math.round((i / mmW) * N);
          const pk = popupPeaks[Math.min(pi, N - 1)] || 0;
          const h = pk * mmH * 0.85, y = (mmH - h) / 2;
          const t = (i / mmW) * dur, inL = (t >= popupLoopStart && t <= popupLoopEnd);
          ctx.fillStyle = inL ? `rgba(255,42,26,${0.35 + pk * 0.5})` : `rgba(130,130,130,${0.18 + pk * 0.42})`;
          ctx.fillRect(i, y, 1, Math.max(0.5, h));
      }

      const vL = (popupZoomStart / dur) * mmW, vR = (popupZoomEnd / dur) * mmW;
      ctx.fillStyle = 'rgba(255,255,255,0.045)'; ctx.fillRect(vL, 0, vR - vL, mmH);
      ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 1;
      ctx.strokeRect(vL + 0.5, 0.5, Math.max(1, vR - vL - 1), mmH - 1);

      if (popupOffset > 0) {
          const px = (popupOffset / dur) * mmW;
          ctx.strokeStyle = 'rgba(255,255,255,0.68)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, mmH); ctx.stroke();
      }
  }

  // ── Zoom ──
  function updateZoomDisplay($) {
      if (!popupBuffer) { $('popup-zoom-level').textContent = '1×'; return; }
      const z = popupBuffer.duration / (popupZoomEnd - popupZoomStart);
      $('popup-zoom-level').textContent = (z < 10 ? z.toFixed(1) : z.toFixed(0)) + '×';
  }

  function setZoomWindow(s, e, $) {
      if (!popupBuffer) return;
      const dur = popupBuffer.duration, minW = dur / 64;
      let sz = Math.max(minW, e - s);
      let ns = Math.max(0, s), ne = Math.min(dur, ns + sz);
      if (ne >= dur) { ne = dur; ns = Math.max(0, ne - sz); }
      popupZoomStart = ns; popupZoomEnd = ne;
      updateZoomDisplay($); updateHandles($); renderWaveform($); renderMinimap($);
  }

  function zoomAtX(canvasX, factor, $) {
      if (!popupBuffer) return;
      const anchor = xToTime(canvasX);
      const newW = Math.max(popupBuffer.duration / 64, Math.min(popupBuffer.duration, (popupZoomEnd - popupZoomStart) / factor));
      const rel = (anchor - popupZoomStart) / (popupZoomEnd - popupZoomStart);
      setZoomWindow(anchor - rel * newW, anchor - rel * newW + newW, $);
  }

  // ── Handles ──
  function updateHandles($) {
      if (!popupBuffer) return;
      $('popup-h-left').style.left  = (timeToX(popupLoopStart) / cW * 100).toFixed(3) + '%';
      $('popup-h-right').style.left = (timeToX(popupLoopEnd)   / cW * 100).toFixed(3) + '%';
      $('popup-tag-left').textContent  = fmtTime(popupLoopStart);
      $('popup-tag-right').textContent = fmtTime(popupLoopEnd);
  }

  function startHandleDrag(side, e, $) {
      dragging = side; dragMoved = false;
      dragX0 = (e.touches ? e.touches[0] : e).clientX;
      dragVal0 = popupLoopStart;
      dragLoopStart0 = popupLoopStart;
      dragLoopDuration = Math.max(0, popupLoopEnd - popupLoopStart);
      e.preventDefault(); e.stopPropagation();
  }

  function onMouseMove(e, $) {
      if (mmDrag && popupBuffer) {
          const dx = e.clientX - mmX0, dur = popupBuffer.duration;
          const dt = (dx / mmW) * dur;
          let ns = mmZS0 + dt, ne = mmZE0 + dt;
          if (ns < 0) { ne -= ns; ns = 0; }
          if (ne > dur) { ns -= (ne - dur); ne = dur; } ns = Math.max(0, ns);
          popupZoomStart = ns; popupZoomEnd = ne;
          updateZoomDisplay($); updateHandles($); renderWaveform($); renderMinimap($);
          return;
      }
      if (!dragging || !popupBuffer) return;
      dragMoved = true;
      const cx = (e.touches ? e.touches[0] : e).clientX;
      const wWrap = document.getElementById('popup-wave-wrap');
      if (!wWrap) return;
      const rect = wWrap.getBoundingClientRect();
      const dt = ((cx - dragX0) / rect.width) * (popupZoomEnd - popupZoomStart);
      const beat = popupBpm > 0 ? 60 / popupBpm : 0;
      const loopDuration = Math.max(0, dragLoopDuration || (popupLoopEnd - popupLoopStart));
      let ns = dragLoopStart0 + dt;
      if (beat > 0) ns = Math.round(ns / beat) * beat;
      const maxStart = Math.max(0, popupBuffer.duration - loopDuration);
      ns = Math.max(0, Math.min(ns, maxStart));
      popupLoopStart = ns;
      popupLoopEnd = Math.min(popupBuffer.duration, popupLoopStart + loopDuration);
      updateHandles($); renderWaveform($); renderMinimap($); updateLoopInfo($);
      if (popupIsPlaying && popupSource && popupLoopOn) {
          popupSource.loopStart = popupLoopStart; popupSource.loopEnd = popupLoopEnd;
      }
  }

  function onMouseUp($) {
      if (dragging) {
          if (dragMoved && popupIsPlaying) { popupPause(); popupPlay($); }
          dragging = null;
      } else { dragMoved = false; }
      mmDrag = false;
  }

  // ── Loop info ──
  function updateLoopInfo($) {
      if (!popupBuffer) return;
      $('popup-loop-time-info').textContent = `${popupLoopStart.toFixed(2)}s → ${popupLoopEnd.toFixed(2)}s · ${(popupLoopEnd - popupLoopStart).toFixed(3)}s`;
      $('popup-stat-loop').textContent = `${popupLoopStart.toFixed(2)}s – ${popupLoopEnd.toFixed(2)}s`;
  }

  function getLoopBarDuration() {
      return popupBpm > 0 ? (60 / popupBpm) * 4 : 0;
  }

  function getMaxLoopBars() {
      if (!popupBuffer) return 999;
      const barDur = getLoopBarDuration();
      if (barDur <= 0) return 999;
      return Math.max(1, Math.floor(((popupBuffer.duration - popupLoopStart) / barDur) + 1e-6));
  }

  function syncBarsLimit($) {
      const maxBars = getMaxLoopBars();
      const barsInput = $('popup-bars-val');
      popupLoopBars = Math.max(1, Math.min(popupLoopBars, maxBars));
      if (barsInput) {
          barsInput.max = String(maxBars);
          barsInput.value = popupLoopBars;
      }
      const decrBtn = $('popup-bars-decr');
      const incrBtn = $('popup-bars-incr');
      if (decrBtn) decrBtn.disabled = popupLoopBars <= 1;
      if (incrBtn) incrBtn.disabled = popupLoopBars >= maxBars;
      return maxBars;
  }

  function updateLoopEnd($) {
      if (!popupBuffer || popupBpm <= 0) return;
      syncBarsLimit($);
      const desiredDuration = Math.min(getLoopBarDuration() * popupLoopBars, popupBuffer.duration);
      if (popupLoopStart + desiredDuration > popupBuffer.duration) {
          popupLoopStart = Math.max(0, popupBuffer.duration - desiredDuration);
      }
      popupLoopEnd = Math.min(popupLoopStart + desiredDuration, popupBuffer.duration);
  }

  function applyLoopChange($) {
      updateLoopEnd($);
      syncBarsLimit($);
      updateHandles($); renderWaveform($); renderMinimap($); updateLoopInfo($);
      if (popupIsPlaying) { popupPause(); popupPlay($); }
  }

  function commitBPM($) {
      const v = +$('popup-bpm-input').value;
      if (v >= 40 && v <= 300) {
          popupBpm = v;
          $('popup-stat-beat').textContent = (60 / popupBpm).toFixed(3) + 's';
          applyLoopChange($);
      } else { $('popup-bpm-input').value = popupBpm; }
  }

  function commitBars($) {
      const maxBars = getMaxLoopBars();
      const v = parseInt($('popup-bars-val').value);
      if (!Number.isNaN(v) && v >= 1) {
          popupLoopBars = Math.min(maxBars, v);
          applyLoopChange($);
      } else {
          $('popup-bars-val').value = popupLoopBars;
      }
  }

  // ── Playback ──
  function popupPlay($) {
      if (!popupBuffer || !popupCtx) return;
      if (popupCtx.state === 'suspended') popupCtx.resume();
      if (popupForceRestartFromLoopStart) popupOffset = popupLoopStart;
      if (popupLoopOn && (popupOffset < popupLoopStart || popupOffset >= popupLoopEnd)) popupOffset = popupLoopStart;
      popupSource = popupCtx.createBufferSource();
      popupSource.buffer = popupBuffer;
      popupSource.connect(popupGain);
      if (popupLoopOn) { popupSource.loop = true; popupSource.loopStart = popupLoopStart; popupSource.loopEnd = popupLoopEnd; }
      popupSource.start(0, popupOffset);
      popupCtxStart = popupCtx.currentTime - popupOffset;
      popupIsPlaying = true;
      $('popup-play-btn').innerHTML = '⏸ Pause'; $('popup-play-btn').classList.add('playing');
      document.getElementById('popup-playhead').style.display = 'block';
      popupSource.onended = () => {
          if (!popupLoopOn && popupIsPlaying) {
              popupIsPlaying = false;
              $('popup-play-btn').innerHTML = '▶ Play'; $('popup-play-btn').classList.remove('playing');
          }
      };
      if (popupAnimRaf) cancelAnimationFrame(popupAnimRaf);
      popupAnimRaf = requestAnimationFrame(ts => animLoop(ts, $));
  }

  function popupPause() {
      if (!popupIsPlaying) return;
      popupOffset = getLiveTime();
      if (popupSource) { popupSource.onended = null; try { popupSource.stop(); } catch (_) {} popupSource = null; }
      popupIsPlaying = false;
      const el = document.getElementById('popup-play-btn');
      if (el) { el.innerHTML = '▶ Play'; el.classList.remove('playing'); }
      if (popupAnimRaf) { cancelAnimationFrame(popupAnimRaf); popupAnimRaf = null; }
  }

  function popupStop($) {
      if (popupSource) { popupSource.onended = null; try { popupSource.stop(); } catch (_) {} popupSource = null; }
      popupIsPlaying = false;
      $('popup-play-btn').innerHTML = '▶ Play'; $('popup-play-btn').classList.remove('playing');
      if (popupAnimRaf) { cancelAnimationFrame(popupAnimRaf); popupAnimRaf = null; }
      popupOffset = popupLoopOn ? popupLoopStart : 0;
      updatePlayheadUI($, popupOffset); renderMinimap($);
      document.getElementById('popup-playhead').style.display = 'none';
  }

  function seekTo(t, $) {
      const was = popupIsPlaying; if (was) popupPause();
      popupOffset = Math.max(0, Math.min(t, popupBuffer ? popupBuffer.duration : 0));
      updatePlayheadUI($, popupOffset); renderMinimap($);
      if (was) popupPlay($);
  }

  function getLiveTime() {
      if (!popupIsPlaying || !popupCtx || !popupBuffer) return popupOffset;
      const el = popupCtx.currentTime - popupCtxStart;
      if (popupLoopOn) { const ld = popupLoopEnd - popupLoopStart; if (ld > 0) return popupLoopStart + ((el - popupLoopStart) % ld + ld) % ld; }
      return Math.min(el, popupBuffer.duration);
  }

  function updatePlayheadUI($, t) {
      if (!popupBuffer) return;
      const pct = t / popupBuffer.duration;
      document.getElementById('popup-progress-fill').style.width = (pct * 100) + '%';
      document.getElementById('popup-t-current').textContent = fmtTime(t);
      const px = timeToX(t);
      const ph = document.getElementById('popup-playhead');
      ph.style.left = px + 'px';
      ph.style.display = (px >= 0 && px <= cW) ? 'block' : 'none';
  }

  let lastMmTs = 0;
  function animLoop(ts, $) {
      if (!popupIsPlaying) return;
      const t = getLiveTime(); updatePlayheadUI($, t);
      if (ts - lastMmTs > 66) { renderMinimap($); lastMmTs = ts; }
      popupAnimRaf = requestAnimationFrame(ts2 => animLoop(ts2, $));
  }

  // ── Volume helpers ──
  function refreshVolSlider($) {
      const s = $('popup-vol-slider');
      s.style.background = `linear-gradient(90deg,rgba(255,42,26,0.92) ${popupVolume}%,rgba(255,255,255,0.12) ${popupVolume}%)`;
  }
  function updateVolIcon($) {
      const btn = $('popup-mute-btn');
      btn.textContent = popupMuted || popupVolume === 0 ? '🔇' : popupVolume < 40 ? '🔈' : popupVolume < 75 ? '🔉' : '🔊';
  }

  // ── Close popup ──
  function closePopup() {
      if (popupAnimRaf) { cancelAnimationFrame(popupAnimRaf); popupAnimRaf = null; }
      if (popupSource)  { try { popupSource.stop(); } catch (_) {} popupSource = null; }
      if (popupCtx)     { try { popupCtx.close(); }  catch (_) {} popupCtx = null; }
      if (popupResizeObs) { popupResizeObs.disconnect(); popupResizeObs = null; }
      if (popupDocMouseMoveHandler) { document.removeEventListener('mousemove', popupDocMouseMoveHandler); popupDocMouseMoveHandler = null; }
      if (popupDocMouseUpHandler) { document.removeEventListener('mouseup', popupDocMouseUpHandler); popupDocMouseUpHandler = null; }
      if (popupDocKeydownHandler) { document.removeEventListener('keydown', popupDocKeydownHandler, true); popupDocKeydownHandler = null; }
      const overlay = document.getElementById('loop-modal-overlay');
      if (overlay) overlay.remove();
      popupOpen = false; popupIsPlaying = false; popupBuffer = null; popupPeaks = null;
      document.getElementById("loopButton")?.focus();
  }

  // ── Formatters ──
  const fmtTime = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, '0')}`;
  const fmtDur  = s => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;


  // Host application bridge: apply/clear the popup selection on the main audio
  // element and update the same state used by playback and video export.
  function updateMainLoopButton() {
      const button = document.getElementById('loopButton');
      if (!button) return;
      button.disabled = !state.hasAudio || !state.decodedAudioBuffer;
      const active = Boolean(
          state.audioLoop &&
          state.loopEnd > state.loopStart &&
          state.decodedAudioBuffer &&
          state.loopEnd - state.loopStart < state.decodedAudioBuffer.duration - 1e-4
      );
      button.classList.toggle('loop-active', active);
      button.textContent = 'Loop';
      button.setAttribute('aria-pressed', String(active));
  }

  function applyAudioLoop(start, end) {
      const duration = state.decodedAudioBuffer?.duration || audio.duration || 0;
      if (!(duration > 0)) return;
      state.loopStart = clamp(Number(start) || 0, 0, duration);
      state.loopEnd = clamp(Number(end) || duration, state.loopStart, duration);
      state.loopBpm = clamp(Number(popupBpm) || state.loopBpm || 120, 40, 300);
      state.loopBars = Math.max(1, Math.round(Number(popupLoopBars) || 1));
      state.loopSnap = true;
      state.audioLoop = state.loopEnd > state.loopStart;
      elements.audioLoop.checked = state.audioLoop;
      updateAudioLoopMode();
      updateLoopSelectionUi();
      drawLoopWaveform();
      drawLoopMinimap();
      if (
          state.audioLoop &&
          (audio.currentTime < state.loopStart || audio.currentTime >= state.loopEnd)
      ) {
          audio.currentTime = state.loopStart;
          resetSmoothPlaybackTo(state.loopStart);
          updateHistory(true);
      }
      updateMainLoopButton();
      markRenderDirty();
  }

  function clearAudioLoop() {
      const duration = state.decodedAudioBuffer?.duration || audio.duration || 0;
      state.audioLoop = false;
      state.loopStart = 0;
      state.loopEnd = duration;
      elements.audioLoop.checked = false;
      updateAudioLoopMode();
      updateLoopSelectionUi();
      drawLoopWaveform();
      drawLoopMinimap();
      updateMainLoopButton();
      markRenderDirty();
  }
  return { open: openLoopPopup, close: closePopup, syncButton: updateMainLoopButton };
})();

export const endLoopMinimapDrag = (event) => {
  if (event.pointerId !== state.loopMinimapDragPointerId) return;
  state.loopMinimapDragPointerId = null;
  elements.loopMinimapWindow.classList.remove("is-dragging");
  if (elements.loopMinimapWindow.hasPointerCapture(event.pointerId)) {
    elements.loopMinimapWindow.releasePointerCapture(event.pointerId);
  }
};
