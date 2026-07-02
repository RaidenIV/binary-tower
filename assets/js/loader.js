// loader.js — generated module split of app.js (behavior unchanged)
import { loopDefaults } from "./config.js";
import { analyzeAudio, resetHistory } from "./analysis.js";
import { audio, elements, state } from "./core.js";
import { drawLoopMinimap, drawLoopWaveform, galaxyLoopController, initializeLoopSelection, resetBinaryStreamClock, setLoopControlsEnabled, setLoopStatus, updateLoopSelectionUi } from "./loop.js";
import { ensureAudioGraph } from "./playback.js";
import { clamp, formatTime, markRenderDirty, setStatus } from "./utils.js";

let audioLoadProgressHideTimer = 0;

function setAudioFileLoading(isLoading) {
  elements.audioFile.disabled = isLoading;
  elements.audioFileButton.classList.toggle("is-loading", isLoading);
  elements.audioFileButtonText.hidden = isLoading;
  elements.audioLoadProgress.hidden = !isLoading;

  if (isLoading) {
    elements.audioFileButton.setAttribute("aria-disabled", "true");
  } else {
    elements.audioFileButton.removeAttribute("aria-disabled");
  }
}

function setAudioLoadProgress(percent, stage = "Loading audio…") {
  window.clearTimeout(audioLoadProgressHideTimer);
  const normalized = clamp(Number(percent) || 0, 0, 100);
  setAudioFileLoading(true);
  elements.audioLoadProgressBar.value = normalized;
  elements.audioLoadProgressPercent.textContent = `${Math.round(normalized)}%`;
  elements.audioLoadStage.textContent = stage;
}

export function hideAudioLoadProgress(delay = 0) {
  window.clearTimeout(audioLoadProgressHideTimer);
  const hide = () => {
    setAudioFileLoading(false);
    elements.audioLoadProgressBar.value = 0;
    elements.audioLoadProgressPercent.textContent = "0%";
    elements.audioLoadStage.textContent = "Preparing audio…";
  };
  if (delay > 0) {
    audioLoadProgressHideTimer = window.setTimeout(hide, delay);
  } else {
    hide();
  }
}

export let fftLoadProgressHideTimer = 0;

export function setFftLoadProgress(percent, stage = "Reanalyzing audio resolution…") {
  window.clearTimeout(fftLoadProgressHideTimer);
  const normalized = clamp(Number(percent) || 0, 0, 100);
  elements.fftLoadProgressWrap.hidden = false;
  elements.fftLoadProgress.value = normalized;
  elements.fftLoadProgressText.textContent = `${Math.round(normalized)}%`;
  elements.fftLoadStage.textContent = stage;
}

export function hideFftLoadProgress(delay = 0) {
  window.clearTimeout(fftLoadProgressHideTimer);
  const hide = () => {
    elements.fftLoadProgressWrap.hidden = true;
    elements.fftLoadProgress.value = 0;
    elements.fftLoadProgressText.textContent = "0%";
    elements.fftLoadStage.textContent = "Preparing audio resolution…";
  };
  if (delay > 0) {
    fftLoadProgressHideTimer = window.setTimeout(hide, delay);
  } else {
    hide();
  }
}

function readAudioFileWithProgress(file, version) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("progress", (event) => {
      if (version !== state.analysisVersion) {
        reader.abort();
        return;
      }
      const ratio = event.lengthComputable && event.total > 0
        ? event.loaded / event.total
        : 0;
      setAudioLoadProgress(
        5 + ratio * 60,
        `Reading file · ${Math.round(ratio * 100)}%`
      );
    });

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error || new Error("Audio file could not be read.")));
    reader.addEventListener("abort", () => reject(new DOMException("Audio loading was cancelled.", "AbortError")));
    reader.readAsArrayBuffer(file);
  });
}

export async function loadAudioFile(file) {
  if (!file || elements.audioFile.disabled) return;

  window.clearTimeout(state.reanalysisTimer);
  state.reanalysisTimer = null;
  state.fftReanalysisVersion += 1;
  hideFftLoadProgress();

  const looksLikeAudio =
    file.type.startsWith("audio/") ||
    /\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(file.name);

  if (!looksLikeAudio) {
    hideAudioLoadProgress();
    setStatus("LOAD ERROR / NO SUPPORTED AUDIO FILE FOUND");
    return;
  }

  audio.pause();
  state.hasAudio = false;
  state.analysisReady = false;
  state.spectrogramData = null;
  state.frequencySpectrogramData = null;
  state.decodedAudioBuffer = null;
  state.loopBpmDetectionVersion += 1;
  state.loopReady = false;
  state.loopWaveformPeaks = null;
  state.loopStart = loopDefaults.start;
  state.loopEnd = loopDefaults.end;
  state.loopZoomStart = 0;
  state.loopZoomEnd = 0;
  setLoopControlsEnabled(false);
  updateLoopSelectionUi();
  drawLoopWaveform();
  drawLoopMinimap();
  setLoopStatus("Analyzing audio before creating the loop…", "active");
  resetBinaryStreamClock(0);
  state.binaryDeletedNumbers.clear();
  resetHistory();

  state.fileName = file.name;
  elements.fileName.textContent = file.name;
  elements.playPause.disabled = true;
  elements.loopButton.disabled = true;
  elements.timeline.disabled = true;
  elements.playPause.textContent = "▶ Play";
  elements.timeline.value = "0";
  elements.currentTime.textContent = "0:00";
  elements.duration.textContent = "0:00";
  setStatus(`ANALYZING / ${file.name.toUpperCase()}`);

  const version = ++state.analysisVersion;
  state.isAnalyzing = true;
  setAudioLoadProgress(2, "Preparing audio reader…");

  try {
    const audioContext = await ensureAudioGraph();
    setAudioLoadProgress(5, "Reading audio file…");
    const arrayBuffer = await readAudioFileWithProgress(file, version);
    if (version !== state.analysisVersion) return;

    setAudioLoadProgress(70, "Decoding audio…");
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    if (version !== state.analysisVersion) return;

    setAudioLoadProgress(82, "Analyzing frequencies…");
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const analyzed = await analyzeAudio(decoded, state.fftSize, {
      shouldCancel: () => version !== state.analysisVersion,
      onProgress: (amount, stage) => {
        if (version !== state.analysisVersion) return;
        setAudioLoadProgress(82 + amount * 15, stage);
      }
    });
    setAudioLoadProgress(97, "Building visualization…");

    if (version !== state.analysisVersion) return;

    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
    }

    state.objectUrl = URL.createObjectURL(file);
    state.fileName = file.name;
    state.decodedAudioBuffer = decoded;
    state.spectrogramData = analyzed.terrain;
    state.frequencySpectrogramData = analyzed.frequencyGraph;
    state.hasAudio = true;
    state.analysisReady = true;
    state.isAnalyzing = false;
    initializeLoopSelection(decoded);

    audio.src = state.objectUrl;
    audio.load();
    audio.currentTime = 0;

    elements.duration.textContent = formatTime(decoded.duration);
    elements.playPause.disabled = false;
    elements.loopButton.disabled = false;
    galaxyLoopController.syncButton();
    elements.timeline.disabled = false;
    setStatus(
      `READY / ${file.name.toUpperCase()} / ${formatTime(decoded.duration)} / ` +
      `${analyzed.terrain.length} ANALYZED FRAMES`
    );
    setAudioLoadProgress(100, "Audio ready");
    markRenderDirty();
  } catch (error) {
    console.error(error);
    if (version !== state.analysisVersion) return;

    state.isAnalyzing = false;
    state.analysisReady = false;
    state.hasAudio = false;
    state.decodedAudioBuffer = null;
    state.spectrogramData = null;
    state.frequencySpectrogramData = null;
    state.loopReady = false;
    state.loopWaveformPeaks = null;
    setLoopControlsEnabled(false);
    updateLoopSelectionUi();
    drawLoopWaveform();
    drawLoopMinimap();
    setLoopStatus("Loop selection could not be initialized.", "error");
    elements.playPause.disabled = true;
    elements.loopButton.disabled = true;
    galaxyLoopController.syncButton();
    elements.timeline.disabled = true;
    resetHistory();
    setAudioLoadProgress(0, "Audio loading failed");
    setStatus("ERROR / AUDIO FILE COULD NOT BE DECODED OR ANALYZED");
  } finally {
    if (version === state.analysisVersion) {
      hideAudioLoadProgress();
    }
  }
}
