// playback.js — generated module split of app.js (behavior unchanged)
import { audio, state } from "./core.js";
import { galaxyLoopController, getSelectedLoopRange, hasPartialLoopSelection, resetSmoothPlaybackTo } from "./loop.js";
import { clamp, setStatus } from "./utils.js";

export async function ensureAudioGraph() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported by this browser.");
    }
    state.audioContext = new AudioContextClass({ latencyHint: "interactive" });
  }

  if (!state.mediaSourceNode) {
    state.mediaSourceNode =
      state.audioContext.createMediaElementSource(audio);
    state.audioAnalyserNode = state.audioContext.createAnalyser();
    state.audioAnalyserNode.fftSize = 2048;
    state.audioAnalyserNode.smoothingTimeConstant = 0;
    state.mediaSourceNode.connect(state.audioAnalyserNode);
    state.audioAnalyserNode.connect(state.audioContext.destination);
  }

  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }

  return state.audioContext;
}

function getMeasuredAudioOutputLatency() {
  const context = state.audioContext;
  if (!context || context.state !== "running") return 0;

  const outputLatency = Number(context.outputLatency);
  const baseLatency = Number(context.baseLatency);
  const measuredLatency = Math.max(
    Number.isFinite(outputLatency) ? outputLatency : 0,
    Number.isFinite(baseLatency) ? baseLatency : 0
  );

  return clamp(measuredLatency, 0, 0.25);
}

function getSynchronizedPlaybackTime() {
  const rawTime = Number.isFinite(audio.currentTime)
    ? audio.currentTime
    : 0;
  const duration =
    state.decodedAudioBuffer?.duration || audio.duration || rawTime;
  const latency =
    !audio.paused && !audio.ended && !state.isSeeking
      ? getMeasuredAudioOutputLatency()
      : 0;

  return clamp(rawTime - latency, 0, Math.max(0, duration));
}

export function updateSmoothPlaybackClock(timestamp) {
  const playing =
    state.analysisReady &&
    !audio.paused &&
    !audio.ended &&
    !state.isSeeking;
  const raw = getSynchronizedPlaybackTime();

  if (!playing) {
    state.smoothPlaybackValid = false;
    state.smoothPlaybackTime = raw;
    state.smoothPlaybackLastTimestamp = timestamp;
    return raw;
  }

  if (
    !state.smoothPlaybackValid ||
    state.smoothPlaybackLastTimestamp <= 0
  ) {
    state.smoothPlaybackTime = raw;
    state.smoothPlaybackValid = true;
    state.smoothPlaybackLastTimestamp = timestamp;
    return raw;
  }

  const rate = audio.playbackRate || 1;
  const dt = Math.min(
    0.1,
    Math.max(0, (timestamp - state.smoothPlaybackLastTimestamp) / 1000)
  );
  state.smoothPlaybackLastTimestamp = timestamp;

  let predicted = state.smoothPlaybackTime + dt * rate;
  const error = raw - predicted;
  if (Math.abs(error) > 0.25) {
    predicted = raw; // seek or large drift → snap back to the audio clock
  } else {
    predicted += error * 0.12; // ease toward the truth without stepping
  }

  const duration =
    state.decodedAudioBuffer?.duration || audio.duration || predicted;
  predicted = clamp(predicted, 0, Math.max(0, duration));
  state.smoothPlaybackTime = predicted;
  return predicted;
}

export function currentPlayheadTime() {
  if (Number.isFinite(state.exportPlaybackTimeOverride)) {
    return state.exportPlaybackTimeOverride;
  }

  return state.smoothPlaybackValid
    ? state.smoothPlaybackTime
    : getSynchronizedPlaybackTime();
}

export async function togglePlayback() {
  if (!state.hasAudio) return;

  try {
    await ensureAudioGraph();

    if (audio.paused) {
      galaxyLoopController.syncButton();
  if (state.audioLoop && hasPartialLoopSelection()) {
        const range = getSelectedLoopRange();
        if (audio.currentTime < range.start || audio.currentTime >= range.end) {
          audio.currentTime = range.start;
          resetSmoothPlaybackTo(range.start);
        }
      }
      await audio.play();
    } else {
      audio.pause();
    }
  } catch (error) {
    console.error(error);
    setStatus(`ERROR / ${error.message}`);
  }
}
