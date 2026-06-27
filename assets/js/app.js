import {
  defaults,
  isFirefoxBrowser,
  loopDefaults,
  productionViewportPresets,
  videoExportDefaults
} from "./config.js";

const state = {
  ...defaults,
  fileName: "",
  objectUrl: "",
  history: [],
  historyIsFlat: true,
  frame: 0,
  audioContext: null,
  mediaSourceNode: null,
  audioAnalyserNode: null,
  decodedAudioBuffer: null,
  spectrogramData: null,
  frequencySpectrogramData: null,
  analysisVersion: 0,
  fftReanalysisVersion: 0,
  reanalysisTimer: null,
  isAnalyzing: false,
  analysisReady: false,
  isSeeking: false,
  hasAudio: false,
  cssWidth: 0,
  cssHeight: 0,
  dpr: 1,
  needsRender: true,
  lastTimelineTimestamp: 0,
  geometryCache: null,
  geometryBuffers: null,
  hudLayer: null,
  lastTerrainRenderTimestamp: 0,
  surfacePaletteCache: null,
  fpsValue: 0,
  fpsFrameCount: 0,
  fpsSampleStart: 0,
  lastAutoRotateTimestamp: 0,
  lastHistoryUpdateTimestamp: 0,
  lastRotationControlSyncTimestamp: 0,
  binaryStreamTime: 0,
  binaryStreamTargetTime: 0,
  binaryStreamFrameInterval: 0,
  binaryStreamClockValid: false,
  lastBinaryStreamTimestamp: 0,
  binaryDeletionFrameDelta: 0,
  binaryDeletedNumbers: new Set(),
  isViewportDragging: false,
  viewportDragPointerId: null,
  viewportDragLastX: 0,
  viewportDragLastY: 0,
  sidebarCollapsed: false,
  isExportingPng: false,
  isExportingVideo: false,
  videoExportCancelled: false,
  videoExportCancelHandlers: new Set(),
  exportPlaybackTimeOverride: null,
  exportFrameRateOverride: null,
  exportLogoImage: null,
  exportLogoImageKey: "",
  hudSpectrumBuffer: null,
  hudSpectrumSmoothed: null,
  hudWaveformBuffer: null,
  hudLevel: null,
  smoothPlaybackTime: 0,
  smoothPlaybackValid: false,
  smoothPlaybackLastTimestamp: 0,
  loopBpm: loopDefaults.bpm,
  loopBars: loopDefaults.bars,
  loopSnap: loopDefaults.snap,
  loopStart: loopDefaults.start,
  loopEnd: loopDefaults.end,
  loopReady: false,
  loopWaveformPeaks: null,
  loopBpmDetectionVersion: 0,
  loopDragPointerId: null,
  loopDragStartX: 0,
  loopDragOriginalStart: 0,
  loopResizeObserver: null,
  loopZoomStart: loopDefaults.zoomStart,
  loopZoomEnd: loopDefaults.zoomEnd,
  loopMinimapDragPointerId: null,
  loopMinimapDragStartX: 0,
  loopMinimapOriginalZoomStart: 0
};

const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

const elements = {
  audioFile: document.getElementById("audioFile"),
  audioLoadProgressWrap: document.getElementById("audioLoadProgressWrap"),
  audioLoadProgress: document.getElementById("audioLoadProgress"),
  audioLoadProgressText: document.getElementById("audioLoadProgressText"),
  audioLoadStage: document.getElementById("audioLoadStage"),
  resetVisualizer: document.getElementById("resetVisualizer"),
  fileName: document.getElementById("fileName"),
  playPause: document.getElementById("playPause"),
  loopButton: document.getElementById("loopButton"),
  timeline: document.getElementById("timeline"),
  currentTime: document.getElementById("currentTime"),
  duration: document.getElementById("duration"),
  exportPng: document.getElementById("exportPng"),
  exportJson: document.getElementById("exportJson"),
  exportVideo: document.getElementById("exportVideo"),
  exportFileName: document.getElementById("exportFileName"),
  videoFileType: document.getElementById("videoFileType"),
  videoFrameRate: document.getElementById("videoFrameRate"),
  videoBitrate: document.getElementById("videoBitrate"),
  videoExportStatus: document.getElementById("videoExportStatus"),
  app: document.querySelector(".app"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarToggleIcon: document.getElementById("sidebarToggleIcon"),
  viewportStage: document.getElementById("viewportStage"),
  viewportFrame: document.getElementById("viewportFrame"),
  statusBar: document.getElementById("statusBar"),
  fftSize: document.getElementById("fftSize"),
  fftLoadProgressWrap: document.getElementById("fftLoadProgressWrap"),
  fftLoadProgress: document.getElementById("fftLoadProgress"),
  fftLoadProgressText: document.getElementById("fftLoadProgressText"),
  fftLoadStage: document.getElementById("fftLoadStage"),
  lineCount: document.getElementById("lineCount"),
  lineCountValue: document.getElementById("lineCountValue"),
  lineHeight: document.getElementById("lineHeight"),
  lineHeightValue: document.getElementById("lineHeightValue"),
  zoom: document.getElementById("zoom"),
  zoomValue: document.getElementById("zoomValue"),
  rotation: document.getElementById("rotation"),
  rotationValue: document.getElementById("rotationValue"),
  rotateSpeed: document.getElementById("rotateSpeed"),
  rotateSpeedValue: document.getElementById("rotateSpeedValue"),
  autoRotate: document.getElementById("autoRotate"),
  elevation: document.getElementById("elevation"),
  elevationValue: document.getElementById("elevationValue"),
  audioLoop: document.getElementById("audioLoop"),
  volume: document.getElementById("volume"),
  volumeValue: document.getElementById("volumeValue"),
  muteToggle: document.getElementById("muteToggle"),
  binaryCount: document.getElementById("binaryCount"),
  binaryCountValue: document.getElementById("binaryCountValue"),
  binaryFontSize: document.getElementById("binaryFontSize"),
  binaryFontSizeValue: document.getElementById("binaryFontSizeValue"),
  binaryNumberOffset: document.getElementById("binaryNumberOffset"),
  binaryNumberOffsetValue: document.getElementById("binaryNumberOffsetValue"),
  binaryFade: document.getElementById("binaryFade"),
  binaryFadeValue: document.getElementById("binaryFadeValue"),
  binaryDeletion: document.getElementById("binaryDeletion"),
  binaryDeletionValue: document.getElementById("binaryDeletionValue"),
  binaryDeletionSpeed: document.getElementById("binaryDeletionSpeed"),
  binaryDeletionSpeedValue: document.getElementById("binaryDeletionSpeedValue"),
  viewportSize: document.getElementById("viewportSize"),
  viewportSizeValue: document.getElementById("viewportSizeValue"),
  viewportResolution: document.getElementById("viewportResolution"),
  viewportPreset: document.getElementById("viewportPreset"),
  orientation: document.getElementById("orientation"),
  aspectRatio: document.getElementById("aspectRatio"),
  frequencyGraphPlacement: document.getElementById("frequencyGraphPlacement"),
  waveformGraphPlacement: document.getElementById("waveformGraphPlacement"),
  levelsGraphPlacement: document.getElementById("levelsGraphPlacement"),
  graphWidth: document.getElementById("graphWidth"),
  graphWidthValue: document.getElementById("graphWidthValue"),
  graphHeight: document.getElementById("graphHeight"),
  graphHeightValue: document.getElementById("graphHeightValue"),
  metadataX: document.getElementById("metadataX"),
  metadataXValue: document.getElementById("metadataXValue"),
  metadataY: document.getElementById("metadataY"),
  metadataYValue: document.getElementById("metadataYValue"),
  guiTextSize: document.getElementById("guiTextSize"),
  guiTextSizeValue: document.getElementById("guiTextSizeValue"),
  logoVisible: document.getElementById("logoVisible"),
  logoX: document.getElementById("logoX"),
  logoXValue: document.getElementById("logoXValue"),
  logoY: document.getElementById("logoY"),
  logoYValue: document.getElementById("logoYValue"),
  logoSize: document.getElementById("logoSize"),
  logoSizeValue: document.getElementById("logoSizeValue"),
  viewportLogo: document.getElementById("viewportLogo"),
  videoExportOverlay: document.getElementById("videoExportOverlay"),
  videoExportOverlayDetail: document.getElementById("videoExportOverlayDetail"),
  videoExportProgressWrap: document.getElementById("videoExportProgressWrap"),
  videoExportProgress: document.getElementById("videoExportProgress"),
  videoExportProgressText: document.getElementById("videoExportProgressText"),
  videoExportOverlayProgress: document.getElementById("videoExportOverlayProgress"),
  videoExportOverlayProgressText: document.getElementById("videoExportOverlayProgressText"),
  videoExportCancel: document.getElementById("videoExportCancel"),
  loopEditor: document.getElementById("loopEditor"),
  loopWaveWrap: document.getElementById("loopWaveWrap"),
  loopWaveCanvas: document.getElementById("loopWaveCanvas"),
  loopZoomOut: document.getElementById("loopZoomOut"),
  loopZoomIn: document.getElementById("loopZoomIn"),
  loopZoomFit: document.getElementById("loopZoomFit"),
  loopZoomLevel: document.getElementById("loopZoomLevel"),
  loopMinimapWrap: document.getElementById("loopMinimapWrap"),
  loopMinimapCanvas: document.getElementById("loopMinimapCanvas"),
  loopMinimapWindow: document.getElementById("loopMinimapWindow"),
  loopSelectionRegion: document.getElementById("loopSelectionRegion"),
  loopStartHandle: document.getElementById("loopStartHandle"),
  loopEndHandle: document.getElementById("loopEndHandle"),
  loopPlayhead: document.getElementById("loopPlayhead"),
  loopStartReadout: document.getElementById("loopStartReadout"),
  loopEndReadout: document.getElementById("loopEndReadout"),
  loopDurationReadout: document.getElementById("loopDurationReadout"),
  loopBeatReadout: document.getElementById("loopBeatReadout"),
  loopStatus: document.getElementById("loopStatus"),
  loopBpmValue: document.getElementById("loopBpmValue"),
  loopBarsValue: document.getElementById("loopBarsValue"),
  loopSnap: document.getElementById("loopSnap"),
  detectLoopBpm: document.getElementById("detectLoopBpm"),
  fullTrackLoop: document.getElementById("fullTrackLoop"),
  backgroundColorHex: document.getElementById("backgroundColorHex"),
  backgroundColor: document.getElementById("backgroundColor"),
  lineWidth: document.getElementById("lineWidth"),
  lineWidthValue: document.getElementById("lineWidthValue"),
  lineColorHex: document.getElementById("lineColorHex"),
  lineColor: document.getElementById("lineColor"),
  opacity: document.getElementById("opacity"),
  opacityValue: document.getElementById("opacityValue")
};

function viewportPresetNameFromSettings(orientation, aspectRatio) {
  if (aspectRatio === "square") return "square";
  return orientation === "portrait" ? "portrait" : "landscape";
}

function applyProductionViewportPreset(name, announce = true) {
  const preset = productionViewportPresets[name] || productionViewportPresets.landscape;
  elements.viewportPreset.value = name in productionViewportPresets ? name : "landscape";

  setControlAndDispatch(elements.orientation, preset.orientation, "change");
  setControlAndDispatch(elements.aspectRatio, preset.aspectRatio, "change");
  setControlAndDispatch(elements.frequencyGraphPlacement, preset.frequencyGraphPlacement, "change");
  setControlAndDispatch(elements.waveformGraphPlacement, preset.waveformGraphPlacement, "change");
  setControlAndDispatch(elements.levelsGraphPlacement, preset.levelsGraphPlacement, "change");
  setControlAndDispatch(elements.graphWidth, preset.graphWidth);
  setControlAndDispatch(elements.graphHeight, preset.graphHeight);
  setControlAndDispatch(elements.metadataX, preset.metadataX);
  setControlAndDispatch(elements.metadataY, preset.metadataY);
  setControlAndDispatch(elements.guiTextSize, preset.guiTextSize);
  elements.logoVisible.checked = preset.logoVisible;
  elements.logoVisible.dispatchEvent(new Event("change", { bubbles: true }));
  setControlAndDispatch(elements.logoX, preset.logoX);
  setControlAndDispatch(elements.logoY, preset.logoY);
  setControlAndDispatch(elements.logoSize, preset.logoSize);

  state.hudLayer = null;
  state.geometryCache = null;
  updateViewportLogoLayout();
  fitViewport();
  markRenderDirty();
  if (announce) {
    setStatus(`VIEWPORT FORMAT / ${elements.viewportPreset.value.toUpperCase()} / GUI LOCKED`);
  }
}

function applyEmbeddedDefaultsToControls() {
  elements.fftSize.value = String(defaults.fftSize);
  elements.lineCount.value = String(defaults.lineCount);
  elements.lineHeight.value = String(defaults.lineHeight);
  elements.zoom.value = String(defaults.zoom);
  elements.rotation.value = String(defaults.rotation);
  elements.rotateSpeed.value = String(defaults.rotateSpeed);
  elements.autoRotate.checked = defaults.autoRotate;
  elements.elevation.value = String(defaults.elevation);
  elements.audioLoop.checked = defaults.audioLoop;
  elements.loopBpmValue.value = String(loopDefaults.bpm);
  elements.loopBarsValue.value = String(loopDefaults.bars);
  elements.loopSnap.checked = loopDefaults.snap;
  elements.volume.value = String(defaults.volume);
  elements.muteToggle.checked = defaults.muted;
  elements.binaryCount.value = String(defaults.binaryCount);
  elements.binaryFontSize.value = String(defaults.binaryFontSize);
  elements.binaryNumberOffset.value = String(defaults.binaryNumberOffset);
  elements.binaryFade.value = String(defaults.binaryFade);
  elements.binaryDeletion.value = String(defaults.binaryDeletion);
  elements.binaryDeletionSpeed.value =
    String(defaults.binaryDeletionSpeed);
  elements.viewportSize.value = String(defaults.viewportSize);
  elements.viewportResolution.value = defaults.viewportResolution;
  elements.viewportPreset.value = viewportPresetNameFromSettings(defaults.orientation, defaults.aspectRatio);
  elements.exportFileName.value = "";
  elements.videoFileType.value = videoExportDefaults.fileType;
  elements.videoFrameRate.value = String(videoExportDefaults.frameRate);
  elements.videoBitrate.value = String(videoExportDefaults.bitrateMbps);
  elements.orientation.value = defaults.orientation;
  elements.aspectRatio.value = defaults.aspectRatio;
  elements.frequencyGraphPlacement.value = defaults.frequencyGraphPlacement;
  elements.waveformGraphPlacement.value = defaults.waveformGraphPlacement;
  elements.levelsGraphPlacement.value = defaults.levelsGraphPlacement;
  elements.graphWidth.value = String(defaults.graphWidth);
  elements.graphHeight.value = String(defaults.graphHeight);
  elements.metadataX.value = String(defaults.metadataX);
  elements.metadataY.value = String(defaults.metadataY);
  elements.guiTextSize.value = String(defaults.guiTextSize);
  elements.logoVisible.checked = defaults.logoVisible;
  elements.logoX.value = String(defaults.logoX);
  elements.logoY.value = String(defaults.logoY);
  elements.logoSize.value = String(defaults.logoSize);
  updateExportFormatControls();
  updateViewportLogoLayout();
  elements.backgroundColorHex.value = defaults.backgroundColor.toUpperCase();
  elements.backgroundColor.value = defaults.backgroundColor;
  elements.lineWidth.value = String(defaults.lineWidth);
  elements.lineColorHex.value = defaults.lineColor.toUpperCase();
  elements.lineColor.value = defaults.lineColor;
  elements.opacity.value = String(defaults.opacity);

  audio.volume = defaults.volume / 100;
  audio.muted = defaults.muted;
  updateAudioLoopMode();
  document.documentElement.style.setProperty("--accent", defaults.lineColor);
  elements.viewportFrame.style.background = defaults.backgroundColor;
  canvas.style.background = defaults.backgroundColor;
}

applyEmbeddedDefaultsToControls();
setLoopControlsEnabled(false);
updateLoopSelectionUi();
drawLoopWaveform();
drawLoopMinimap();
setVideoExportProgress(0, "Preparing");
endVideoExportUi();

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = String(whole % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function formatPreciseTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00.000";
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds - minutes * 60).toFixed(3).padStart(6, "0");
  return `${minutes}:${remainder}`;
}

function setLoopStatus(message, status = "idle") {
  elements.loopStatus.textContent = message;
  elements.loopStatus.dataset.state = status;
}

function setLoopControlsEnabled(enabled) {
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

function getSelectedLoopRange() {
  const duration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  if (!state.loopReady || duration <= 0) {
    return { start: 0, end: duration, duration };
  }

  const start = clamp(state.loopStart, 0, duration);
  const end = clamp(state.loopEnd, start, duration);
  return { start, end, duration: Math.max(0, end - start) };
}

function hasPartialLoopSelection() {
  const trackDuration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  const range = getSelectedLoopRange();
  return state.loopReady && range.duration > 0.01 && range.duration < trackDuration - 0.01;
}

function updateAudioLoopMode() {
  // Native media looping is used only for a full-track loop. A partial
  // selection is enforced from the render clock so its boundaries stay
  // aligned with the visualizer and can be moved without recreating audio.
  audio.loop = Boolean(state.audioLoop && !hasPartialLoopSelection());
}

function resetSmoothPlaybackTo(time = audio.currentTime || 0) {
  state.smoothPlaybackTime = Number.isFinite(time) ? time : 0;
  state.smoothPlaybackValid = false;
  state.smoothPlaybackLastTimestamp = 0;
}

function resetBinaryStreamClock(time = 0) {
  const normalizedTime = Number.isFinite(time) ? Math.max(0, time) : 0;
  state.binaryStreamTime = normalizedTime;
  state.binaryStreamTargetTime = normalizedTime;
  state.binaryStreamFrameInterval = 0;
  state.binaryStreamClockValid = false;
  state.lastBinaryStreamTimestamp = 0;
  state.binaryDeletionFrameDelta = 0;
}

// Keep the binary rain moving at an even visual cadence when requestAnimationFrame
// arrives unevenly. The target clock still follows real elapsed time, while the
// displayed clock advances at the measured refresh cadence and catches up over
// several frames instead of making one large visible jump after a delayed frame.
function updateBinaryStreamClock(timestamp, isPlaying) {
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

function getLoopZoomRange() {
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

function setLoopZoomWindow(start, end) {
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

function fitLoopZoom() {
  const duration = state.decodedAudioBuffer?.duration || 0;
  setLoopZoomWindow(0, duration);
}

function zoomLoopAtX(x, factor) {
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

function updateLoopSelectionUi() {
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

function updateLoopPlayhead(time = audio.currentTime || 0) {
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

function drawLoopWaveform() {
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

function drawLoopMinimap() {
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

function applyLoopBars({ preserveStart = true } = {}) {
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

function setFullTrackLoop() {
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

async function runLoopBpmDetection() {
  if (!state.decodedAudioBuffer) return;
  const version = ++state.loopBpmDetectionVersion;
  elements.detectLoopBpm.disabled = true;
  setLoopStatus("Detecting BPM from the first 90 seconds…", "active");
  try {
    const bpm = await detectLoopBpm(state.decodedAudioBuffer);
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

function initializeLoopSelection(audioBuffer) {
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

function moveLoopSelectionTo(startTime) {
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

function beginLoopSelectionDrag(event) {
  if (!state.loopReady || event.button > 0) return;
  state.loopDragPointerId = event.pointerId;
  state.loopDragStartX = event.clientX;
  state.loopDragOriginalStart = state.loopStart;
  event.currentTarget.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function continueLoopSelectionDrag(event) {
  if (event.pointerId !== state.loopDragPointerId || !state.loopReady) return;
  const rect = elements.loopWaveWrap.getBoundingClientRect();
  const zoomRange = getLoopZoomRange();
  const deltaTime =
    ((event.clientX - state.loopDragStartX) / Math.max(1, rect.width)) *
    zoomRange.width;
  moveLoopSelectionTo(state.loopDragOriginalStart + deltaTime);
  event.preventDefault();
}

function endLoopSelectionDrag(event) {
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

function enforceSelectedLoop() {
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

function sanitizeFileName(value) {
  return value
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "binary-tower";
}

function getExportFileBaseName() {
  const customName = elements.exportFileName.value.trim();
  if (customName) return sanitizeFileName(customName);
  if (state.fileName) return sanitizeFileName(state.fileName);
  return "binary-tower";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setStatus(message) {
  elements.statusBar.textContent = message;
}

function markRenderDirty() {
  state.needsRender = true;
}

async function ensureAudioGraph() {
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

// The HTML media clock (audio.currentTime) advances in coarse, uneven
// steps when polled per animation frame, which makes the terrain scroll
// visibly stair-step. This maintains a smooth, monotonic playback time
// that advances by real wall-clock delta each frame and is continuously
// eased toward the latency-corrected media clock, with a hard resync on
// seeks / large drift. The result tracks the audio on average but moves
// continuously between media-clock ticks, so the scroll glides.
function updateSmoothPlaybackClock(timestamp) {
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

// Latency-corrected playhead used by the visuals: the smoothed clock while
// playing, the exact media clock otherwise (paused refresh, seeking).
function currentPlayheadTime() {
  if (Number.isFinite(state.exportPlaybackTimeOverride)) {
    return state.exportPlaybackTimeOverride;
  }

  return state.smoothPlaybackValid
    ? state.smoothPlaybackTime
    : getSynchronizedPlaybackTime();
}

function resetHistory() {
  const points = FREQUENCY_POINT_COUNT;
  state.history = Array.from(
    { length: state.lineCount },
    () => new Float32Array(points)
  );
  state.historyIsFlat = true;
  state.geometryCache = null;
  markRenderDirty();
}

let audioLoadProgressHideTimer = 0;

function setAudioLoadProgress(percent, stage = "Loading audio…") {
  window.clearTimeout(audioLoadProgressHideTimer);
  const normalized = clamp(Number(percent) || 0, 0, 100);
  elements.audioLoadProgressWrap.hidden = false;
  elements.audioLoadProgress.value = normalized;
  elements.audioLoadProgressText.textContent = `${Math.round(normalized)}%`;
  elements.audioLoadStage.textContent = stage;
}

function hideAudioLoadProgress(delay = 0) {
  window.clearTimeout(audioLoadProgressHideTimer);
  const hide = () => {
    elements.audioLoadProgressWrap.hidden = true;
    elements.audioLoadProgress.value = 0;
    elements.audioLoadProgressText.textContent = "0%";
    elements.audioLoadStage.textContent = "Preparing audio…";
  };
  if (delay > 0) {
    audioLoadProgressHideTimer = window.setTimeout(hide, delay);
  } else {
    hide();
  }
}

let fftLoadProgressHideTimer = 0;

function setFftLoadProgress(percent, stage = "Reanalyzing audio resolution…") {
  window.clearTimeout(fftLoadProgressHideTimer);
  const normalized = clamp(Number(percent) || 0, 0, 100);
  elements.fftLoadProgressWrap.hidden = false;
  elements.fftLoadProgress.value = normalized;
  elements.fftLoadProgressText.textContent = `${Math.round(normalized)}%`;
  elements.fftLoadStage.textContent = stage;
}

function hideFftLoadProgress(delay = 0) {
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

async function loadAudioFile(file) {
  if (!file) return;

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
    hideAudioLoadProgress(900);
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
    hideAudioLoadProgress(1600);
    setStatus("ERROR / AUDIO FILE COULD NOT BE DECODED OR ANALYZED");
  }
}

function resetVisualizerToDefaults() {
  if (state.isExportingVideo) {
    requestVideoExportCancel();
    return;
  }

  // Cancel any active decoding/reanalysis work before clearing the file.
  window.clearTimeout(state.reanalysisTimer);
  state.reanalysisTimer = null;
  state.analysisVersion += 1;
  state.fftReanalysisVersion += 1;
  state.loopBpmDetectionVersion += 1;
  hideFftLoadProgress();

  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
  }

  Object.assign(state, defaults, {
    fileName: "",
    objectUrl: "",
    decodedAudioBuffer: null,
    spectrogramData: null,
    frequencySpectrogramData: null,
    isAnalyzing: false,
    analysisReady: false,
    isSeeking: false,
    hasAudio: false,
    frame: 0,
    geometryCache: null,
    geometryBuffers: null,
    hudLayer: null,
    surfacePaletteCache: null,
    fpsValue: 0,
    fpsFrameCount: 0,
    fpsSampleStart: 0,
    lastAutoRotateTimestamp: 0,
    lastHistoryUpdateTimestamp: 0,
    lastRotationControlSyncTimestamp: 0,
    binaryStreamTime: 0,
    binaryStreamTargetTime: 0,
    binaryStreamFrameInterval: 0,
    binaryStreamClockValid: false,
    lastBinaryStreamTimestamp: 0,
    binaryDeletionFrameDelta: 0,
    hudSpectrumBuffer: null,
    hudSpectrumSmoothed: null,
    hudWaveformBuffer: null,
    exportLogoImage: null,
    exportLogoImageKey: "",
    loopBpm: loopDefaults.bpm,
    loopBars: loopDefaults.bars,
    loopSnap: loopDefaults.snap,
    loopStart: loopDefaults.start,
    loopEnd: loopDefaults.end,
    loopReady: false,
    loopWaveformPeaks: null,
    loopDragPointerId: null,
    loopZoomStart: loopDefaults.zoomStart,
    loopZoomEnd: loopDefaults.zoomEnd,
    loopMinimapDragPointerId: null
  });
  state.binaryDeletedNumbers.clear();

  applyEmbeddedDefaultsToControls();

  // Re-run the existing control bindings so sliders, editable number
  // fields, selectors, and checkboxes all reflect the restored defaults.
  [
    elements.lineCount,
    elements.lineHeight,
    elements.zoom,
    elements.rotation,
    elements.rotateSpeed,
    elements.elevation,
    elements.volume,
    elements.binaryCount,
    elements.binaryFontSize,
    elements.binaryNumberOffset,
    elements.binaryFade,
    elements.binaryDeletion,
    elements.binaryDeletionSpeed,
    elements.viewportSize,
    elements.graphWidth,
    elements.graphHeight,
    elements.metadataX,
    elements.metadataY,
    elements.guiTextSize,
    elements.logoX,
    elements.logoY,
    elements.logoSize,
    elements.lineWidth,
    elements.opacity
  ].forEach((control) => {
    control.dispatchEvent(new Event("input", { bubbles: true }));
  });

  elements.fftSize.dispatchEvent(new Event("change", { bubbles: true }));
  elements.autoRotate.dispatchEvent(new Event("change", { bubbles: true }));
  elements.audioLoop.dispatchEvent(new Event("change", { bubbles: true }));
  elements.muteToggle.dispatchEvent(new Event("change", { bubbles: true }));
  elements.viewportResolution.dispatchEvent(
    new Event("change", { bubbles: true })
  );
  elements.orientation.dispatchEvent(new Event("change", { bubbles: true }));
  elements.aspectRatio.dispatchEvent(new Event("change", { bubbles: true }));
  elements.viewportPreset.value = viewportPresetNameFromSettings(
    defaults.orientation,
    defaults.aspectRatio
  );
  elements.frequencyGraphPlacement.dispatchEvent(
    new Event("change", { bubbles: true })
  );
  elements.waveformGraphPlacement.dispatchEvent(
    new Event("change", { bubbles: true })
  );
  elements.levelsGraphPlacement.dispatchEvent(
    new Event("change", { bubbles: true })
  );
  elements.logoVisible.dispatchEvent(new Event("change", { bubbles: true }));
  elements.backgroundColor.dispatchEvent(new Event("input", { bubbles: true }));
  elements.lineColor.dispatchEvent(new Event("input", { bubbles: true }));

  elements.videoFileType.value = videoExportDefaults.fileType;
  elements.videoFrameRate.value = String(videoExportDefaults.frameRate);
  elements.videoBitrate.value = String(videoExportDefaults.bitrateMbps);
  updateVideoExportFormatUi(true);
  setVideoExportProgress(0, "Preparing");
  endVideoExportUi();

  setLoopControlsEnabled(false);
  updateLoopSelectionUi();
  updateLoopPlayhead(0);
  drawLoopWaveform();
  setLoopStatus("Load audio to create a beat-snapped, zoomable loop.", "idle");

  hideAudioLoadProgress();
  elements.audioFile.value = "";
  elements.fileName.textContent = "No audio file loaded";
  elements.playPause.disabled = true;
  elements.loopButton.disabled = true;
  elements.playPause.textContent = "▶ Play";
  galaxyLoopController.syncButton();
  elements.timeline.disabled = true;
  elements.timeline.value = "0";
  elements.currentTime.textContent = "0:00";
  elements.duration.textContent = "0:00";

  resetHistory();
  fitViewport();
  setStatus("IDLE / DROP AUDIO TO BEGIN");
  markRenderDirty();
}

function setControlAndDispatch(control, value, eventType = "input") {
  control.value = String(value);
  control.dispatchEvent(new Event(eventType, { bubbles: true }));
}

function resetPlaybackSectionToDefaults() {
  setControlAndDispatch(elements.volume, defaults.volume);
  elements.muteToggle.checked = defaults.muted;
  elements.muteToggle.dispatchEvent(new Event("change", { bubbles: true }));

  state.loopBpm = loopDefaults.bpm;
  state.loopBars = loopDefaults.bars;
  state.loopSnap = loopDefaults.snap;
  elements.loopBpmValue.value = String(loopDefaults.bpm);
  elements.loopBarsValue.value = String(loopDefaults.bars);
  elements.loopSnap.checked = loopDefaults.snap;

  const duration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  if (duration > 0) {
    const selectedDuration = Math.max(
      0.05,
      Math.min(duration, loopDefaults.end - loopDefaults.start)
    );
    state.loopStart = clamp(
      loopDefaults.start,
      0,
      Math.max(0, duration - selectedDuration)
    );
    state.loopEnd = Math.min(duration, state.loopStart + selectedDuration);
    state.loopZoomStart = clamp(loopDefaults.zoomStart, 0, Math.max(0, duration - 0.05));
    state.loopZoomEnd = clamp(loopDefaults.zoomEnd, state.loopZoomStart + 0.05, duration);
  } else {
    state.loopStart = loopDefaults.start;
    state.loopEnd = loopDefaults.end;
    state.loopZoomStart = loopDefaults.zoomStart;
    state.loopZoomEnd = loopDefaults.zoomEnd;
  }

  elements.audioLoop.checked = defaults.audioLoop;
  elements.audioLoop.dispatchEvent(new Event("change", { bubbles: true }));
  updateLoopSelectionUi();
  drawLoopWaveform();
  drawLoopMinimap();
  galaxyLoopController.syncButton();
  setStatus("DEFAULTS RESTORED / FILE AND PLAYBACK / 13.JSON");
}

function resetLoopSectionToDefaults() {
  state.loopBpm = loopDefaults.bpm;
  state.loopBars = loopDefaults.bars;
  state.loopSnap = loopDefaults.snap;
  elements.loopBpmValue.value = String(loopDefaults.bpm);
  elements.loopBarsValue.value = String(loopDefaults.bars);
  elements.loopSnap.checked = loopDefaults.snap;

  const duration = state.decodedAudioBuffer?.duration || audio.duration || 0;
  if (duration > 0) {
    const selectedDuration = Math.max(0.05, Math.min(duration, loopDefaults.end - loopDefaults.start));
    state.loopStart = clamp(loopDefaults.start, 0, Math.max(0, duration - selectedDuration));
    state.loopEnd = Math.min(duration, state.loopStart + selectedDuration);
    state.loopZoomStart = clamp(loopDefaults.zoomStart, 0, Math.max(0, duration - 0.05));
    state.loopZoomEnd = clamp(loopDefaults.zoomEnd, state.loopZoomStart + 0.05, duration);
  } else {
    state.loopStart = loopDefaults.start;
    state.loopEnd = loopDefaults.end;
    state.loopZoomStart = loopDefaults.zoomStart;
    state.loopZoomEnd = loopDefaults.zoomEnd;
  }

  elements.audioLoop.checked = defaults.audioLoop;
  elements.audioLoop.dispatchEvent(new Event("change", { bubbles: true }));
  updateLoopSelectionUi();
  drawLoopWaveform();
  drawLoopMinimap();
  galaxyLoopController.syncButton();
  setStatus("DEFAULTS RESTORED / LOOP SELECTION / 13.JSON");
}

function resetViewportSectionToDefaults() {
  setControlAndDispatch(elements.viewportSize, defaults.viewportSize);
  const defaultPreset = viewportPresetNameFromSettings(defaults.orientation, defaults.aspectRatio);
  elements.viewportPreset.value = defaultPreset;
  applyProductionViewportPreset(defaultPreset, false);
  setStatus("DEFAULTS RESTORED / VIEWPORT / LOCKED FORMAT PRESET");
}

function resetAudioMeshSectionToDefaults() {
  setControlAndDispatch(elements.fftSize, defaults.fftSize, "change");
  setControlAndDispatch(elements.lineCount, defaults.lineCount);
  setControlAndDispatch(elements.lineHeight, defaults.lineHeight);
  resetHistory();
  setStatus("DEFAULTS RESTORED / AUDIO RESOLUTION / 13.JSON");
}

function resetTransformSectionToDefaults() {
  setControlAndDispatch(elements.zoom, defaults.zoom);
  setControlAndDispatch(elements.rotation, defaults.rotation);
  setControlAndDispatch(elements.rotateSpeed, defaults.rotateSpeed);
  setControlAndDispatch(elements.elevation, defaults.elevation);
  elements.autoRotate.checked = defaults.autoRotate;
  elements.autoRotate.dispatchEvent(new Event("change", { bubbles: true }));
  state.geometryCache = null;
  setStatus("DEFAULTS RESTORED / TRANSFORM / 13.JSON");
}

function resetBinarySectionToDefaults() {
  setControlAndDispatch(elements.binaryCount, defaults.binaryCount);
  setControlAndDispatch(elements.binaryFontSize, defaults.binaryFontSize);
  setControlAndDispatch(elements.binaryNumberOffset, defaults.binaryNumberOffset);
  setControlAndDispatch(elements.binaryFade, defaults.binaryFade);
  setControlAndDispatch(elements.binaryDeletion, defaults.binaryDeletion);
  setControlAndDispatch(elements.binaryDeletionSpeed, defaults.binaryDeletionSpeed);
  state.binaryDeletedNumbers.clear();
  resetBinaryStreamClock(0);
  setStatus("DEFAULTS RESTORED / BINARY NUMBERS / 13.JSON");
}

function resetAppearanceSectionToDefaults() {
  elements.backgroundColor.value = defaults.backgroundColor;
  elements.backgroundColor.dispatchEvent(new Event("input", { bubbles: true }));
  setControlAndDispatch(elements.lineWidth, defaults.lineWidth);
  elements.lineColor.value = defaults.lineColor;
  elements.lineColor.dispatchEvent(new Event("input", { bubbles: true }));
  setControlAndDispatch(elements.opacity, defaults.opacity);
  setStatus("DEFAULTS RESTORED / APPEARANCE / 13.JSON");
}

function resetGuiSectionToDefaults() {
  setControlAndDispatch(elements.frequencyGraphPlacement, defaults.frequencyGraphPlacement, "change");
  setControlAndDispatch(elements.waveformGraphPlacement, defaults.waveformGraphPlacement, "change");
  setControlAndDispatch(elements.levelsGraphPlacement, defaults.levelsGraphPlacement, "change");
  setControlAndDispatch(elements.graphWidth, defaults.graphWidth);
  setControlAndDispatch(elements.graphHeight, defaults.graphHeight);
  setControlAndDispatch(elements.metadataX, defaults.metadataX);
  setControlAndDispatch(elements.metadataY, defaults.metadataY);
  setControlAndDispatch(elements.guiTextSize, defaults.guiTextSize);
  elements.logoVisible.checked = defaults.logoVisible;
  elements.logoVisible.dispatchEvent(new Event("change", { bubbles: true }));
  setControlAndDispatch(elements.logoX, defaults.logoX);
  setControlAndDispatch(elements.logoY, defaults.logoY);
  setControlAndDispatch(elements.logoSize, defaults.logoSize);
  state.hudLayer = null;
  setStatus("DEFAULTS RESTORED / GUI / 13.JSON");
}

function resetVisualizationSectionToDefaults() {
  setControlAndDispatch(elements.fftSize, defaults.fftSize, "change");
  [
    [elements.lineCount, defaults.lineCount],
    [elements.lineHeight, defaults.lineHeight],
    [elements.zoom, defaults.zoom],
    [elements.rotation, defaults.rotation],
    [elements.rotateSpeed, defaults.rotateSpeed],
    [elements.elevation, defaults.elevation],
    [elements.binaryCount, defaults.binaryCount],
    [elements.binaryFontSize, defaults.binaryFontSize],
    [elements.binaryNumberOffset, defaults.binaryNumberOffset],
    [elements.binaryFade, defaults.binaryFade],
    [elements.binaryDeletion, defaults.binaryDeletion],
    [elements.binaryDeletionSpeed, defaults.binaryDeletionSpeed],
    [elements.viewportSize, defaults.viewportSize],
    [elements.graphWidth, defaults.graphWidth],
    [elements.graphHeight, defaults.graphHeight],
    [elements.metadataX, defaults.metadataX],
    [elements.metadataY, defaults.metadataY],
    [elements.guiTextSize, defaults.guiTextSize],
    [elements.logoX, defaults.logoX],
    [elements.logoY, defaults.logoY],
    [elements.logoSize, defaults.logoSize],
    [elements.lineWidth, defaults.lineWidth],
    [elements.opacity, defaults.opacity]
  ].forEach(([control, value]) => setControlAndDispatch(control, value));

  elements.autoRotate.checked = defaults.autoRotate;
  elements.autoRotate.dispatchEvent(new Event("change", { bubbles: true }));

  [
    [elements.orientation, defaults.orientation],
    [elements.aspectRatio, defaults.aspectRatio],
    [elements.frequencyGraphPlacement, defaults.frequencyGraphPlacement],
    [elements.waveformGraphPlacement, defaults.waveformGraphPlacement],
    [elements.levelsGraphPlacement, defaults.levelsGraphPlacement]
  ].forEach(([control, value]) => setControlAndDispatch(control, value, "change"));

  elements.logoVisible.checked = defaults.logoVisible;
  elements.logoVisible.dispatchEvent(new Event("change", { bubbles: true }));

  elements.backgroundColor.value = defaults.backgroundColor;
  elements.backgroundColor.dispatchEvent(new Event("input", { bubbles: true }));
  elements.lineColor.value = defaults.lineColor;
  elements.lineColor.dispatchEvent(new Event("input", { bubbles: true }));

  state.binaryDeletedNumbers.clear();
  resetBinaryStreamClock(0);
  state.geometryCache = null;
  state.hudLayer = null;
  resetHistory();
  fitViewport();
  setStatus("DEFAULTS RESTORED / VISUALIZATION / 13.JSON");
}

function resetExportFormatSectionToDefaults() {
  setControlAndDispatch(elements.viewportResolution, defaults.viewportResolution, "change");
  elements.videoFileType.value = videoExportDefaults.fileType;
  elements.videoFrameRate.value = String(videoExportDefaults.frameRate);
  elements.videoBitrate.value = String(videoExportDefaults.bitrateMbps);
  updateVideoExportFormatUi(true);
  setVideoExportProgress(0, "Preparing");
  endVideoExportUi();
  setStatus("DEFAULTS RESTORED / EXPORT FORMAT / 13.JSON");
}

function resetExportSectionToDefaults() {
  elements.exportFileName.value = "";
  resetExportFormatSectionToDefaults();
  setStatus("DEFAULTS RESTORED / EXPORT / 13.JSON");
}

function initializeSectionResetButtons() {
  document.querySelectorAll(".section-reset").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const section = button.dataset.resetSection;
      if (section === "playback") resetPlaybackSectionToDefaults();
      if (section === "loop") resetLoopSectionToDefaults();
      if (section === "viewport") resetViewportSectionToDefaults();
      if (section === "audio-mesh") resetAudioMeshSectionToDefaults();
      if (section === "transform") resetTransformSectionToDefaults();
      if (section === "binary") resetBinarySectionToDefaults();
      if (section === "appearance") resetAppearanceSectionToDefaults();
      if (section === "gui") resetGuiSectionToDefaults();
      if (section === "visualization") resetVisualizationSectionToDefaults();
      if (section === "export-format") resetExportFormatSectionToDefaults();
      if (section === "export") resetExportSectionToDefaults();
    });
  });
}

async function togglePlayback() {
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

function fitViewport() {
  const stageRect = elements.viewportStage.getBoundingClientRect();
  const padding = 44;
  const availableWidth = Math.max(220, stageRect.width - padding);
  const availableHeight = Math.max(220, stageRect.height - padding);
  const aspect =
    state.aspectRatio === "square"
      ? 1
      : state.orientation === "portrait"
        ? 9 / 16
        : 16 / 9;

  let baseWidth = Math.min(availableWidth, availableHeight * aspect);
  let baseHeight = baseWidth / aspect;

  const scale = state.viewportSize / 100;
  baseWidth *= scale;
  baseHeight *= scale;

  elements.viewportFrame.style.width = `${Math.round(baseWidth)}px`;
  elements.viewportFrame.style.height = `${Math.round(baseHeight)}px`;
  elements.viewportFrame.style.background = state.backgroundColor;
  resizeCanvas();
}

function getViewportResolutionDimensions() {
  const preset = state.viewportResolution;
  const isPortrait = state.orientation === "portrait";

  let width = 1920;
  let height = 1080;
  let squareSize = 1080;

  if (preset === "4k") {
    width = 3840;
    height = 2160;
    squareSize = 2160;
  } else if (preset === "2k") {
    width = 2560;
    height = 1440;
    squareSize = 1440;
  }

  if (state.aspectRatio === "square") {
    return { width: squareSize, height: squareSize };
  }

  return isPortrait
    ? { width: height, height: width }
    : { width, height };
}

function updateExportFormatControls() {
  const isSquare = state.aspectRatio === "square";
  elements.orientation.disabled = isSquare;
  elements.orientation.setAttribute("aria-disabled", String(isSquare));
  elements.orientation.title = isSquare
    ? "Orientation does not apply to a square viewport."
    : "Choose portrait or landscape viewport orientation.";
}

function getWebpageRenderDimensions() {
  if (state.aspectRatio === "square") {
    return { width: 1080, height: 1080 };
  }

  return state.orientation === "portrait"
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}

function resizeCanvas() {
  const rect = elements.viewportFrame.getBoundingClientRect();
  const renderTarget = getWebpageRenderDimensions();
  const displayedWidth = Math.max(1, rect.width);
  const displayedHeight = Math.max(1, rect.height);

  // Always draw in the same canonical logical coordinate system for the
  // selected viewport format. Only the backing-buffer density changes
  // with the physical display. This keeps terrain projection, HUD sizing,
  // line thickness, logo placement, and exported framing identical on
  // laptops, ultrawide monitors, HiDPI displays, and standard displays.
  const deviceScale = clamp(
    window.devicePixelRatio || 1,
    PREVIEW_MIN_RENDER_SCALE,
    PREVIEW_MAX_RENDER_SCALE
  );
  const requestedBackingWidth = displayedWidth * deviceScale;
  const requestedBackingHeight = displayedHeight * deviceScale;
  const canonicalScale = Math.max(
    0.01,
    Math.min(
      requestedBackingWidth / renderTarget.width,
      requestedBackingHeight / renderTarget.height,
      1
    )
  );

  const backingWidth = Math.max(
    1,
    Math.round(renderTarget.width * canonicalScale)
  );
  const backingHeight = Math.max(
    1,
    Math.round(renderTarget.height * canonicalScale)
  );

  state.cssWidth = rect.width;
  state.cssHeight = rect.height;
  state.dpr = canonicalScale;

  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
    state.geometryCache = null;
    state.hudLayer = null;
  }

  canvas.style.background = state.backgroundColor;
  markRenderDirty();
}

const MIN_DB_RANGE = 80;
const MAX_ANALYSIS_FRAMES = 3600;
const ANALYSIS_FRAMES_PER_SECOND = 45;
const TERRAIN_ATTACK_MS = 45;
const TERRAIN_RELEASE_MS = 180;
const FREQUENCY_POINT_COUNT = 96;
const FREQUENCY_GRAPH_POINT_COUNT = 128;
const FREQUENCY_GRAPH_MIN_HZ = 20;
const FREQUENCY_GRAPH_MAX_HZ = 20000;
const FREQUENCY_GRAPH_DB_MIN = -25;
const FREQUENCY_GRAPH_DB_MAX = 0;
const FREQUENCY_GRAPH_DB_STEP = 5;

// --- Live-preview supersampling bounds -------------------------------
// The preview backing buffer follows the on-screen size and device pixel
// ratio, but drawing always uses the format's canonical logical canvas.
// These bounds affect preview raster density only, never composition.
const PREVIEW_MIN_RENDER_SCALE = 1.4;
const PREVIEW_MAX_RENDER_SCALE = 2;

function bitReverse(value, bits) {
  let reversed = 0;
  for (let index = 0; index < bits; index += 1) {
    reversed = (reversed << 1) | (value & 1);
    value >>= 1;
  }
  return reversed;
}

function fftMagnitudes(samples) {
  const size = samples.length;
  const levels = Math.log2(size);

  if (!Number.isInteger(levels)) {
    throw new Error("FFT size must be a power of two.");
  }

  const real = new Float32Array(size);
  const imaginary = new Float32Array(size);

  for (let index = 0; index < size; index += 1) {
    const windowValue =
      0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1));
    real[bitReverse(index, levels)] = samples[index] * windowValue;
  }

  for (let blockSize = 2; blockSize <= size; blockSize *= 2) {
    const halfBlock = blockSize / 2;
    const phaseStep = (-2 * Math.PI) / blockSize;

    for (let blockStart = 0; blockStart < size; blockStart += blockSize) {
      for (let offset = 0; offset < halfBlock; offset += 1) {
        const angle = phaseStep * offset;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const evenIndex = blockStart + offset;
        const oddIndex = evenIndex + halfBlock;
        const oddReal =
          real[oddIndex] * cosine - imaginary[oddIndex] * sine;
        const oddImaginary =
          real[oddIndex] * sine + imaginary[oddIndex] * cosine;

        real[oddIndex] = real[evenIndex] - oddReal;
        imaginary[oddIndex] = imaginary[evenIndex] - oddImaginary;
        real[evenIndex] += oddReal;
        imaginary[evenIndex] += oddImaginary;
      }
    }
  }

  const magnitudes = new Float32Array(size / 2 + 1);
  for (let index = 0; index < magnitudes.length; index += 1) {
    magnitudes[index] = Math.hypot(real[index], imaginary[index]);
  }
  return magnitudes;
}

function mixToMono(audioBuffer) {
  const mono = new Float32Array(audioBuffer.length);

  for (
    let channelIndex = 0;
    channelIndex < audioBuffer.numberOfChannels;
    channelIndex += 1
  ) {
    const channel = audioBuffer.getChannelData(channelIndex);
    for (let sampleIndex = 0; sampleIndex < audioBuffer.length; sampleIndex += 1) {
      mono[sampleIndex] += channel[sampleIndex] / audioBuffer.numberOfChannels;
    }
  }

  return mono;
}

function smoothHeightMap(
  data,
  passes = 2,
  frameDurationSeconds = 1 / ANALYSIS_FRAMES_PER_SECOND
) {
  let result = data.map((row) => Float32Array.from(row));

  // Round narrow FFT spikes into broader hills across the frequency axis.
  for (let pass = 0; pass < passes; pass += 1) {
    result = result.map((row) => {
      const next = new Float32Array(row.length);

      for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
        let weightedSum = row[columnIndex] * 6;
        let totalWeight = 6;

        for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
          if (columnOffset === 0) continue;

          const neighborColumn = clamp(
            columnIndex + columnOffset,
            0,
            row.length - 1
          );
          const weight = 1 / (1 + Math.abs(columnOffset) * 0.65);
          weightedSum += row[neighborColumn] * weight;
          totalWeight += weight;
        }

        next[columnIndex] = weightedSum / totalWeight;
      }

      return next;
    });
  }

  if (result.length <= 1) return result;

  // Apply causal attack/release smoothing. Only the current and earlier
  // frames are used, so the terrain becomes fluid without anticipating
  // audio that has not played yet.
  const safeFrameDuration = Math.max(1 / 240, frameDurationSeconds);
  const attackAlpha =
    1 - Math.exp(-safeFrameDuration / (TERRAIN_ATTACK_MS / 1000));
  const releaseAlpha =
    1 - Math.exp(-safeFrameDuration / (TERRAIN_RELEASE_MS / 1000));
  const smoothed = result.map(
    (row) => new Float32Array(row.length)
  );

  smoothed[0].set(result[0]);

  for (let rowIndex = 1; rowIndex < result.length; rowIndex += 1) {
    const source = result[rowIndex];
    const previous = smoothed[rowIndex - 1];
    const destination = smoothed[rowIndex];

    for (let columnIndex = 0; columnIndex < source.length; columnIndex += 1) {
      const alpha =
        source[columnIndex] >= previous[columnIndex]
          ? attackAlpha
          : releaseAlpha;
      destination[columnIndex] =
        previous[columnIndex] +
        (source[columnIndex] - previous[columnIndex]) * alpha;
    }
  }

  return smoothed;
}

function sampleMagnitudeAtFrequency(
  magnitudes,
  frequencyHz,
  sampleRate,
  fftSize
) {
  const maximumBin = magnitudes.length - 1;
  const binPosition = clamp(
    (frequencyHz * fftSize) / sampleRate,
    0,
    maximumBin
  );
  const lowerBin = Math.floor(binPosition);
  const upperBin = Math.min(maximumBin, lowerBin + 1);
  const amount = binPosition - lowerBin;
  return (
    magnitudes[lowerBin] +
    (magnitudes[upperBin] - magnitudes[lowerBin]) * amount
  );
}

function logarithmicFrequencyAtPosition(amount, maximumFrequencyHz) {
  const maximumFrequency = Math.max(
    FREQUENCY_GRAPH_MIN_HZ,
    maximumFrequencyHz
  );
  return (
    FREQUENCY_GRAPH_MIN_HZ *
    Math.pow(
      maximumFrequency / FREQUENCY_GRAPH_MIN_HZ,
      clamp(amount, 0, 1)
    )
  );
}

async function analyzeAudio(audioBuffer, fftSize, options = {}) {
  const onProgress =
    typeof options.onProgress === "function"
      ? options.onProgress
      : null;
  const shouldCancel =
    typeof options.shouldCancel === "function"
      ? options.shouldCancel
      : () => false;
  const yieldInterval =
    fftSize >= 16384 ? 2 : fftSize >= 8192 ? 4 : fftSize >= 4096 ? 8 : 16;
  const reportProgress = (amount, stage) => {
    if (onProgress) onProgress(clamp(amount, 0, 1), stage);
  };
  const assertNotCancelled = () => {
    if (shouldCancel()) {
      throw new DOMException("Audio analysis was superseded.", "AbortError");
    }
  };

  assertNotCancelled();
  reportProgress(0.02, "Preparing frequency analysis…");
  const mono = mixToMono(audioBuffer);
  const halfWindow = fftSize / 2;
  const maximumAnalyzedFrequency = Math.min(
    FREQUENCY_GRAPH_MAX_HZ,
    audioBuffer.sampleRate * 0.5
  );
  const analysisFrameCount = Math.min(
    MAX_ANALYSIS_FRAMES,
    Math.max(
      state.lineCount * 8,
      Math.round(audioBuffer.duration * ANALYSIS_FRAMES_PER_SECOND)
    )
  );

  const rawDb = Array.from(
    { length: analysisFrameCount },
    () => new Float32Array(FREQUENCY_POINT_COUNT)
  );
  const rawFrequencyGraphDb = Array.from(
    { length: analysisFrameCount },
    () => new Float32Array(FREQUENCY_GRAPH_POINT_COUNT)
  );
  let globalMaximumDb = -Infinity;
  let graphMaximumDb = -Infinity;

  for (let timeIndex = 0; timeIndex < analysisFrameCount; timeIndex += 1) {
    const progress =
      analysisFrameCount === 1
        ? 0
        : timeIndex / (analysisFrameCount - 1);
    const centerSample = Math.round(
      progress * Math.max(0, mono.length - 1)
    );
    const frameStart = centerSample - halfWindow;
    const frame = new Float32Array(fftSize);

    for (let sampleOffset = 0; sampleOffset < fftSize; sampleOffset += 1) {
      const sourceIndex = frameStart + sampleOffset;
      frame[sampleOffset] =
        sourceIndex >= 0 && sourceIndex < mono.length
          ? mono[sourceIndex]
          : 0;
    }

    const magnitudes = fftMagnitudes(frame);

    // Sample the terrain across the same logarithmic frequency axis as
    // the top-right graph. Equal horizontal mesh distances now represent
    // equal frequency ratios from 20 Hz through 20 kHz (or Nyquist when
    // the decoded source has a lower maximum frequency).
    for (
      let frequencyIndex = 0;
      frequencyIndex < FREQUENCY_POINT_COUNT;
      frequencyIndex += 1
    ) {
      const amount =
        frequencyIndex / (FREQUENCY_POINT_COUNT - 1);
      const frequencyHz = logarithmicFrequencyAtPosition(
        amount,
        maximumAnalyzedFrequency
      );
      const magnitude = sampleMagnitudeAtFrequency(
        magnitudes,
        frequencyHz,
        audioBuffer.sampleRate,
        fftSize
      );
      const db = 20 * Math.log10(Math.max(magnitude, 1e-12));
      rawDb[timeIndex][frequencyIndex] = db;
      globalMaximumDb = Math.max(globalMaximumDb, db);
    }

    // Build a separate 20 Hz–20 kHz spectrum specifically for the HUD.
    // The points are logarithmically spaced, so equal index distances
    // represent equal frequency ratios (100→200, 1k→2k, etc.).
    for (
      let graphIndex = 0;
      graphIndex < FREQUENCY_GRAPH_POINT_COUNT;
      graphIndex += 1
    ) {
      const amount = graphIndex / (FREQUENCY_GRAPH_POINT_COUNT - 1);
      const frequencyHz = logarithmicFrequencyAtPosition(
        amount,
        maximumAnalyzedFrequency
      );
      const magnitude = sampleMagnitudeAtFrequency(
        magnitudes,
        frequencyHz,
        audioBuffer.sampleRate,
        fftSize
      );
      const db = 20 * Math.log10(Math.max(magnitude, 1e-12));
      rawFrequencyGraphDb[timeIndex][graphIndex] = db;
      graphMaximumDb = Math.max(graphMaximumDb, db);
    }

    const completedFrames = timeIndex + 1;
    if (
      completedFrames === analysisFrameCount ||
      completedFrames % yieldInterval === 0
    ) {
      assertNotCancelled();
      reportProgress(
        0.05 + (completedFrames / analysisFrameCount) * 0.78,
        `Analyzing ${fftSize} FFT · ${Math.round((completedFrames / analysisFrameCount) * 100)}%`
      );
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
  }

  assertNotCancelled();
  reportProgress(0.85, "Normalizing terrain data…");
  const floorDb = globalMaximumDb - MIN_DB_RANGE;
  const normalizedData = rawDb.map((row) => {
    const normalizedRow = new Float32Array(FREQUENCY_POINT_COUNT);

    for (let index = 0; index < FREQUENCY_POINT_COUNT; index += 1) {
      const normalized =
        (row[index] - floorDb) / (globalMaximumDb - floorDb || 1);
      const t = index / (FREQUENCY_POINT_COUNT - 1);
      const edgeFalloff = Math.pow(Math.sin(Math.PI * t), 0.72);
      normalizedRow[index] =
        clamp(normalized, 0, 1) * (0.46 + edgeFalloff * 0.64);
    }

    return normalizedRow;
  });

  const graphDynamicRangeDb =
    FREQUENCY_GRAPH_DB_MAX - FREQUENCY_GRAPH_DB_MIN;
  const graphSilenceThresholdDb = graphMaximumDb - MIN_DB_RANGE;
  const normalizedFrequencyGraph = rawFrequencyGraphDb.map((row) => {
    const normalizedRow = new Float32Array(FREQUENCY_GRAPH_POINT_COUNT);
    let rowPeakDb = -Infinity;
    for (let index = 0; index < row.length; index += 1) {
      rowPeakDb = Math.max(rowPeakDb, row[index]);
    }

    // Peak-normalize every displayed spectrum frame. The strongest
    // frequency becomes 0 dB (1.0), and the bottom of the graph is
    // 25 dB below that peak. Near-silent frames remain flat instead of
    // amplifying the FFT noise floor.
    if (!Number.isFinite(rowPeakDb) || rowPeakDb <= graphSilenceThresholdDb) {
      return normalizedRow;
    }

    const rowFloorDb = rowPeakDb - graphDynamicRangeDb;
    for (let index = 0; index < row.length; index += 1) {
      normalizedRow[index] = clamp(
        (row[index] - rowFloorDb) / graphDynamicRangeDb,
        0,
        1
      );
    }
    return normalizedRow;
  });

  assertNotCancelled();
  reportProgress(0.90, "Smoothing terrain history…");
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  const analysisFrameDuration =
    audioBuffer.duration / Math.max(1, analysisFrameCount - 1);
  const terrain = smoothHeightMap(
    normalizedData,
    4,
    analysisFrameDuration
  );

  assertNotCancelled();
  reportProgress(0.96, "Smoothing frequency graph…");
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  const frequencyGraph = smoothHeightMap(
    normalizedFrequencyGraph,
    1,
    analysisFrameDuration
  );

  assertNotCancelled();
  reportProgress(1, "Audio resolution ready");
  return { terrain, frequencyGraph };
}

function ensureHistoryBuffers() {
  const needsResize =
    state.history.length !== state.lineCount ||
    state.history.some(
      (row) => row.length !== FREQUENCY_POINT_COUNT
    );

  if (needsResize) {
    state.history = Array.from(
      { length: state.lineCount },
      () => new Float32Array(FREQUENCY_POINT_COUNT)
    );
    state.geometryCache = null;
  }
}

function sampleSpectrogramRow(
  data,
  sourcePosition,
  destination,
  fadeAtStart = false
) {
  if (sourcePosition < 0 || !data || data.length === 0) {
    destination.fill(0);
    return;
  }

  const lastIndex = data.length - 1;
  const position = clamp(sourcePosition, 0, lastIndex);
  const index1 = Math.floor(position);
  const index2 = Math.min(lastIndex, index1 + 1);
  const index0 = Math.max(0, index1 - 1);
  const index3 = Math.min(lastIndex, index2 + 1);
  const amount = position - index1;
  const row0 = data[index0];
  const row1 = data[index1];
  const row2 = data[index2];
  const row3 = data[index3];

  const entryFade = fadeAtStart ? clamp(sourcePosition, 0, 1) : 1;
  const easedEntry = entryFade * entryFade * (3 - 2 * entryFade);

  for (let index = 0; index < destination.length; index += 1) {
    destination[index] =
      clamp(
        catmullRom(
          row0[index],
          row1[index],
          row2[index],
          row3[index],
          amount
        ),
        0,
        1
      ) * easedEntry;
  }
}

function sampleAnalyzedRow(sourcePosition, destination) {
  sampleSpectrogramRow(
    state.spectrogramData,
    sourcePosition,
    destination,
    true
  );
}

function updateHistory(force = false) {
  if (!state.hasAudio || !state.analysisReady) {
    if (!state.historyIsFlat || state.history.length !== state.lineCount) {
      resetHistory();
    }
    return;
  }

  if ((audio.paused || audio.ended) && !force) {
    return;
  }

  ensureHistoryBuffers();

  const analysisDuration =
    state.decodedAudioBuffer?.duration || audio.duration;
  const playbackProgress =
    Number.isFinite(analysisDuration) && analysisDuration > 0
      ? clamp(currentPlayheadTime() / analysisDuration, 0, 1)
      : 0;

  const currentFramePosition =
    playbackProgress * (state.spectrogramData.length - 1);
  const firstVisibleFramePosition =
    currentFramePosition - (state.lineCount - 1);

  for (let rowIndex = 0; rowIndex < state.lineCount; rowIndex += 1) {
    sampleAnalyzedRow(
      firstVisibleFramePosition + rowIndex,
      state.history[rowIndex]
    );
  }

  state.historyIsFlat = false;
  markRenderDirty();
}

async function reanalyzeLoadedAudio(requestVersion) {
  if (!state.decodedAudioBuffer) {
    hideFftLoadProgress();
    return;
  }
  if (requestVersion !== state.fftReanalysisVersion) return;

  const version = ++state.analysisVersion;
  state.isAnalyzing = true;
  state.analysisReady = false;
  resetHistory();
  setStatus(`ANALYZING / ${state.fileName.toUpperCase()} / ${state.fftSize} FFT`);
  setFftLoadProgress(5, `Preparing ${state.fftSize} FFT analysis…`);

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  try {
    const analyzed = await analyzeAudio(
      state.decodedAudioBuffer,
      state.fftSize,
      {
        shouldCancel: () =>
          version !== state.analysisVersion ||
          requestVersion !== state.fftReanalysisVersion,
        onProgress: (amount, stage) => {
          if (
            version !== state.analysisVersion ||
            requestVersion !== state.fftReanalysisVersion
          ) return;
          setFftLoadProgress(8 + amount * 88, stage);
        }
      }
    );

    if (
      version !== state.analysisVersion ||
      requestVersion !== state.fftReanalysisVersion
    ) return;

    state.spectrogramData = analyzed.terrain;
    state.frequencySpectrogramData = analyzed.frequencyGraph;
    state.analysisReady = true;
    state.isAnalyzing = false;
    setFftLoadProgress(100, `${state.fftSize} FFT ready`);
    hideFftLoadProgress(900);
    setStatus(
      `${audio.paused ? "READY" : "PLAYING"} / ` +
      `${state.fileName.toUpperCase()} / ${analyzed.terrain.length} ANALYZED FRAMES`
    );
    markRenderDirty();
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.error(error);
    if (
      version !== state.analysisVersion ||
      requestVersion !== state.fftReanalysisVersion
    ) return;

    state.isAnalyzing = false;
    state.analysisReady = false;
    state.spectrogramData = null;
    state.frequencySpectrogramData = null;
    resetHistory();
    setFftLoadProgress(0, "Audio resolution analysis failed");
    hideFftLoadProgress(1600);
    setStatus("ERROR / AUDIO REANALYSIS FAILED");
  }
}

function scheduleReanalysis() {
  window.clearTimeout(state.reanalysisTimer);
  const requestVersion = ++state.fftReanalysisVersion;
  setFftLoadProgress(2, `Queued ${state.fftSize} FFT analysis…`);
  state.reanalysisTimer = window.setTimeout(
    () => reanalyzeLoadedAudio(requestVersion),
    180
  );
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3
    ? clean.split("").map((character) => character + character).join("")
    : clean, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function terrainFillColor(baseColor, averageHeight, lightAmount, opacity) {
  const ambient = 0.42;
  const brightness = clamp(
    ambient + averageHeight * 0.38 + lightAmount * 0.20,
    0.32,
    1
  );

  return `rgba(${Math.round(baseColor.r * brightness)}, ${Math.round(baseColor.g * brightness)}, ${Math.round(baseColor.b * brightness)}, ${opacity})`;
}

function catmullRom(p0, p1, p2, p3, amount) {
  const t2 = amount * amount;
  const t3 = t2 * amount;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * amount +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function sampleHistoryHeight(normalizedX, normalizedY) {
  if (!state.history.length) return 0;

  const rowCount = state.history.length;
  const columnCount = state.history[0]?.length || 0;
  if (!columnCount) return 0;

  const rowPosition = clamp((normalizedY + 1) * 0.5, 0, 1) * (rowCount - 1);
  const columnPosition = clamp((normalizedX + 1) * 0.5, 0, 1) * (columnCount - 1);

  const row1 = Math.floor(rowPosition);
  const row2 = Math.min(rowCount - 1, row1 + 1);
  const row0 = Math.max(0, row1 - 1);
  const row3 = Math.min(rowCount - 1, row2 + 1);
  const rowAmount = rowPosition - row1;

  const column1 = Math.floor(columnPosition);
  const column2 = Math.min(columnCount - 1, column1 + 1);
  const column0 = Math.max(0, column1 - 1);
  const column3 = Math.min(columnCount - 1, column2 + 1);
  const columnAmount = columnPosition - column1;

  function sampleColumn(rowIndex) {
    const row = state.history[rowIndex];
    const v0 = row[column0];
    const v1 = row[column1];
    const v2 = row[column2];
    const v3 = row[column3];
    return catmullRom(v0, v1, v2, v3, columnAmount);
  }

  const c0 = sampleColumn(row0);
  const c1 = sampleColumn(row1);
  const c2 = sampleColumn(row2);
  const c3 = sampleColumn(row3);

  return clamp(catmullRom(c0, c1, c2, c3, rowAmount), 0, 1);
}

function createTerrainProjection(width, height) {
  const isPortrait = state.orientation === "portrait";
  const centerX = width * 0.5;
  const centerY = height * (isPortrait ? 0.375 : 0.42);
  const planeScale = Math.min(
    width * (isPortrait ? 0.34 : 0.29),
    height * (isPortrait ? 0.205 : 0.275)
  ) * state.zoom;
  const heightScale = Math.min(width * 0.19, height * 0.18) *
    state.lineHeight *
    state.zoom;
  const rotationRadians = state.rotation * Math.PI / 180;
  const rotationCosine = Math.cos(rotationRadians);
  const rotationSine = Math.sin(rotationRadians);
  const elevationRadians =
    clamp(state.elevation, 8, 60) * Math.PI / 180;
  const planeVerticalScale =
    Math.sin(elevationRadians) * 0.68;

  function project(x, y, z) {
    const rotatedX = x * rotationCosine - y * rotationSine;
    const rotatedY = x * rotationSine + y * rotationCosine;

    return {
      x: centerX + (rotatedX - rotatedY) * planeScale * 0.64,
      y:
        centerY +
        (rotatedX + rotatedY) * planeScale * planeVerticalScale -
        z * heightScale
    };
  }

  function planarDepth(x, y) {
    const rotatedX = x * rotationCosine - y * rotationSine;
    const rotatedY = x * rotationSine + y * rotationCosine;
    return rotatedX + rotatedY;
  }

  return { project, planarDepth, heightScale };
}

function updateViewportLogoLayout() {
  const logo = elements.viewportLogo;
  if (!logo) return;

  logo.classList.toggle("is-hidden", !state.logoVisible);
  logo.setAttribute("aria-hidden", String(!state.logoVisible));
  logo.style.left = `${state.logoX}%`;
  logo.style.top = `${state.logoY}%`;
  logo.style.right = "";
  logo.style.bottom = "";
  logo.style.width = `${state.logoSize}%`;
  logo.style.maxWidth = "none";
  logo.style.transform = "translate(-50%, -50%)";
}

async function prepareExportLogoImage() {
  if (!state.logoVisible || !elements.viewportLogo) return null;

  const sourceSvg = elements.viewportLogo.querySelector("svg");
  if (!sourceSvg) return null;

  const logoColor = getComputedStyle(elements.viewportLogo).color || state.lineColor;
  const cacheKey = `${logoColor}|${sourceSvg.getAttribute("viewBox") || ""}`;
  if (state.exportLogoImage && state.exportLogoImageKey === cacheKey) {
    return state.exportLogoImage;
  }

  const clone = sourceSvg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1280");
  clone.setAttribute("height", "446");
  clone.querySelectorAll("path, polygon, rect, circle, ellipse").forEach((shape) => {
    shape.setAttribute("fill", logoColor);
    shape.setAttribute("stroke", logoColor);
  });

  const markup = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Viewport logo could not be rasterized."));
      image.src = url;
    });
    state.exportLogoImage = image;
    state.exportLogoImageKey = cacheKey;
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawViewportLogoToCanvas(width, height) {
  const image = state.exportLogoImage;
  if (!state.logoVisible || !image || !image.naturalWidth || !image.naturalHeight) {
    return;
  }

  const drawWidth = width * (state.logoSize / 100);
  const drawHeight = drawWidth * (image.naturalHeight / image.naturalWidth);
  const centerX = width * (state.logoX / 100);
  const centerY = height * (state.logoY / 100);

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.drawImage(
    image,
    centerX - drawWidth / 2,
    centerY - drawHeight / 2,
    drawWidth,
    drawHeight
  );
  ctx.restore();
}

function getHudTextMetrics(width, height) {
  const fontSize = Math.max(6, width * (state.guiTextSize / 100));
  return {
    fontSize,
    lineStep: Math.max(fontSize + 2, fontSize * 1.34),
    x: width * (state.metadataX / 100),
    y: height * (state.metadataY / 100)
  };
}

function getHudGraphLayout(width, height, pad) {
  const graphW = width * (state.graphWidth / 100);
  const graphH = height * (state.graphHeight / 100);
  const graphFontSize = getHudTextMetrics(width, height).fontSize;
  const graphLabelGap = Math.max(4, graphFontSize * 0.55);

  const graphRect = (placement) => {
    const isRight = placement.endsWith("right");
    const isTop = placement.startsWith("top");
    return {
      x: isRight ? width - pad - graphW - 8 : pad + 9,
      y: isTop
        ? pad + graphFontSize + graphLabelGap + 8
        : height - pad - graphH - 9,
      width: graphW,
      height: graphH,
      isRight
    };
  };

  return {
    graphFontSize,
    graphLabelGap,
    frequency: graphRect(state.frequencyGraphPlacement),
    waveform: graphRect(state.waveformGraphPlacement),
    levels: graphRect(state.levelsGraphPlacement)
  };
}

function paintHudStaticLayer(layerCtx, width, height) {
  const alpha = state.opacity / 100;
  const line = hexToRgba(state.lineColor, alpha * 0.72);
  const mesh = hexToRgba(state.meshColor, alpha * 0.58);
  const pad = Math.max(10, Math.min(width, height) * 0.018);

  layerCtx.lineWidth = Math.max(0.5, state.lineWidth * 0.62);
  layerCtx.strokeStyle = line;
  layerCtx.fillStyle = line;
  const hudText = getHudTextMetrics(width, height);
  layerCtx.font = `${hudText.fontSize}px "Cozette", "CozetteVector", monospace`;
  layerCtx.textBaseline = "top";

  layerCtx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  const tickCount = 10;
  for (let i = 0; i <= tickCount; i += 1) {
    const x = pad + ((width - pad * 2) * i) / tickCount;
    layerCtx.beginPath();
    layerCtx.moveTo(x, pad);
    layerCtx.lineTo(x, pad + (i % 5 === 0 ? 7 : 4));
    layerCtx.moveTo(x, height - pad);
    layerCtx.lineTo(x, height - pad - (i % 5 === 0 ? 7 : 4));
    layerCtx.stroke();

    const y = pad + ((height - pad * 2) * i) / tickCount;
    layerCtx.beginPath();
    layerCtx.moveTo(pad, y);
    layerCtx.lineTo(pad + (i % 5 === 0 ? 7 : 4), y);
    layerCtx.moveTo(width - pad, y);
    layerCtx.lineTo(width - pad - (i % 5 === 0 ? 7 : 4), y);
    layerCtx.stroke();
  }

  const metadataX = hudText.x;
  const metadataY = hudText.y;
  const lineStep = hudText.lineStep;
  const fftLabel = `${state.fftSize} FFT`;
  const hudFileName = state.fileName
    ? state.fileName.toUpperCase()
    : "NO AUDIO FILE";
  const maxHudFileLength = state.aspectRatio === "square" ? 30 : 38;
  let displayedHudFileName = hudFileName;
  if (hudFileName.length > maxHudFileLength) {
    const extensionIndex = hudFileName.lastIndexOf(".");
    const extension =
      extensionIndex > 0 ? hudFileName.slice(extensionIndex) : "";
    const availableBaseLength = Math.max(
      4,
      maxHudFileLength - extension.length - 1
    );
    displayedHudFileName =
      `${hudFileName.slice(0, availableBaseLength)}…${extension}`;
  }
  const staticLines = [
    [0, "SYS/BINARY TOWER"],
    [1, displayedHudFileName],
    [3, `VIEW:${state.orientation === "portrait" ? "PORTRAIT" : state.aspectRatio.toUpperCase()}`],
    [5, `MESH ${state.lineCount} / ${fftLabel}`],
    [6, `GAIN VIS ${state.lineHeight.toFixed(2)}x`]
  ];
  staticLines.forEach(([index, text]) => {
    layerCtx.fillText(text, metadataX, metadataY + index * lineStep);
  });

  // Crosshair
  const crossX = width * 0.23;
  const crossY = height * 0.19;
  const crossSize = Math.max(5, width * 0.012);
  layerCtx.strokeStyle = mesh;
  layerCtx.beginPath();
  layerCtx.moveTo(crossX - crossSize, crossY);
  layerCtx.lineTo(crossX + crossSize, crossY);
  layerCtx.moveTo(crossX, crossY - crossSize);
  layerCtx.lineTo(crossX, crossY + crossSize);
  layerCtx.stroke();

  // Audio graph frames and grid chrome are static; live audio traces are
  // drawn over them every rendered frame. Their placement, dimensions,
  // and label scale are controlled from the GUI section.
  const graphLayout = getHudGraphLayout(width, height, pad);
  const { graphFontSize, graphLabelGap } = graphLayout;
  const frequencyRect = graphLayout.frequency;
  const waveformRect = graphLayout.waveform;
  const levelsRect = graphLayout.levels;

  // Graph panels are always fully opaque and use the exact viewport
  // background color, independent of the global visualization opacity.
  layerCtx.save();
  layerCtx.fillStyle = state.backgroundColor;
  layerCtx.fillRect(
    frequencyRect.x,
    frequencyRect.y,
    frequencyRect.width,
    frequencyRect.height
  );
  layerCtx.fillRect(
    waveformRect.x,
    waveformRect.y,
    waveformRect.width,
    waveformRect.height
  );
  layerCtx.fillRect(
    levelsRect.x,
    levelsRect.y,
    levelsRect.width,
    levelsRect.height
  );
  layerCtx.restore();

  const drawGraphLabel = (text, rect) => {
    layerCtx.save();
    layerCtx.font = `${graphFontSize}px "Cozette", "CozetteVector", monospace`;
    layerCtx.fillStyle = line;
    layerCtx.textBaseline = "top";
    layerCtx.textAlign = rect.isRight ? "right" : "left";
    layerCtx.fillText(
      text,
      rect.isRight ? rect.x + rect.width : rect.x,
      rect.y - graphFontSize - graphLabelGap
    );
    layerCtx.restore();
  };

  drawGraphLabel("FR Magnitude dB V/V", frequencyRect);
  layerCtx.strokeStyle = line;
  layerCtx.strokeRect(
    frequencyRect.x,
    frequencyRect.y,
    frequencyRect.width,
    frequencyRect.height
  );

  // Logarithmic 20 Hz–20 kHz frequency grid. Powers of ten are
  // emphasized; the 2–9 multiples within each decade compress toward
  // the next decade exactly as they do on a conventional log axis.
  const frequencyToX = (frequencyHz) => {
    const normalized =
      Math.log10(frequencyHz / FREQUENCY_GRAPH_MIN_HZ) /
      Math.log10(
        FREQUENCY_GRAPH_MAX_HZ / FREQUENCY_GRAPH_MIN_HZ
      );
    return frequencyRect.x + normalized * frequencyRect.width;
  };

  layerCtx.save();
  layerCtx.lineWidth = Math.max(0.3, state.lineWidth * 0.3);
  for (let decade = 10; decade <= 10000; decade *= 10) {
    for (let multiple = 2; multiple <= 9; multiple += 1) {
      const frequencyHz = decade * multiple;
      if (
        frequencyHz <= FREQUENCY_GRAPH_MIN_HZ ||
        frequencyHz >= FREQUENCY_GRAPH_MAX_HZ
      ) {
        continue;
      }
      const x = frequencyToX(frequencyHz);
      layerCtx.strokeStyle = hexToRgba(
        state.lineColor,
        alpha * 0.105
      );
      layerCtx.beginPath();
      layerCtx.moveTo(x, frequencyRect.y);
      layerCtx.lineTo(x, frequencyRect.y + frequencyRect.height);
      layerCtx.stroke();
    }
  }

  layerCtx.lineWidth = Math.max(0.45, state.lineWidth * 0.42);
  for (const frequencyHz of [100, 1000, 10000]) {
    const x = frequencyToX(frequencyHz);
    layerCtx.strokeStyle = hexToRgba(
      state.lineColor,
      alpha * 0.28
    );
    layerCtx.beginPath();
    layerCtx.moveTo(x, frequencyRect.y);
    layerCtx.lineTo(x, frequencyRect.y + frequencyRect.height);
    layerCtx.stroke();
  }

  // Linear, peak-normalized decibel axis. The display spans -25 dB to
  // 0 dB relative to the strongest frequency in the current frame, with
  // equal 5 dB intervals.
  layerCtx.lineWidth = Math.max(0.35, state.lineWidth * 0.34);
  layerCtx.strokeStyle = hexToRgba(state.lineColor, alpha * 0.22);
  for (
    let db = FREQUENCY_GRAPH_DB_MIN + FREQUENCY_GRAPH_DB_STEP;
    db < FREQUENCY_GRAPH_DB_MAX;
    db += FREQUENCY_GRAPH_DB_STEP
  ) {
    const normalized =
      (db - FREQUENCY_GRAPH_DB_MIN) /
      (FREQUENCY_GRAPH_DB_MAX - FREQUENCY_GRAPH_DB_MIN);
    const y =
      frequencyRect.y +
      frequencyRect.height * (1 - normalized);
    layerCtx.beginPath();
    layerCtx.moveTo(frequencyRect.x, y);
    layerCtx.lineTo(frequencyRect.x + frequencyRect.width, y);
    layerCtx.stroke();
  }
  layerCtx.restore();

  drawGraphLabel("WAVEFORM", waveformRect);
  layerCtx.strokeStyle = line;
  layerCtx.strokeRect(
    waveformRect.x,
    waveformRect.y,
    waveformRect.width,
    waveformRect.height
  );

  layerCtx.save();
  layerCtx.strokeStyle = hexToRgba(state.lineColor, alpha * 0.22);
  layerCtx.lineWidth = Math.max(0.35, state.lineWidth * 0.34);
  for (let index = 1; index < 4; index += 1) {
    const x = waveformRect.x + (waveformRect.width * index) / 4;
    layerCtx.beginPath();
    layerCtx.moveTo(x, waveformRect.y + 3);
    layerCtx.lineTo(x, waveformRect.y + waveformRect.height - 3);
    layerCtx.stroke();
  }
  layerCtx.restore();

  drawGraphLabel("LEVELS dBFS", levelsRect);
  layerCtx.strokeStyle = line;
  layerCtx.strokeRect(
    levelsRect.x,
    levelsRect.y,
    levelsRect.width,
    levelsRect.height
  );

  layerCtx.save();
  layerCtx.strokeStyle = hexToRgba(state.lineColor, alpha * 0.22);
  layerCtx.lineWidth = Math.max(0.35, state.lineWidth * 0.34);
  for (let index = 1; index < 4; index += 1) {
    const x = levelsRect.x + (levelsRect.width * index) / 4;
    layerCtx.beginPath();
    layerCtx.moveTo(x, levelsRect.y + 3);
    layerCtx.lineTo(x, levelsRect.y + levelsRect.height - 3);
    layerCtx.stroke();
  }
  layerCtx.restore();
}

function ensureHudStaticLayer(width, height) {
  const deviceWidth = canvas.width;
  const deviceHeight = canvas.height;
  const key = [
    deviceWidth,
    deviceHeight,
    state.dpr.toFixed(4),
    state.lineColor,
    state.meshColor,
    state.backgroundColor,
    state.opacity,
    state.lineWidth,
    state.orientation,
    state.aspectRatio,
    state.fileName,
    state.lineCount,
    state.fftSize,
    state.lineHeight.toFixed(2),
    state.frequencyGraphPlacement,
    state.waveformGraphPlacement,
    state.levelsGraphPlacement,
    state.graphWidth.toFixed(2),
    state.graphHeight.toFixed(2),
    state.metadataX.toFixed(2),
    state.metadataY.toFixed(2),
    state.guiTextSize.toFixed(2)
  ].join("|");

  let layer = state.hudLayer;
  if (layer && layer.key === key) {
    return layer;
  }

  if (!layer) {
    layer = { canvas: document.createElement("canvas"), key: "" };
  }
  if (
    layer.canvas.width !== deviceWidth ||
    layer.canvas.height !== deviceHeight
  ) {
    layer.canvas.width = deviceWidth;
    layer.canvas.height = deviceHeight;
  }

  const layerCtx = layer.canvas.getContext("2d");
  layerCtx.setTransform(1, 0, 0, 1, 0, 0);
  layerCtx.clearRect(0, 0, deviceWidth, deviceHeight);
  layerCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  layerCtx.save();
  paintHudStaticLayer(layerCtx, width, height);
  layerCtx.restore();

  layer.key = key;
  state.hudLayer = layer;
  return layer;
}

function ensureHudAudioBuffers() {
  // The video exporter intentionally clears the smoothed spectrum cache
  // when switching canvas resolution. Recreate each cache independently:
  // the raw spectrum buffer can still exist while the smoothed buffer is
  // null, and indexing that null buffer caused the export-time "reading
  // '0'" failure.
  if (
    !state.hudSpectrumBuffer ||
    state.hudSpectrumBuffer.length !== FREQUENCY_GRAPH_POINT_COUNT
  ) {
    state.hudSpectrumBuffer =
      new Float32Array(FREQUENCY_GRAPH_POINT_COUNT);
  }

  if (
    !state.hudSpectrumSmoothed ||
    state.hudSpectrumSmoothed.length !== FREQUENCY_GRAPH_POINT_COUNT
  ) {
    state.hudSpectrumSmoothed =
      new Float32Array(FREQUENCY_GRAPH_POINT_COUNT);
  }

  if (
    !state.hudWaveformBuffer ||
    state.hudWaveformBuffer.length !== 128
  ) {
    state.hudWaveformBuffer = new Float32Array(128);
  }
}

function getHudSpectrumData() {
  ensureHudAudioBuffers();
  const source = state.hudSpectrumBuffer;
  const smoothed = state.hudSpectrumSmoothed;

  if (
    !state.analysisReady ||
    !state.frequencySpectrogramData ||
    state.frequencySpectrogramData.length === 0
  ) {
    source.fill(0);
    smoothed.fill(0);
    return smoothed;
  }

  const analysisDuration =
    state.decodedAudioBuffer?.duration || audio.duration;
  const playbackProgress =
    Number.isFinite(analysisDuration) && analysisDuration > 0
      ? clamp(currentPlayheadTime() / analysisDuration, 0, 1)
      : 0;
  const sourcePosition =
    playbackProgress * (state.frequencySpectrogramData.length - 1);
  sampleSpectrogramRow(
    state.frequencySpectrogramData,
    sourcePosition,
    source
  );

  // Normalize after temporal interpolation so the displayed graph always
  // uses the full 0–1 range while preserving the frequency-to-frequency
  // magnitude relationships inside the current frame.
  let sourcePeak = 0;
  for (let index = 0; index < source.length; index += 1) {
    sourcePeak = Math.max(sourcePeak, source[index]);
  }
  if (sourcePeak > 1e-5) {
    for (let index = 0; index < source.length; index += 1) {
      source[index] /= sourcePeak;
    }
  } else {
    source.fill(0);
  }

  // Smooth the display trace without delaying the terrain analysis.
  const smoothing = audio.paused ? 1 : 0.72;
  for (let index = 0; index < source.length; index += 1) {
    smoothed[index] +=
      (source[index] - smoothed[index]) * smoothing;
  }

  let smoothedPeak = 0;
  for (let index = 0; index < smoothed.length; index += 1) {
    smoothedPeak = Math.max(smoothedPeak, smoothed[index]);
  }
  if (smoothedPeak > 1e-5) {
    for (let index = 0; index < smoothed.length; index += 1) {
      smoothed[index] /= smoothedPeak;
    }
  }

  return smoothed;
}

function getHudWaveformData() {
  ensureHudAudioBuffers();
  const destination = state.hudWaveformBuffer;
  const audioBuffer = state.decodedAudioBuffer;

  if (!audioBuffer || audioBuffer.length === 0) {
    destination.fill(0);
    return destination;
  }

  const sampleRate = audioBuffer.sampleRate;
  const centerSample = Math.round(
    clamp(currentPlayheadTime(), 0, audioBuffer.duration) * sampleRate
  );
  const windowSamples = Math.min(
    audioBuffer.length,
    Math.max(256, Math.round(sampleRate * 0.12))
  );
  const maximumStart = Math.max(0, audioBuffer.length - windowSamples);
  const startSample = clamp(
    centerSample - Math.floor(windowSamples * 0.5),
    0,
    maximumStart
  );
  const channelCount = audioBuffer.numberOfChannels;
  const samplesPerPoint = windowSamples / destination.length;

  for (let pointIndex = 0; pointIndex < destination.length; pointIndex += 1) {
    const pointStart = Math.floor(
      startSample + pointIndex * samplesPerPoint
    );
    const pointEnd = Math.min(
      audioBuffer.length,
      Math.max(pointStart + 1, Math.floor(
        startSample + (pointIndex + 1) * samplesPerPoint
      ))
    );
    const sampleStep = Math.max(
      1,
      Math.floor((pointEnd - pointStart) / 10)
    );
    let strongestSample = 0;

    for (
      let sampleIndex = pointStart;
      sampleIndex < pointEnd;
      sampleIndex += sampleStep
    ) {
      let mixedSample = 0;
      for (
        let channelIndex = 0;
        channelIndex < channelCount;
        channelIndex += 1
      ) {
        mixedSample +=
          audioBuffer.getChannelData(channelIndex)[sampleIndex] /
          channelCount;
      }

      if (Math.abs(mixedSample) > Math.abs(strongestSample)) {
        strongestSample = mixedSample;
      }
    }

    destination[pointIndex] = clamp(strongestSample, -1, 1);
  }

  return destination;
}

function getHudLevelData() {
  const level =
    state.hudLevel ||
    (state.hudLevel = { peak: 0, rms: 0, peakHold: 0 });
  const audioBuffer = state.decodedAudioBuffer;

  if (!audioBuffer || audioBuffer.length === 0 || !state.hasAudio) {
    level.peak += (0 - level.peak) * 0.2;
    level.rms += (0 - level.rms) * 0.2;
    level.peakHold = Math.max(0, level.peakHold - 0.01);
    return level;
  }

  const sampleRate = audioBuffer.sampleRate;
  const centerSample = Math.round(
    clamp(currentPlayheadTime(), 0, audioBuffer.duration) * sampleRate
  );
  const windowSamples = Math.min(
    audioBuffer.length,
    Math.max(256, Math.round(sampleRate * 0.08))
  );
  const startSample = clamp(
    centerSample - (windowSamples >> 1),
    0,
    Math.max(0, audioBuffer.length - windowSamples)
  );
  const channelCount = audioBuffer.numberOfChannels;
  // Cap the per-frame sample count regardless of sample rate.
  const step = Math.max(1, Math.floor(windowSamples / 1024));

  let peak = 0;
  let sumSquares = 0;
  let counted = 0;
  for (
    let sampleIndex = startSample;
    sampleIndex < startSample + windowSamples;
    sampleIndex += step
  ) {
    let mixed = 0;
    for (
      let channelIndex = 0;
      channelIndex < channelCount;
      channelIndex += 1
    ) {
      mixed +=
        audioBuffer.getChannelData(channelIndex)[sampleIndex] /
        channelCount;
    }
    const magnitude = Math.abs(mixed);
    if (magnitude > peak) peak = magnitude;
    sumSquares += mixed * mixed;
    counted += 1;
  }

  const rms = counted > 0 ? Math.sqrt(sumSquares / counted) : 0;
  const paused = audio.paused;

  // Fast attack, slower release so the meter reads transients but settles.
  level.peak +=
    (peak - level.peak) * (paused ? 1 : peak > level.peak ? 0.6 : 0.25);
  level.rms += (rms - level.rms) * (paused ? 1 : 0.3);

  if (peak >= level.peakHold) {
    level.peakHold = peak;
  } else if (!paused) {
    level.peakHold = Math.max(level.peak, level.peakHold - 0.012);
  }

  return level;
}

function drawFrameDetails(width, height) {
  const alpha = state.opacity / 100;
  const line = hexToRgba(state.lineColor, alpha * 0.72);
  const mesh = hexToRgba(state.meshColor, alpha * 0.58);
  const pad = Math.max(10, Math.min(width, height) * 0.018);

  // The static chrome (border, ticks, crosshair, panel frames, fixed
  // labels) is cached to an offscreen layer and blitted 1:1 at device
  // resolution, so it is pixel-identical to drawing it live but only
  // re-rendered when size / colour / settings actually change.
  const layer = ensureHudStaticLayer(width, height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer.canvas, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = line;
  ctx.strokeStyle = line;
  const hudText = getHudTextMetrics(width, height);
  ctx.font = `${hudText.fontSize}px "Cozette", "CozetteVector", monospace`;
  ctx.textBaseline = "top";

  // Live readouts (status + FPS) use the same position and font size as
  // every other viewport GUI label.
  const metadataX = hudText.x;
  const metadataY = hudText.y;
  const lineStep = hudText.lineStep;
  const status = state.hasAudio
    ? (audio.paused ? "PAUSED" : "PLAYING")
    : "IDLE";
  const modeStatus = state.isExportingVideo ? "PLAYING" : status;
  ctx.fillText(`MODE:${modeStatus}`, metadataX, metadataY + 2 * lineStep);
  const metadataFrameRate = state.exportFrameRateOverride ?? state.fpsValue;
  ctx.fillText(
    `FPS ${Math.round(metadataFrameRate)}`,
    metadataX,
    metadataY + 7 * lineStep
  );

  ctx.lineWidth = Math.max(0.5, state.lineWidth * 0.62);
  ctx.strokeStyle = mesh;

  const graphLayout = getHudGraphLayout(width, height, pad);
  const frequencyRect = graphLayout.frequency;
  const waveformRect = graphLayout.waveform;

  // Functional frequency-spectrum graph derived from the analyzed FFT
  // frame at the current audio playhead. The trace and fill use the full
  // graph rectangle with no inner padding.
  const spectrum = getHudSpectrumData();

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    frequencyRect.x,
    frequencyRect.y,
    frequencyRect.width,
    frequencyRect.height
  );
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(
    frequencyRect.x,
    frequencyRect.y + frequencyRect.height
  );
  for (let index = 0; index < spectrum.length; index += 1) {
    // Spectrum samples are precomputed at equal logarithmic frequency
    // ratios from 20 Hz through 20 kHz, so equal index spacing maps
    // directly to the graph's logarithmic horizontal coordinate.
    const amount = index / Math.max(1, spectrum.length - 1);
    const value = clamp(spectrum[index], 0, 1);
    const x = frequencyRect.x + amount * frequencyRect.width;
    const y =
      frequencyRect.y +
      frequencyRect.height -
      value * frequencyRect.height;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(
    frequencyRect.x + frequencyRect.width,
    frequencyRect.y + frequencyRect.height
  );
  ctx.closePath();
  ctx.fillStyle = hexToRgba(state.lineColor, alpha * 0.19);
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.65, state.lineWidth * 0.72);
  ctx.stroke();
  ctx.restore();

  // Functional waveform graph sampled from the decoded audio around the
  // current playhead position.
  const waveformX = waveformRect.x;
  const waveformY = waveformRect.y + 3;
  const waveformW = waveformRect.width;
  const waveformH = waveformRect.height - 6;
  const waveformMidY = waveformY + waveformH * 0.5;
  const waveform = getHudWaveformData();

  ctx.beginPath();
  for (let index = 0; index < waveform.length; index += 1) {
    const amount = index / Math.max(1, waveform.length - 1);
    const x = waveformX + amount * waveformW;
    const y = waveformMidY - waveform[index] * waveformH * 0.44;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.65, state.lineWidth * 0.72);
  ctx.stroke();

  drawLevelsGraphLive(graphLayout.levels, graphLayout.graphFontSize, alpha, line);

  ctx.restore();
}

// Live content for the Levels graph: peak + RMS meter bars in the HUD
// accent colour with a peak-hold tick. The frame, label, opaque
// background and guide lines are part of the cached static HUD layer, so
// this matches how the Frequency and Waveform graphs render.
function drawLevelsGraphLive(rect, graphFontSize, alpha, line) {
  const level = getHudLevelData();

  const innerPad = Math.max(2, rect.height * 0.16);
  const top = rect.y + innerPad;
  const usableH = rect.height - innerPad * 2;
  const rowGap = Math.max(2, usableH * 0.16);
  const rowH = (usableH - rowGap) / 2;
  const meterFont = Math.max(5, graphFontSize * 0.82);
  const leftPad = Math.max(3, rect.width * 0.02);
  const labelW = Math.max(14, meterFont * 2.6);
  const labelX = rect.x + leftPad;
  const meterX = labelX + labelW;
  const meterW = rect.x + rect.width - meterX - leftPad;

  ctx.save();
  ctx.font = `${meterFont}px "Cozette", "CozetteVector", monospace`;
  ctx.textBaseline = "middle";

  const drawMeterRow = (rowIndex, label, value, hold) => {
    const rowY = top + rowIndex * (rowH + rowGap);
    const midY = rowY + rowH * 0.5;

    ctx.textAlign = "left";
    ctx.fillStyle = line;
    ctx.fillText(label, labelX, midY);

    if (meterW > 0) {
      const filled = clamp(value, 0, 1) * meterW;
      ctx.fillStyle = hexToRgba(state.lineColor, alpha * 0.82);
      ctx.fillRect(meterX, rowY, filled, rowH);

      if (hold != null) {
        const holdX = meterX + clamp(hold, 0, 1) * meterW;
        ctx.fillStyle = line;
        ctx.fillRect(
          clamp(holdX - 0.75, meterX, meterX + meterW - 1.5),
          rowY,
          1.5,
          rowH
        );
      }
    }
  };

  drawMeterRow(0, "PK", level.peak, level.peakHold);
  drawMeterRow(1, "RMS", level.rms, null);

  ctx.restore();
}

function opaqueSurfaceColor(backgroundHex, meshHex, averageHeight, lightAmount, side = false) {
  const background = hexToRgb(backgroundHex);
  const mesh = hexToRgb(meshHex);
  const tint = side
    ? clamp(0.10 + averageHeight * 0.10 + lightAmount * 0.05, 0.08, 0.24)
    : clamp(0.12 + averageHeight * 0.15 + lightAmount * 0.08, 0.10, 0.34);
  const shade = side ? 0.76 : 0.94;

  const r = Math.round((background.r * (1 - tint) + mesh.r * tint) * shade);
  const g = Math.round((background.g * (1 - tint) + mesh.g * tint) * shade);
  const b = Math.round((background.b * (1 - tint) + mesh.b * tint) * shade);
  return `rgb(${clamp(r, 0, 255)}, ${clamp(g, 0, 255)}, ${clamp(b, 0, 255)})`;
}

function getSurfacePalette() {
  const key = `${state.backgroundColor}|${state.meshColor}`;
  if (state.surfacePaletteCache?.key === key) {
    return state.surfacePaletteCache.colors;
  }

  const averageSteps = 32;
  const lightSteps = 16;
  const colors = new Array(averageSteps * lightSteps);

  for (let averageIndex = 0; averageIndex < averageSteps; averageIndex += 1) {
    const averageHeight = averageIndex / (averageSteps - 1);

    for (let lightIndex = 0; lightIndex < lightSteps; lightIndex += 1) {
      const lightAmount = lightIndex / (lightSteps - 1);
      colors[averageIndex * lightSteps + lightIndex] =
        opaqueSurfaceColor(
          state.backgroundColor,
          state.meshColor,
          averageHeight,
          lightAmount,
          false
        );
    }
  }

  state.surfacePaletteCache = {
    key,
    colors,
    averageSteps,
    lightSteps
  };
  return colors;
}

function buildAxisSamples(count, sourceCount) {
  const samples = new Array(count);

  for (let index = 0; index < count; index += 1) {
    const position =
      (index / Math.max(1, count - 1)) * (sourceCount - 1);
    const index1 = Math.floor(position);
    const index2 = Math.min(sourceCount - 1, index1 + 1);
    samples[index] = {
      index0: Math.max(0, index1 - 1),
      index1,
      index2,
      index3: Math.min(sourceCount - 1, index2 + 1),
      amount: position - index1
    };
  }

  return samples;
}

function samplePreparedHeight(xSample, ySample) {
  // The analyzed spectrogram is already heavily smoothed. Bilinear
  // interpolation preserves that appearance while reducing each height
  // lookup from sixteen source samples to four.
  const row1 = state.history[ySample.index1];
  const row2 = state.history[ySample.index2];
  const top =
    row1[xSample.index1] +
    (row1[xSample.index2] - row1[xSample.index1]) * xSample.amount;
  const bottom =
    row2[xSample.index1] +
    (row2[xSample.index2] - row2[xSample.index1]) * xSample.amount;

  return clamp(
    top + (bottom - top) * ySample.amount,
    0,
    1
  );
}

function getVisibleSideEdges(project) {
  const corners = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 }
  ];
  const projectedCorners = corners.map((corner) => project(corner.x, corner.y, 0));
  let nearestCornerIndex = 0;

  for (let index = 1; index < projectedCorners.length; index += 1) {
    if (projectedCorners[index].y > projectedCorners[nearestCornerIndex].y) {
      nearestCornerIndex = index;
    }
  }

  const previousIndex = (nearestCornerIndex + corners.length - 1) % corners.length;
  const nextIndex = (nearestCornerIndex + 1) % corners.length;

  return [
    { start: corners[previousIndex], end: corners[nearestCornerIndex] },
    { start: corners[nearestCornerIndex], end: corners[nextIndex] }
  ];
}

function sampleEdge(edge, amount) {
  return {
    x: edge.start.x + (edge.end.x - edge.start.x) * amount,
    y: edge.start.y + (edge.end.y - edge.start.y) * amount
  };
}

function getStableBinaryLaneIdentity(edge, worldPoint, laneCount) {
  const isVerticalEdge =
    Math.abs(edge.start.x - edge.end.x) < 1e-6;
  const fixedCoordinate = isVerticalEdge
    ? edge.start.x
    : edge.start.y;
  const laneCoordinate = isVerticalEdge
    ? worldPoint.y
    : worldPoint.x;
  const canonicalLaneIndex = Math.round(
    clamp((laneCoordinate + 1) * 0.5, 0, 1) *
    Math.max(1, laneCount - 1)
  );
  const faceKey =
    `${isVerticalEdge ? "x" : "y"}:${fixedCoordinate > 0 ? 1 : -1}`;

  let faceSeed;
  if (isVerticalEdge) {
    faceSeed = fixedCoordinate > 0 ? 2 : 1;
  } else {
    faceSeed = fixedCoordinate > 0 ? 4 : 3;
  }

  return {
    faceKey,
    faceSeed,
    canonicalLaneIndex
  };
}

function isRemovedTopEdge(edge) {
  // Remove the two left/right perimeter rails shown as the unwanted
  // crosswise top-square edges in the reference orientation.
  return Math.abs(edge.start.x - edge.end.x) < 1e-6;
}

function traceSmoothPolyline(points) {
  if (!points.length) return;

  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }
}

function stableBinaryUnit(faceSeed, laneIndex, sequenceIndex) {
  const value = Math.sin(
    faceSeed * 91.731 +
    laneIndex * 37.117 +
    sequenceIndex * 12.9898
  ) * 43758.5453123;
  return value - Math.floor(value);
}

function isBaselineBinaryDeleted(
  faceSeed,
  laneIndex,
  sequenceIndex,
  normalizedDepth
) {
  if (state.binaryDeletion <= 0 || sequenceIndex < 0) return false;

  // Give every face a deterministic deletion mask before it rotates into
  // view. Deletion Amount controls its density; Deletion Speed continues
  // to add permanent animated deletions after the face is visible.
  const depthWeight = 0.18 + Math.pow(normalizedDepth, 1.3) * 0.82;
  const probability = clamp(
    (state.binaryDeletion / 100) * depthWeight,
    0,
    0.94
  );

  return stableBinaryUnit(faceSeed, laneIndex, sequenceIndex) < probability;
}

function drawTerrainSideFaceMasks(height, project, visibleEdges, edgeSamples) {
  const bottomY = height - 1;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = state.backgroundColor;

  for (const edge of visibleEdges) {
    const edgePoints = [];

    for (let index = 0; index < edgeSamples; index += 1) {
      const amount = index / Math.max(1, edgeSamples - 1);
      const worldPoint = sampleEdge(edge, amount);
      edgePoints.push(project(
        worldPoint.x,
        worldPoint.y,
        sampleHistoryHeight(worldPoint.x, worldPoint.y)
      ));
    }

    if (edgePoints.length < 2) continue;

    // Paint an opaque vertical face beneath the sampled terrain edge.
    // This removes top-mesh and perimeter strokes from the gaps between
    // binary glyphs while leaving the terrain surface itself untouched.
    ctx.beginPath();
    ctx.moveTo(edgePoints[0].x, edgePoints[0].y);

    for (let index = 1; index < edgePoints.length; index += 1) {
      ctx.lineTo(edgePoints[index].x, edgePoints[index].y);
    }

    ctx.lineTo(edgePoints[edgePoints.length - 1].x, bottomY);
    ctx.lineTo(edgePoints[0].x, bottomY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawTerrainSideWalls(width, height, project) {
  const alpha = state.opacity / 100;
  const visibleEdges = getVisibleSideEdges(project);
  const bottomY = height - 1;
  const laneCount = Math.max(1, Math.round(state.binaryCount));
  const fontSize = Math.max(
    3,
    state.binaryFontSize * state.zoom
  );
  const rowGap = fontSize * 1.18;
  const numberStartOffset =
    state.binaryNumberOffset * state.zoom;

  ctx.save();
  ctx.font = `${fontSize}px "Cozette", "CozetteVector", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = state.lineColor;

  for (let edgeIndex = 0; edgeIndex < visibleEdges.length; edgeIndex += 1) {
    const edge = visibleEdges[edgeIndex];

    // The selected number of leading digits is distributed along each visible top edge.
    for (let laneIndex = 0; laneIndex < laneCount; laneIndex += 1) {
      const amount = laneIndex / Math.max(1, laneCount - 1);
      const worldPoint = sampleEdge(edge, amount);
      const {
        faceKey,
        faceSeed,
        canonicalLaneIndex
      } = getStableBinaryLaneIdentity(
        edge,
        worldPoint,
        laneCount
      );
      const energy = sampleHistoryHeight(worldPoint.x, worldPoint.y);
      const topPoint = project(worldPoint.x, worldPoint.y, energy);

      // Anchor every binary lane to the same zero-height screen position.
      // Audio can raise the terrain edge above this origin, but it never
      // shifts any already-visible digit upward. Instead, additional
      // negative-index rows become visible in the newly exposed space.
      const streamOrigin = project(worldPoint.x, worldPoint.y, 0);
      const numberStartY = Math.min(
        bottomY,
        topPoint.y + numberStartOffset
      );
      const columnHeight = Math.max(
        rowGap,
        bottomY - numberStartY
      );
      const baseColumnHeight = Math.max(
        rowGap * 3,
        bottomY - streamOrigin.y
      );
      const baseRowCount = Math.ceil(baseColumnHeight / rowGap) + 2;
      const normalizedLane =
        canonicalLaneIndex / Math.max(1, laneCount - 1);

      // Lanes move at slightly different rates so the streams cascade
      // rather than forming synchronized horizontal rows.
      const dropsPerSecond =
        2.85 +
        normalizedLane * 0.24 +
        Math.abs(
          Math.sin(canonicalLaneIndex * 2.17 + faceSeed * 4.31)
        ) * 0.34;
      const lanePosition =
        state.binaryStreamTime * dropsPerSecond;
      const completedSteps = Math.floor(lanePosition);
      const phase = (lanePosition - completedSteps) * rowGap;
      // Derive the first generated row from the signed start position.
      // Positive values begin below the edge; negative values expose
      // additional rows above it while preserving the stream cadence.
      const firstRowIndex =
        Math.floor(
          (numberStartY - streamOrigin.y - phase) / rowGap
        ) - 1;
      const lastRowIndex = Math.min(
        baseRowCount - 1,
        completedSteps
      );

      for (
        let rowIndex = firstRowIndex;
        rowIndex <= lastRowIndex;
        rowIndex += 1
      ) {
        const sequenceIndex = completedSteps - rowIndex;
        const glyphSeed = Math.abs(
          Math.sin(
            sequenceIndex * 13.37 +
            canonicalLaneIndex * 7.17 +
            faceSeed * 5.31
          )
        );
        const glyph = glyphSeed > 0.5 ? "1" : "0";

        // Keep each binary stream locked to the zero-height lane
        // origin. Audio only exposes additional rows above it.
        const x = streamOrigin.x;
        const y =
          streamOrigin.y +
          rowIndex * rowGap +
          phase;

        if (y < numberStartY || y >= bottomY) continue;

        // The leading and newly exposed rows are always retained.
        // Lower digits can be permanently deleted, with the deletion
        // rate accelerating sharply near the bottom.
        const deletionKey =
          `${faceKey}:${canonicalLaneIndex}:${sequenceIndex}`;
        const normalizedDepth = clamp(
          Math.max(0, y - numberStartY) /
            Math.max(rowGap, columnHeight),
          0,
          1
        );

        const baselineDeleted =
          rowIndex > 0 &&
          isBaselineBinaryDeleted(
            faceSeed,
            canonicalLaneIndex,
            sequenceIndex,
            normalizedDepth
          );

        if (
          rowIndex > 0 &&
          !baselineDeleted &&
          !state.binaryDeletedNumbers.has(deletionKey) &&
          state.binaryDeletionFrameDelta > 0 &&
          state.binaryDeletion > 0 &&
          state.binaryDeletionSpeed > 0
        ) {
          const bottomAcceleration =
            0.04 + Math.pow(normalizedDepth, 2.35) * 5.75;
          const deletionsPerSecond =
            bottomAcceleration *
            (state.binaryDeletion / 100) *
            state.binaryDeletionSpeed;
          const deletionChance =
            1 -
            Math.exp(
              -deletionsPerSecond *
              state.binaryDeletionFrameDelta
            );

          if (Math.random() < deletionChance) {
            const maximumCluster =
              1 + Math.floor(Math.pow(normalizedDepth, 1.65) * 4);
            const clusterSize =
              1 + Math.floor(Math.random() * maximumCluster);

            for (
              let deletionOffset = 0;
              deletionOffset < clusterSize;
              deletionOffset += 1
            ) {
              const deletedSequence =
                sequenceIndex - deletionOffset;

              if (deletedSequence >= 0) {
                state.binaryDeletedNumbers.add(
                  `${faceKey}:${canonicalLaneIndex}:${deletedSequence}`
                );
              }
            }
          }
        }

        if (
          baselineDeleted ||
          state.binaryDeletedNumbers.has(deletionKey)
        ) {
          continue;
        }

        const normalizedFall = clamp(
          Math.max(0, y - numberStartY) /
            Math.max(rowGap, columnHeight),
          0,
          1
        );

        let localAlpha;
        if (rowIndex <= 0) {
          localAlpha = alpha;
        } else {
          const fadeStrength = state.binaryFade / 100;
          const fadeProgress = Math.pow(normalizedFall, 0.92);
          const depthOpacity =
            1 - fadeStrength * fadeProgress * 0.95;
          const densityVariation =
            0.82 +
            Math.abs(
              Math.sin(
                rowIndex * 2.73 +
                canonicalLaneIndex * 0.61 +
                faceSeed * 1.17
              )
            ) * 0.18;

          localAlpha = clamp(
            alpha * depthOpacity * densityVariation,
            alpha * Math.max(0.035, 1 - fadeStrength * 0.965),
            alpha * 0.94
          );
        }

        ctx.globalAlpha = localAlpha;
        ctx.fillText(glyph, x, y);
      }

    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function getTerrainGeometry(
  width,
  height,
  lineCount,
  frequencyPointCount,
  surfaceLineCount
) {
  const sourceColumnCount =
    state.history[0]?.length || FREQUENCY_POINT_COUNT;

  // Structure depends only on counts/orientation and decides how large the
  // typed-array buffers and axis sample maps must be.
  const structureKey = [
    Math.round(width),
    Math.round(height),
    lineCount,
    frequencyPointCount,
    surfaceLineCount,
    state.orientation,
    sourceColumnCount
  ].join("|");

  // Projection depends on the live view transform. When only these change
  // (e.g. auto-rotation), the existing buffers are reprojected in place
  // rather than reallocated, removing the per-frame allocation that caused
  // GC pauses / jitter.
  const projectionKey = [
    state.zoom.toFixed(3),
    state.rotation.toFixed(3),
    state.elevation.toFixed(3),
    state.lineHeight.toFixed(3)
  ].join("|");

  if (
    state.geometryCache &&
    state.geometryCache.structureKey === structureKey &&
    state.geometryCache.projectionKey === projectionKey
  ) {
    return state.geometryCache;
  }

  function allocateGrid(rowCount) {
    const total = rowCount * frequencyPointCount;
    return {
      baseX: new Float32Array(total),
      baseY: new Float32Array(total),
      depth: new Float32Array(total),
      y: new Float32Array(total),
      z: new Float32Array(total)
    };
  }

  // Reuse the buffer pool across frames; only reallocate when the mesh
  // structure (sizes / sample maps) actually changes.
  let buffers = state.geometryBuffers;
  if (!buffers || buffers.structureKey !== structureKey) {
    buffers = {
      structureKey,
      surface: allocateGrid(surfaceLineCount),
      lines: allocateGrid(lineCount),
      surfaceXSamples: buildAxisSamples(
        frequencyPointCount,
        sourceColumnCount
      ),
      surfaceYSamples: buildAxisSamples(surfaceLineCount, lineCount),
      lineYSamples: buildAxisSamples(lineCount, lineCount)
    };
    state.geometryBuffers = buffers;
  }

  const { project, planarDepth, heightScale } =
    createTerrainProjection(width, height);

  function normalized(index, count) {
    return -1 + (index / Math.max(1, count - 1)) * 2;
  }

  function reprojectGrid(grid, rowCount) {
    const { baseX, baseY, depth, y } = grid;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const worldY = normalized(rowIndex, rowCount);

      for (
        let pointIndex = 0;
        pointIndex < frequencyPointCount;
        pointIndex += 1
      ) {
        const worldX = normalized(pointIndex, frequencyPointCount);
        const point = project(worldX, worldY, 0);
        const index = rowIndex * frequencyPointCount + pointIndex;
        baseX[index] = point.x;
        baseY[index] = point.y;
        y[index] = point.y;
        depth[index] = planarDepth(worldX, worldY);
      }
    }
  }

  const surface = buffers.surface;
  const lines = buffers.lines;
  reprojectGrid(surface, surfaceLineCount);
  reprojectGrid(lines, lineCount);

  const surfaceXSamples = buffers.surfaceXSamples;
  const surfaceYSamples = buffers.surfaceYSamples;
  const lineXSamples = buffers.surfaceXSamples;
  const lineYSamples = buffers.lineYSamples;

  const surfaceRowDepthDelta =
    surfaceLineCount > 1
      ? surface.depth[frequencyPointCount] - surface.depth[0]
      : 0;
  const surfaceColumnDepthDelta =
    frequencyPointCount > 1
      ? surface.depth[1] - surface.depth[0]
      : 0;
  const lineRowDepthDelta =
    lineCount > 1
      ? lines.depth[frequencyPointCount] - lines.depth[0]
      : 0;

  const lineRowForward = lineRowDepthDelta >= 0;
  // Precompute the back-to-front line draw order once per geometry build.
  // This previously rebuilt a fresh array every frame, adding steady GC
  // pressure that showed up as render jitter.
  const lineOrder = new Array(lineCount);
  for (let ordinal = 0; ordinal < lineCount; ordinal += 1) {
    lineOrder[ordinal] = lineRowForward
      ? ordinal
      : lineCount - 1 - ordinal;
  }

  state.geometryCache = {
    structureKey,
    projectionKey,
    project,
    heightScale,
    frequencyPointCount,
    surfaceLineCount,
    lineCount,
    surface,
    lines,
    surfaceXSamples,
    surfaceYSamples,
    lineXSamples,
    lineYSamples,
    lineOrder,
    surfaceRowForward: surfaceRowDepthDelta >= 0,
    surfaceColumnForward: surfaceColumnDepthDelta >= 0,
    lineRowForward
  };

  return state.geometryCache;
}

function updateGeometryHeights(geometry) {
  const {
    frequencyPointCount,
    surfaceLineCount,
    lineCount,
    heightScale,
    surface,
    lines,
    surfaceXSamples,
    surfaceYSamples,
    lineXSamples,
    lineYSamples
  } = geometry;

  for (let rowIndex = 0; rowIndex < surfaceLineCount; rowIndex += 1) {
    const ySample = surfaceYSamples[rowIndex];
    const rowOffset = rowIndex * frequencyPointCount;

    for (
      let pointIndex = 0;
      pointIndex < frequencyPointCount;
      pointIndex += 1
    ) {
      const index = rowOffset + pointIndex;
      const heightValue = samplePreparedHeight(
        surfaceXSamples[pointIndex],
        ySample
      );
      surface.z[index] = heightValue;
      surface.y[index] =
        surface.baseY[index] - heightValue * heightScale;
    }
  }

  for (let rowIndex = 0; rowIndex < lineCount; rowIndex += 1) {
    const ySample = lineYSamples[rowIndex];
    const rowOffset = rowIndex * frequencyPointCount;

    for (
      let pointIndex = 0;
      pointIndex < frequencyPointCount;
      pointIndex += 1
    ) {
      const index = rowOffset + pointIndex;
      const heightValue = samplePreparedHeight(
        lineXSamples[pointIndex],
        ySample
      );
      lines.z[index] = heightValue;
      lines.y[index] =
        lines.baseY[index] - heightValue * heightScale;
    }
  }
}

function drawTerrain(width, height) {
  if (!state.history.length) resetHistory();

  const alpha = state.opacity / 100;
  const lineCount = Math.max(2, state.history.length);
  const frequencyPointCount = Math.max(
    64,
    Math.min(FREQUENCY_POINT_COUNT, Math.round(width / 7))
  );
  const surfaceLineCount = Math.max(
    lineCount,
    Math.min(64, Math.round(lineCount * 1.35))
  );
  const geometry = getTerrainGeometry(
    width,
    height,
    lineCount,
    frequencyPointCount,
    surfaceLineCount
  );
  const {
    project,
    surface,
    lines,
    surfaceRowForward,
    surfaceColumnForward,
    lineRowForward,
    lineOrder
  } = geometry;

  updateGeometryHeights(geometry);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const solidTopColor = opaqueSurfaceColor(
    state.backgroundColor,
    state.meshColor,
    0.36,
    0.54,
    false
  );

  // Solid strip underlays remove all sub-pixel cracks before shaded cells draw.
  for (let rowIndex = 0; rowIndex < surfaceLineCount - 1; rowIndex += 1) {
    const rowA = rowIndex * frequencyPointCount;
    const rowB = (rowIndex + 1) * frequencyPointCount;

    ctx.beginPath();
    ctx.moveTo(surface.baseX[rowA], surface.y[rowA]);

    for (
      let pointIndex = 1;
      pointIndex < frequencyPointCount;
      pointIndex += 1
    ) {
      const index = rowA + pointIndex;
      ctx.lineTo(surface.baseX[index], surface.y[index]);
    }

    for (
      let pointIndex = frequencyPointCount - 1;
      pointIndex >= 0;
      pointIndex -= 1
    ) {
      const index = rowB + pointIndex;
      ctx.lineTo(surface.baseX[index], surface.y[index]);
    }

    ctx.closePath();
    ctx.fillStyle = solidTopColor;
    ctx.fill();
  }

  const palette = getSurfacePalette();
  const lineStroke = hexToRgba(state.lineColor, alpha);
  ctx.lineWidth = state.lineWidth;

  // Draw opaque surface rows and their corresponding mesh lines in the
  // same back-to-front order. A nearer row is therefore painted over any
  // line that is geometrically behind it, providing hidden-line removal
  // without requiring a WebGL depth buffer.
  const rowStart = surfaceRowForward ? 0 : surfaceLineCount - 2;
  const rowEnd = surfaceRowForward ? surfaceLineCount - 1 : -1;
  const rowStep = surfaceRowForward ? 1 : -1;
  const pointStart = surfaceColumnForward ? 0 : frequencyPointCount - 2;
  const pointEnd = surfaceColumnForward ? frequencyPointCount - 1 : -1;
  const pointStep = surfaceColumnForward ? 1 : -1;

  const PALETTE_AVERAGE_STEPS = 32;
  const PALETTE_LIGHT_STEPS = 16;
  let nextLineOrdinal = 0;

  const drawTerrainLine = (rowIndex) => {
    const rowOffset = rowIndex * frequencyPointCount;
    ctx.strokeStyle = lineStroke;
    ctx.lineWidth = state.lineWidth;
    ctx.beginPath();
    ctx.moveTo(lines.baseX[rowOffset], lines.y[rowOffset]);

    for (
      let pointIndex = 1;
      pointIndex < frequencyPointCount;
      pointIndex += 1
    ) {
      const index = rowOffset + pointIndex;
      ctx.lineTo(lines.baseX[index], lines.y[index]);
    }

    ctx.stroke();
  };

  let surfaceOrdinal = 0;
  for (
    let rowIndex = rowStart;
    rowIndex !== rowEnd;
    rowIndex += rowStep
  ) {
    let batchColorIndex = -1;
    let batchOpen = false;

    const flushSurfaceBatch = () => {
      if (!batchOpen) return;
      ctx.fillStyle = palette[batchColorIndex];
      ctx.fill();
      batchOpen = false;
    };

    for (
      let pointIndex = pointStart;
      pointIndex !== pointEnd;
      pointIndex += pointStep
    ) {
      const p00 = rowIndex * frequencyPointCount + pointIndex;
      const p10 = p00 + 1;
      const p01 = p00 + frequencyPointCount;
      const p11 = p01 + 1;
      const z00 = surface.z[p00];
      const z10 = surface.z[p10];
      const z11 = surface.z[p11];
      const z01 = surface.z[p01];
      const averageHeight = (z00 + z10 + z11 + z01) * 0.25;
      const slopeX = (z10 + z11) - (z00 + z01);
      const slopeY = (z01 + z11) - (z00 + z10);
      const lightAmount = clamp(
        0.55 - slopeX * 0.45 - slopeY * 0.22,
        0,
        1
      );

      const averageIndex = Math.round(
        clamp(averageHeight, 0, 1) * (PALETTE_AVERAGE_STEPS - 1)
      );
      const lightIndex = Math.round(
        clamp(lightAmount, 0, 1) * (PALETTE_LIGHT_STEPS - 1)
      );
      const colorIndex =
        averageIndex * PALETTE_LIGHT_STEPS + lightIndex;

      if (colorIndex !== batchColorIndex) {
        flushSurfaceBatch();
        ctx.beginPath();
        batchColorIndex = colorIndex;
        batchOpen = true;
      }

      ctx.moveTo(surface.baseX[p00], surface.y[p00]);
      ctx.lineTo(surface.baseX[p10], surface.y[p10]);
      ctx.lineTo(surface.baseX[p11], surface.y[p11]);
      ctx.lineTo(surface.baseX[p01], surface.y[p01]);
      ctx.closePath();
    }

    flushSurfaceBatch();

    const completedSurfaceFraction =
      (surfaceOrdinal + 1) / Math.max(1, surfaceLineCount - 1);
    while (nextLineOrdinal < lineCount) {
      const lineFraction =
        lineCount <= 1
          ? 1
          : nextLineOrdinal / (lineCount - 1);

      // When a terrain line lands exactly on a surface-strip boundary,
      // drawing it after the first strip lets the next strip paint over
      // half of the stroke. This is most visible on the center audio row
      // because the default line/surface counts both contain a 50% row.
      // Defer exact-boundary lines until the following strip has rendered
      // so every waveform row retains the full configured line width.
      if (lineFraction >= completedSurfaceFraction - 1e-6) break;

      drawTerrainLine(lineOrder[nextLineOrdinal]);
      nextLineOrdinal += 1;
    }

    surfaceOrdinal += 1;
  }

  while (nextLineOrdinal < lineCount) {
    drawTerrainLine(lineOrder[nextLineOrdinal]);
    nextLineOrdinal += 1;
  }

  const visibleEdges = getVisibleSideEdges(project);

  // Mask the two viewer-facing vertical faces after the complete top
  // mesh has rendered. The binary glyphs are painted later, so the face
  // remains clean and opaque instead of showing terrain lines through
  // the spaces between numbers.
  drawTerrainSideFaceMasks(
    height,
    project,
    visibleEdges,
    frequencyPointCount
  );

  // Restore only the intended viewer-facing top boundary after the
  // opaque side-face masks. The perpendicular perimeter rail remains
  // intentionally omitted; it is not part of the audio terrain rows.
  ctx.strokeStyle = lineStroke;
  ctx.lineWidth = state.lineWidth;

  for (const edge of visibleEdges) {
    if (isRemovedTopEdge(edge)) continue;

    const edgePoints = [];
    const edgeSamples = frequencyPointCount;

    for (let index = 0; index < edgeSamples; index += 1) {
      const amount = index / Math.max(1, edgeSamples - 1);
      const worldPoint = sampleEdge(edge, amount);
      edgePoints.push(project(
        worldPoint.x,
        worldPoint.y,
        sampleHistoryHeight(worldPoint.x, worldPoint.y)
      ));
    }

    ctx.beginPath();
    traceSmoothPolyline(edgePoints);
    ctx.stroke();
  }

  // The two edges returned by getVisibleSideEdges are the viewer-facing
  // vertical faces. Their opaque masks have already removed terrain lines
  // from the side interiors. Draw the binary streams last so every glyph
  // remains visible, while each column is still clipped by its sampled top
  // edge inside drawTerrainSideWalls and cannot bleed onto the surface.
  drawTerrainSideWalls(width, height, project);

  ctx.restore();
}

function drawScene() {
  const width = canvas.width / state.dpr;
  const height = canvas.height / state.dpr;

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  drawTerrain(width, height);

  // HUD chrome and audio graphs render last so they remain legible above
  // the terrain at every camera angle.
  drawFrameDetails(width, height);

  // The viewport logo is a DOM SVG during normal preview. Rasterize it
  // onto exported canvas frames so it is present in MP4 output.
  if (state.isExportingVideo) {
    drawViewportLogoToCanvas(width, height);
  }
}

function render(timestamp) {
  if (state.isExportingVideo) {
    requestAnimationFrame(render);
    return;
  }

  enforceSelectedLoop();

  const isPlaying =
    state.analysisReady &&
    !audio.paused &&
    !audio.ended;

  // Advance the smoothed playback clock first; the terrain history and
  // HUD readouts sample against it so the scroll glides between the
  // coarse updates of the underlying media clock.
  updateSmoothPlaybackClock(timestamp);

  const autoRotateDelta =
    state.lastAutoRotateTimestamp > 0
      ? Math.min(0.05, (timestamp - state.lastAutoRotateTimestamp) / 1000)
      : 0;
  state.lastAutoRotateTimestamp = timestamp;

  updateBinaryStreamClock(timestamp, isPlaying);

  if (
    state.autoRotate &&
    !state.isViewportDragging &&
    isPlaying &&
    autoRotateDelta > 0
  ) {
    let nextRotation =
      state.rotation + autoRotateDelta * state.rotateSpeed;

    if (nextRotation > 180) nextRotation -= 360;
    if (nextRotation < -180) nextRotation += 360;

    state.rotation = nextRotation;

    // Avoid forcing DOM control updates at the full render rate.
    if (
      timestamp - state.lastRotationControlSyncTimestamp >= 100
    ) {
      elements.rotation.value = String(nextRotation);
      elements.rotationValue.value = nextRotation.toFixed(2);
      state.lastRotationControlSyncTimestamp = timestamp;
    }

    state.geometryCache = null;
    state.needsRender = true;
  }

  if (isPlaying) {
    // Resample against the latency-corrected media clock every rendered
    // frame so the terrain head follows the audible signal without a
    // 30 Hz quantization delay.
    state.frame += 1;
    updateHistory();
    state.lastHistoryUpdateTimestamp = timestamp;

    // Binary streams and automatic rotation continue animating on every
    // available animation frame.
    state.needsRender = true;
  } else {
    state.lastHistoryUpdateTimestamp = 0;
    state.fpsValue = 0;
    state.fpsFrameCount = 0;
    state.fpsSampleStart = timestamp;
  }

  const shouldDraw =
    !state.isExportingPng &&
    state.needsRender;

  if (shouldDraw) {
    drawScene();

    state.needsRender = false;

    if (isPlaying) {
      if (!state.fpsSampleStart) {
        state.fpsSampleStart = timestamp;
      }

      state.fpsFrameCount += 1;
      const fpsElapsed = timestamp - state.fpsSampleStart;

      if (fpsElapsed >= 500) {
        const measuredFps =
          (state.fpsFrameCount * 1000) / Math.max(1, fpsElapsed);
        state.fpsValue =
          state.fpsValue > 0
            ? state.fpsValue * 0.65 + measuredFps * 0.35
            : measuredFps;
        state.fpsFrameCount = 0;
        state.fpsSampleStart = timestamp;
      }
    }
  }

  if (
    timestamp - state.lastTimelineTimestamp >= 33 &&
    !state.isSeeking &&
    state.hasAudio &&
    Number.isFinite(audio.duration) &&
    audio.duration > 0
  ) {
    elements.timeline.value = String(
      Math.round((audio.currentTime / audio.duration) * 1000)
    );
    elements.currentTime.textContent = formatTime(audio.currentTime);
    updateLoopPlayhead(audio.currentTime);
    state.lastTimelineTimestamp = timestamp;
  }

  requestAnimationFrame(render);
}

function normalizeRotation(value) {
  let normalized = value;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function setRotationFromViewport(value) {
  state.rotation = normalizeRotation(value);
  elements.rotation.value = String(state.rotation);
  elements.rotationValue.value = state.rotation.toFixed(2);
  state.geometryCache = null;
  markRenderDirty();
}

function setElevationFromViewport(value) {
  state.elevation = clamp(value, 8, 60);
  elements.elevation.value = String(state.elevation);
  elements.elevationValue.value = state.elevation.toFixed(2);
  state.geometryCache = null;
  markRenderDirty();
}

function initializeCollapsibleSections() {
  document.querySelectorAll(".collapse-toggle").forEach((button) => {
    const owner = button.closest(".section, .control-cluster");
    if (!owner) return;

    const title = owner.dataset.collapsibleTitle || "section";
    const header = button.closest(".collapsible-header");
    const titleElement = header?.querySelector("h2, h3");

    const updateToggleState = (isCollapsed) => {
      button.setAttribute("aria-expanded", String(!isCollapsed));
      button.setAttribute(
        "aria-label",
        `${isCollapsed ? "Expand" : "Collapse"} ${title}`
      );
      button.title = `${isCollapsed ? "Expand" : "Collapse"} ${title}`;
      button.textContent = isCollapsed ? "+" : "−";
      if (titleElement) {
        titleElement.setAttribute("aria-expanded", String(!isCollapsed));
      }
    };

    const toggleSection = () => {
      const isCollapsed = owner.classList.toggle("is-collapsed");
      updateToggleState(isCollapsed);
      requestAnimationFrame(() => {
        fitViewport();
        if (!isCollapsed && owner.contains(elements.loopWaveWrap)) {
          drawLoopWaveform();
          drawLoopMinimap();
          updateLoopSelectionUi();
        }
      });
    };

    const startsCollapsed = owner.classList.contains("is-collapsed");
    updateToggleState(startsCollapsed);
    button.addEventListener("click", toggleSection);

    if (titleElement) {
      titleElement.setAttribute("role", "button");
      titleElement.setAttribute("tabindex", "0");
      if (button.getAttribute("aria-controls")) {
        titleElement.setAttribute("aria-controls", button.getAttribute("aria-controls"));
      }
      titleElement.addEventListener("click", toggleSection);
      titleElement.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleSection();
      });
    }
  });
}

function updateSidebarToggle() {
  elements.app.classList.toggle(
    "sidebar-collapsed",
    state.sidebarCollapsed
  );
  elements.sidebarToggle.setAttribute(
    "aria-expanded",
    String(!state.sidebarCollapsed)
  );
  elements.sidebarToggle.setAttribute(
    "aria-label",
    state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
  );
  elements.sidebarToggle.title =
    state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  elements.sidebarToggleIcon.textContent =
    state.sidebarCollapsed ? "›" : "‹";

  requestAnimationFrame(fitViewport);
  window.setTimeout(fitViewport, 190);
}

function beginViewportRotation(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  // The export overlay lives inside the draggable viewport. Never let its
  // controls bubble into viewport rotation or capture the pointer, because
  // pointer capture suppresses the cancel button's normal activation.
  const target = event.target instanceof Element ? event.target : null;
  if (
    state.isExportingVideo ||
    target?.closest("button, input, select, textarea, a, [role='button']")
  ) {
    return;
  }

  state.isViewportDragging = true;
  state.viewportDragPointerId = event.pointerId;
  state.viewportDragLastX = event.clientX;
  state.viewportDragLastY = event.clientY;
  elements.viewportFrame.classList.add("is-rotating");
  elements.viewportFrame.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function continueViewportRotation(event) {
  if (
    !state.isViewportDragging ||
    event.pointerId !== state.viewportDragPointerId
  ) {
    return;
  }

  const deltaX = event.clientX - state.viewportDragLastX;
  const deltaY = event.clientY - state.viewportDragLastY;
  state.viewportDragLastX = event.clientX;
  state.viewportDragLastY = event.clientY;

  setRotationFromViewport(state.rotation + deltaX * 0.35);
  setElevationFromViewport(state.elevation - deltaY * 0.22);
  event.preventDefault();
}

function endViewportRotation(event) {
  if (
    !state.isViewportDragging ||
    event.pointerId !== state.viewportDragPointerId
  ) {
    return;
  }

  state.isViewportDragging = false;
  state.viewportDragPointerId = null;
  elements.viewportFrame.classList.remove("is-rotating");

  if (elements.viewportFrame.hasPointerCapture(event.pointerId)) {
    elements.viewportFrame.releasePointerCapture(event.pointerId);
  }
}

function enhanceValueEditors() {
  document.querySelectorAll(".value-editor").forEach((editor) => {
    const valueInput = editor.querySelector(".value-input");
    if (!valueInput || editor.dataset.enhanced === "true") return;

    const label = valueInput.getAttribute("aria-label") || "Value";
    const suffix = editor.querySelector(".value-suffix");
    editor.classList.toggle("has-suffix", Boolean(suffix));

    const decrementButton = document.createElement("button");
    decrementButton.type = "button";
    decrementButton.className = "value-stepper";
    decrementButton.textContent = "−";
    decrementButton.setAttribute("aria-label", `Decrease ${label}`);
    decrementButton.title = `Decrease ${label}`;

    const incrementButton = document.createElement("button");
    incrementButton.type = "button";
    incrementButton.className = "value-stepper";
    incrementButton.textContent = "+";
    incrementButton.setAttribute("aria-label", `Increase ${label}`);
    incrementButton.title = `Increase ${label}`;

    editor.insertBefore(decrementButton, valueInput);
    editor.appendChild(incrementButton);
    editor.dataset.enhanced = "true";

    const stepValue = (direction) => {
      if (direction < 0) {
        valueInput.stepDown();
      } else {
        valueInput.stepUp();
      }
      valueInput.dispatchEvent(new Event("input", { bubbles: true }));
      valueInput.dispatchEvent(new Event("change", { bubbles: true }));
      valueInput.focus({ preventScroll: true });
      valueInput.select();
    };

    decrementButton.addEventListener("click", () => stepValue(-1));
    incrementButton.addEventListener("click", () => stepValue(1));

    valueInput.addEventListener("focus", () => {
      requestAnimationFrame(() => valueInput.select());
    });

    valueInput.addEventListener("wheel", () => {
      valueInput.blur();
    }, { passive: true });
  });
}

function bindRange(input, valueInput, key, formatter, onChange) {
  const minimum =
    input.min === "" ? Number.NEGATIVE_INFINITY : Number(input.min);
  const maximum =
    input.max === "" ? Number.POSITIVE_INFINITY : Number(input.max);
  const step = Number(input.step);
  const stepPrecision =
    Number.isFinite(step) && step > 0 && String(input.step).includes(".")
      ? String(input.step).split(".")[1].length
      : 0;

  const normalizeValue = (rawValue, snapToStep = true) => {
    let nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue)) return null;

    nextValue = Math.max(minimum, Math.min(maximum, nextValue));

    if (snapToStep && Number.isFinite(step) && step > 0) {
      const stepBase = Number.isFinite(minimum) ? minimum : 0;
      nextValue =
        stepBase + Math.round((nextValue - stepBase) / step) * step;
      nextValue = Number(nextValue.toFixed(stepPrecision));
      nextValue = Math.max(minimum, Math.min(maximum, nextValue));
    }

    return nextValue;
  };

  const updateState = (nextValue) => {
    input.value = String(nextValue);
    state[key] = Number(input.value);
    if (onChange) onChange(state[key]);
    markRenderDirty();
  };

  const commitValue = (rawValue) => {
    const nextValue = normalizeValue(rawValue, true);
    if (nextValue === null) return false;
    updateState(nextValue);
    valueInput.value = formatter(state[key]);
    return true;
  };

  input.addEventListener("input", () => {
    commitValue(input.value);
  });

  valueInput.addEventListener("input", () => {
    const rawValue = valueInput.value.trim();
    if (
      rawValue === "" ||
      rawValue === "-" ||
      rawValue === "." ||
      rawValue === "-."
    ) {
      return;
    }

    const nextValue = normalizeValue(rawValue, false);
    if (nextValue === null) return;
    updateState(nextValue);
  });

  valueInput.addEventListener("change", () => {
    if (!commitValue(valueInput.value)) {
      valueInput.value = formatter(state[key]);
    }
  });

  valueInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      valueInput.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      valueInput.value = formatter(state[key]);
      valueInput.blur();
    }
  });

  commitValue(input.value);
}

enhanceValueEditors();

const galaxyLoopController = (() => {
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
          <button class="loop-bar-btn" id="popup-bars-decr">−</button>
          <input class="loop-bars-val" id="popup-bars-val" type="number" min="1" max="999" value="4">
          <span class="loop-bars-unit">bars</span>
          <button class="loop-bar-btn" id="popup-bars-incr">+</button>
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
          popupBpm = await detectBPM(popupBuffer);
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

  // ── BPM detection (same algorithm as bpm_detect.html) ──
  async function detectBPM(buf) {
      const sr = buf.sampleRate, maxLen = Math.min(buf.length, sr * 90);
      const mono = new Float32Array(maxLen);
      for (let c = 0; c < buf.numberOfChannels; c++) {
          const ch = buf.getChannelData(c);
          for (let i = 0; i < maxLen; i++) mono[i] += ch[i];
      }
      if (buf.numberOfChannels > 1) for (let i = 0; i < maxLen; i++) mono[i] /= buf.numberOfChannels;

      const offCtx = new OfflineAudioContext(1, maxLen, sr);
      const ob = offCtx.createBuffer(1, maxLen, sr); ob.getChannelData(0).set(mono);
      const src = offCtx.createBufferSource(); src.buffer = ob;
      const lp = offCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 0.8;
      src.connect(lp); lp.connect(offCtx.destination); src.start(0);
      const rend = await offCtx.startRendering();
      const fd = rend.getChannelData(0);

      const hop = 512, nF = Math.floor(fd.length / hop);
      const eng = new Float32Array(nF);
      for (let i = 0; i < nF; i++) {
          let e = 0, off = i * hop;
          for (let j = 0; j < hop; j++) { const s = fd[off + j]; e += s * s; }
          eng[i] = e;
      }
      let eM = 0; for (let i = 0; i < nF; i++) if (eng[i] > eM) eM = eng[i];
      if (eM > 0) for (let i = 0; i < nF; i++) eng[i] /= eM;

      const fps = sr / hop, minL = Math.max(2, Math.floor(fps * 60 / 200)), maxL = Math.ceil(fps * 60 / 60);
      let bL = minL, bC = -Infinity;
      for (let lag = minL; lag <= maxL; lag++) {
          let c = 0; const lim = nF - lag;
          for (let i = 0; i < lim; i++) c += eng[i] * eng[i + lag];
          if (c > bC) { bC = c; bL = lag; }
      }
      let raw = 60 * fps / bL;
      while (raw < 80) raw *= 2; while (raw > 160) raw /= 2;
      return Math.round(raw);
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
      ctx.fillStyle = 'rgba(15,15,23,0.98)'; ctx.fillRect(0, 0, cW, cH);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cH / 2); ctx.lineTo(cW, cH / 2); ctx.stroke();

      if (!popupPeaks || !popupBuffer) {
          ctx.fillStyle = 'rgba(168,168,182,0.72)'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
          ctx.fillText('Loading…', cW / 2, cH / 2 + 4); return;
      }

      const lsX = timeToX(popupLoopStart), leX = timeToX(popupLoopEnd);
      ctx.fillStyle = 'rgba(154,154,165,0.10)'; ctx.fillRect(lsX, 0, leX - lsX, cH);

      // Beat grid
      if (popupBpm > 0) {
          const bd = 60 / popupBpm;
          let first = Math.floor(popupZoomStart / bd) * bd, bi = Math.round(first / bd);
          for (let t = first; t < popupZoomEnd; t += bd, bi++) {
              const x = timeToX(t), isBar = (bi % 4 === 0);
              ctx.strokeStyle = isBar ? 'rgba(154,154,165,0.32)' : 'rgba(154,154,165,0.12)';
              ctx.lineWidth = isBar ? 0.8 : 0.5;
              ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cH); ctx.stroke();
              if (isBar) {
                  ctx.fillStyle = 'rgba(168,168,182,0.55)'; ctx.font = '8px monospace'; ctx.textAlign = 'left';
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
              ? `rgb(${118 + pk * 55 | 0},${118 + pk * 55 | 0},${128 + pk * 55 | 0})`
              : `rgb(${48 + pk * 42 | 0},${48 + pk * 42 | 0},${58 + pk * 42 | 0})`;
          ctx.fillRect(i, y, 1, Math.max(0.5, h));
      }

      // Loop boundary lines
      ctx.strokeStyle = 'rgba(180,180,192,0.76)'; ctx.lineWidth = 1;
      [lsX, leX].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cH); ctx.stroke(); });
  }

  // ── Minimap render ──
  function renderMinimap($) {
      const mc = document.getElementById('popup-minimap-canvas');
      if (!mc) return;
      const ctx = mc.getContext('2d');
      ctx.clearRect(0, 0, mmW, mmH);
      ctx.fillStyle = 'rgba(15,15,23,0.98)'; ctx.fillRect(0, 0, mmW, mmH);
      if (!popupPeaks || !popupBuffer) return;

      const N = popupPeaks.length, dur = popupBuffer.duration;
      for (let i = 0; i < mmW; i++) {
          const pi = Math.round((i / mmW) * N);
          const pk = popupPeaks[Math.min(pi, N - 1)] || 0;
          const h = pk * mmH * 0.85, y = (mmH - h) / 2;
          const t = (i / mmW) * dur, inL = (t >= popupLoopStart && t <= popupLoopEnd);
          ctx.fillStyle = inL ? `rgba(154,154,165,${0.42 + pk * 0.48})` : `rgba(74,74,86,${0.5 + pk * 0.38})`;
          ctx.fillRect(i, y, 1, Math.max(0.5, h));
      }

      const vL = (popupZoomStart / dur) * mmW, vR = (popupZoomEnd / dur) * mmW;
      ctx.fillStyle = 'rgba(154,154,165,0.10)'; ctx.fillRect(vL, 0, vR - vL, mmH);
      ctx.strokeStyle = 'rgba(180,180,192,0.72)'; ctx.lineWidth = 1;
      ctx.strokeRect(vL + 0.5, 0.5, Math.max(1, vR - vL - 1), mmH - 1);

      if (popupOffset > 0) {
          const px = (popupOffset / dur) * mmW;
          ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
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
      s.style.background = `linear-gradient(90deg,rgba(154,154,165,0.92) ${popupVolume}%,rgba(255,255,255,0.12) ${popupVolume}%)`;
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

elements.audioFile.addEventListener("change", (event) => {
  loadAudioFile(event.target.files && event.target.files[0]);
});

elements.resetVisualizer.addEventListener(
  "click",
  resetVisualizerToDefaults
);

elements.playPause.addEventListener("click", togglePlayback);
elements.loopButton.addEventListener("click", () => {
  galaxyLoopController.open();
});
elements.muteToggle.addEventListener("change", () => {
  state.muted = elements.muteToggle.checked;
  audio.muted = state.muted;
});
galaxyLoopController.syncButton();

window.addEventListener("keydown", (event) => {
  if (
    event.code !== "Space" ||
    event.repeat ||
    !state.hasAudio ||
    !state.analysisReady
  ) {
    return;
  }

  const activeElement = document.activeElement;
  const controlIsSelected =
    activeElement &&
    activeElement !== document.body &&
    (
      activeElement.matches(
        "input, select, button, textarea, a[href]"
      ) ||
      activeElement.isContentEditable
    );

  if (controlIsSelected) return;

  event.preventDefault();
  togglePlayback();
});

audio.addEventListener("loadedmetadata", () => {
  elements.duration.textContent = formatTime(audio.duration);
  if (state.analysisReady && audio.paused) {
    setStatus(
      `READY / ${state.fileName.toUpperCase()} / ${formatTime(audio.duration)}`
    );
  }
});

audio.addEventListener("play", () => {
  if (state.audioLoop && hasPartialLoopSelection()) {
    const range = getSelectedLoopRange();
    if (audio.currentTime < range.start || audio.currentTime >= range.end) {
      audio.currentTime = range.start;
      resetSmoothPlaybackTo(range.start);
    }
  }
  elements.playPause.textContent = "⏸ Pause";
  if (state.analysisReady) {
    setStatus(`PLAYING / ${state.fileName.toUpperCase()}`);
    markRenderDirty();
  }
});

audio.addEventListener("pause", () => {
  elements.playPause.textContent = "▶ Play";
  if (!audio.ended && state.hasAudio) {
    setStatus(`PAUSED / ${state.fileName.toUpperCase()}`);
  }
  markRenderDirty();
});

audio.addEventListener("ended", () => {
  elements.playPause.textContent = "▶ Play";
  elements.timeline.value = "0";
  elements.currentTime.textContent = "0:00";
  resetHistory();
  setStatus(`ENDED / ${state.fileName.toUpperCase()}`);
  markRenderDirty();
});

audio.addEventListener("error", () => {
  setStatus("ERROR / AUDIO FORMAT COULD NOT BE DECODED");
});

elements.timeline.addEventListener("input", () => {
  state.isSeeking = true;
  if (Number.isFinite(audio.duration)) {
    const previewTime =
      (Number(elements.timeline.value) / 1000) * audio.duration;
    audio.currentTime = previewTime;
    resetSmoothPlaybackTo(previewTime);
    elements.currentTime.textContent = formatTime(previewTime);
    updateLoopPlayhead(previewTime);
    updateHistory(true);
    markRenderDirty();
  }
});

elements.timeline.addEventListener("change", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = (Number(elements.timeline.value) / 1000) * audio.duration;
    resetSmoothPlaybackTo(audio.currentTime);
    updateLoopPlayhead(audio.currentTime);
    // Seeking updates the terrain once. Binary streams use a monotonic
    // playback clock and therefore never move upward when seeking backward.
    updateHistory(true);
  }
  state.isSeeking = false;
});

elements.sidebarToggle.addEventListener("click", () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  updateSidebarToggle();
});

elements.viewportFrame.addEventListener(
  "pointerdown",
  beginViewportRotation
);
elements.viewportFrame.addEventListener(
  "pointermove",
  continueViewportRotation
);
elements.viewportFrame.addEventListener(
  "pointerup",
  endViewportRotation
);
elements.viewportFrame.addEventListener(
  "pointercancel",
  endViewportRotation
);
elements.viewportFrame.addEventListener(
  "lostpointercapture",
  (event) => {
    if (event.pointerId === state.viewportDragPointerId) {
      state.isViewportDragging = false;
      state.viewportDragPointerId = null;
      elements.viewportFrame.classList.remove("is-rotating");
    }
  }
);

["dragenter", "dragover"].forEach((eventName) => {
  elements.viewportFrame.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    elements.viewportFrame.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  elements.viewportFrame.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    elements.viewportFrame.classList.remove("is-dragging");
  });
});

elements.viewportFrame.addEventListener("drop", (event) => {
  const files = Array.from(event.dataTransfer.files || []);
  const audioFile = files.find((file) =>
    file.type.startsWith("audio/") ||
    /\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(file.name)
  );

  if (audioFile) {
    loadAudioFile(audioFile);
  } else {
    setStatus("DROP ERROR / NO SUPPORTED AUDIO FILE FOUND");
  }
});

function canvasToPngBlob() {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

async function exportPngAtSelectedResolution() {
  if (state.isExportingPng || state.isExportingVideo) return;

  state.isExportingPng = true;
  elements.exportPng.disabled = true;
  const originalLabel = elements.exportPng.textContent;
  elements.exportPng.textContent = "Exporting…";

  const previewWidth = canvas.width;
  const previewHeight = canvas.height;
  const previewDpr = state.dpr;

  try {
    const resolution = getViewportResolutionDimensions();
    const renderTarget = getWebpageRenderDimensions();
    const exportScale = Math.min(
      resolution.width / renderTarget.width,
      resolution.height / renderTarget.height
    );

    canvas.width = resolution.width;
    canvas.height = resolution.height;
    state.dpr = exportScale;
    state.geometryCache = null;
    drawScene();

    const blob = await canvasToPngBlob();
    if (!blob) {
      throw new Error("PNG export failed.");
    }

    const base = getExportFileBaseName();
    downloadBlob(blob, `${base}-frame.png`);
  } catch (error) {
    console.error(error);
    setStatus(`EXPORT ERROR / ${error.message}`);
  } finally {
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    state.dpr = previewDpr;
    state.geometryCache = null;
    state.isExportingPng = false;
    elements.exportPng.disabled = false;
    elements.exportPng.textContent = originalLabel;
    drawScene();
    state.needsRender = false;
  }
}

elements.exportPng.addEventListener(
  "click",
  exportPngAtSelectedResolution
);


let Mp4MuxerModule = null;
let MediabunnyModule = null;

function getSelectedVideoFileType() {
  return elements.videoFileType.value === "mkv" ? "mkv" : "mp4";
}

function getVideoFormatLabel(fileType = getSelectedVideoFileType()) {
  return fileType.toUpperCase();
}

function getVideoExportIdleMessage(fileType = getSelectedVideoFileType()) {
  if (isFirefoxBrowser && fileType === "mp4") {
    return "Firefox cannot reliably mux MP4/H.264 from WebCodecs. Select MKV for Firefox export.";
  }
  if (isFirefoxBrowser && fileType === "mkv") {
    return "Firefox export uses MKV with the first supported VP9, VP8, AV1, or AVC encoder and Opus audio.";
  }
  return `${getVideoFormatLabel(fileType)} export requires a loaded audio file and WebCodecs support.`;
}

function updateVideoExportFormatUi(resetStatus = true) {
  const fileType = getSelectedVideoFileType();
  if (!state.isExportingVideo) {
    elements.exportVideo.textContent = "Export Video";
    elements.exportVideo.setAttribute("aria-label", "Export video");
    if (resetStatus) {
      setVideoExportStatus(getVideoExportIdleMessage(fileType), "idle");
    }
  }
}

function setVideoExportStatus(message, status = "idle") {
  elements.videoExportStatus.textContent = message;
  elements.videoExportStatus.dataset.state = status;
}

function setVideoExportProgress(percent, detail = "Encoding") {
  const normalized = clamp(Number(percent) || 0, 0, 100);
  const rounded = Math.round(normalized);
  elements.videoExportProgress.value = normalized;
  elements.videoExportProgressText.textContent = `${rounded}%`;
  elements.videoExportOverlayProgress.value = normalized;
  elements.videoExportOverlayProgressText.textContent = `${rounded}%`;
  elements.videoExportOverlayDetail.textContent = `${detail} · ${rounded}%`;
}

function registerVideoExportCancelHandler(handler) {
  if (typeof handler !== "function") return () => {};
  state.videoExportCancelHandlers.add(handler);
  return () => state.videoExportCancelHandlers.delete(handler);
}

function runVideoExportCancelHandlers() {
  for (const handler of Array.from(state.videoExportCancelHandlers)) {
    try {
      const result = handler();
      if (result && typeof result.catch === "function") {
        result.catch((error) => {
          if (!state.videoExportCancelled) {
            console.warn("Video export cancellation failed", error);
          }
        });
      }
    } catch (error) {
      console.warn("Video export cancellation handler failed", error);
    }
  }
}

function requestVideoExportCancel() {
  if (!state.isExportingVideo || state.videoExportCancelled) return;
  state.videoExportCancelled = true;
  elements.videoExportCancel.disabled = true;
  elements.videoExportCancel.textContent = "Cancelling…";
  elements.exportVideo.disabled = true;
  elements.exportVideo.textContent = "Cancelling…";
  setVideoExportStatus("Cancelling video export…", "active");
  elements.videoExportOverlayDetail.textContent = "Cancelling…";

  // Actively stop the current encoder/output instead of only setting a
  // flag. This makes cancellation immediate during queued video frames,
  // audio encoding, and MKV container work.
  runVideoExportCancelHandlers();
}

function beginVideoExportUi() {
  let frozenFrame = "";
  try {
    frozenFrame = canvas.toDataURL("image/png");
  } catch (error) {
    console.warn("Could not capture frozen preview frame", error);
  }

  elements.videoExportOverlay.style.backgroundColor = state.backgroundColor;
  elements.videoExportOverlay.style.backgroundImage = frozenFrame
    ? `url(${JSON.stringify(frozenFrame)})`
    : "none";
  elements.videoExportCancel.disabled = false;
  elements.videoExportCancel.textContent = "Cancel Export";
  elements.viewportFrame.classList.add("is-exporting");
  elements.videoExportProgressWrap.classList.add("is-visible");
  setVideoExportProgress(0, "Preparing");
}

function endVideoExportUi() {
  elements.viewportFrame.classList.remove("is-exporting");
  elements.videoExportOverlay.style.backgroundImage = "none";
  elements.videoExportProgressWrap.classList.remove("is-visible");
  elements.videoExportOverlayProgress.value = 0;
  elements.videoExportOverlayProgressText.textContent = "0%";
  elements.videoExportCancel.disabled = false;
  elements.videoExportCancel.textContent = "Cancel Export";
}

function nextEventLoopTurn() {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

function throwIfVideoExportCancelled() {
  if (!state.videoExportCancelled) return;
  throw new DOMException("Video export cancelled.", "AbortError");
}

async function loadMp4MuxerModule() {
  if (!Mp4MuxerModule) {
    Mp4MuxerModule = await import(
      "https://cdn.jsdelivr.net/npm/mp4-muxer@5/+esm"
    );
  }
  return Mp4MuxerModule;
}

async function loadMediabunnyModule() {
  if (!MediabunnyModule) {
    MediabunnyModule = await import(
      "https://cdn.jsdelivr.net/npm/mediabunny@1.46.0/+esm"
    );
  }
  return MediabunnyModule;
}

async function chooseSupportedAvcConfig(width, height, bitrate, frameRate) {
  const candidates = [
    "avc1.640033",
    "avc1.64002A",
    "avc1.4D402A",
    "avc1.42001F"
  ];
  const qualityProfiles = [
    {
      latencyMode: "quality",
      bitrateMode: "variable",
      hardwareAcceleration: "no-preference"
    },
    {
      latencyMode: "quality",
      hardwareAcceleration: "no-preference"
    },
    {
      bitrateMode: "variable",
      hardwareAcceleration: "no-preference"
    }
  ];

  // Offline export must never use realtime mode. WebCodecs permits a
  // realtime encoder to drop frames when it cannot keep pace, which
  // produces visible pauses even though the container timestamps remain
  // valid. Quality mode trades export speed for complete frame delivery.
  for (const codec of candidates) {
    for (const qualityProfile of qualityProfiles) {
      const config = {
        codec,
        width,
        height,
        bitrate,
        framerate: frameRate,
        ...qualityProfile,
        avc: { format: "avc" }
      };

      try {
        const support = await VideoEncoder.isConfigSupported(config);
        if (support.supported) return support.config || config;
      } catch (error) {
        console.warn(`Unsupported AVC configuration ${codec}`, error);
      }
    }
  }

  throw new Error(
    "The selected MP4 resolution, bitrate, or frame rate is not supported by this browser."
  );
}

async function waitForEncoderQueue(encoder, maximumQueueSize = 5) {
  while (encoder.encodeQueueSize > maximumQueueSize) {
    if (state.videoExportCancelled) return;
    await nextEventLoopTurn();
  }
}

function getEffectiveVideoBitrate(
  baseBitrateMbps,
  width,
  height
) {
  // Treat the selected value as the 1080p quality target, then scale it
  // gently for larger raster sizes. Square-root scaling supplies enough
  // temporal detail for the moving line mesh without recreating the old
  // 4x 4K bitrate spike. Example: 24 Mbps becomes 48 Mbps at 4K.
  const basePixels = 1920 * 1080;
  const pixelScale = Math.max(1, (width * height) / basePixels);
  const resolutionScale = clamp(Math.sqrt(pixelScale), 1, 2.5);
  const effectiveMbps = clamp(
    baseBitrateMbps * resolutionScale,
    1,
    120
  );
  return Math.round(effectiveMbps * 1_000_000);
}

function getVideoFrameTiming(frameIndex, frameRate) {
  // Calculate timestamps from the selected frame-rate clock. The encoder
  // now runs in quality mode with strict backpressure so every timestamp
  // corresponds to an actual encoded frame rather than a dropped slot.
  const timestampUs = Math.round((frameIndex * 1_000_000) / frameRate);
  const nextTimestampUs = Math.round(
    ((frameIndex + 1) * 1_000_000) / frameRate
  );

  return {
    timestampUs,
    durationUs: Math.max(1, nextTimestampUs - timestampUs),
    timestampSeconds: frameIndex / frameRate,
    durationSeconds: 1 / frameRate
  };
}

function getVideoExportRange() {
  const fullDuration = state.decodedAudioBuffer?.duration || 0;
  if (fullDuration <= 0) {
    return { start: 0, end: 0, duration: 0 };
  }

  // A partial selection is exported only when looping is actually active.
  // On first load, the loop editor initializes a short default selection;
  // ignoring that inactive selection ensures the complete track is rendered.
  if (state.audioLoop && hasPartialLoopSelection()) {
    const selectedRange = getSelectedLoopRange();
    return {
      start: selectedRange.start,
      end: selectedRange.end,
      duration: selectedRange.duration
    };
  }

  return { start: 0, end: fullDuration, duration: fullDuration };
}

function createExportAudioBufferSegment(
  audioBuffer,
  startSeconds = 0,
  endSeconds = audioBuffer.duration
) {
  const sampleRate = audioBuffer.sampleRate;
  const startFrame = clamp(
    Math.floor(startSeconds * sampleRate),
    0,
    audioBuffer.length
  );
  const endFrame = clamp(
    Math.ceil(endSeconds * sampleRate),
    startFrame,
    audioBuffer.length
  );
  const frameCount = Math.max(1, endFrame - startFrame);
  const outputBuffer = new AudioBuffer({
    length: frameCount,
    numberOfChannels: 2,
    sampleRate
  });
  const sourceLeft = audioBuffer.getChannelData(0);
  const sourceRight = audioBuffer.numberOfChannels > 1
    ? audioBuffer.getChannelData(1)
    : sourceLeft;
  const gain = state.muted ? 0 : clamp(state.volume / 100, 0, 1);

  [sourceLeft, sourceRight].forEach((sourceChannel, channelIndex) => {
    const destination = outputBuffer.getChannelData(channelIndex);
    const sourceSlice = sourceChannel.subarray(startFrame, endFrame);
    if (gain === 1) {
      destination.set(sourceSlice);
    } else if (gain !== 0) {
      for (let index = 0; index < sourceSlice.length; index += 1) {
        destination[index] = sourceSlice[index] * gain;
      }
    }
  });

  return outputBuffer;
}

async function encodeAudioIntoMuxer(
  muxer,
  audioBuffer,
  startSeconds = 0,
  endSeconds = audioBuffer.duration
) {
  if (!window.AudioEncoder || !window.AudioData) {
    return { encoded: false, reason: "AudioEncoder is unavailable." };
  }

  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = 2;
  const audioConfig = {
    codec: "mp4a.40.2",
    sampleRate,
    numberOfChannels,
    bitrate: 192_000
  };

  let support;
  try {
    support = await AudioEncoder.isConfigSupported(audioConfig);
  } catch (error) {
    return { encoded: false, reason: error.message };
  }

  if (!support.supported) {
    return { encoded: false, reason: "AAC encoding is unsupported." };
  }

  let encodingError = null;
  const encoder = new AudioEncoder({
    output: (chunk, metadata) => muxer.addAudioChunk(chunk, metadata),
    error: (error) => {
      encodingError = error;
    }
  });
  encoder.configure(support.config || audioConfig);
  const unregisterAudioCancel = registerVideoExportCancelHandler(() => {
    try {
      if (encoder.state === "configured") encoder.reset();
    } catch (error) {
      console.warn("Audio encoder cancellation failed", error);
    }
  });

  const sourceLeft = audioBuffer.getChannelData(0);
  const sourceRight = audioBuffer.numberOfChannels > 1
    ? audioBuffer.getChannelData(1)
    : sourceLeft;
  const gain = state.muted ? 0 : clamp(state.volume / 100, 0, 1);
  const chunkSize = 2048;
  const startFrame = clamp(Math.floor(startSeconds * sampleRate), 0, audioBuffer.length);
  const endFrame = clamp(Math.ceil(endSeconds * sampleRate), startFrame, audioBuffer.length);
  const totalFrames = endFrame - startFrame;

  try {
    for (let offset = 0; offset < totalFrames; offset += chunkSize) {
      if (state.videoExportCancelled) break;
      if (encodingError) throw encodingError;

      const frameCount = Math.min(chunkSize, totalFrames - offset);
      const planarData = new Float32Array(frameCount * numberOfChannels);

      for (let index = 0; index < frameCount; index += 1) {
        const sourceIndex = startFrame + offset + index;
        planarData[index] = sourceLeft[sourceIndex] * gain;
        planarData[frameCount + index] = sourceRight[sourceIndex] * gain;
      }

      const audioData = new AudioData({
        format: "f32-planar",
        sampleRate,
        numberOfFrames: frameCount,
        numberOfChannels,
        timestamp: Math.round((offset / sampleRate) * 1_000_000),
        data: planarData
      });

      encoder.encode(audioData);
      audioData.close();
      await waitForEncoderQueue(encoder, 8);
      await nextEventLoopTurn();
    }

    if (!state.videoExportCancelled) {
      await encoder.flush();
    }
  } finally {
    unregisterAudioCancel();
    try {
      if (encoder.state !== "closed") encoder.close();
    } catch (error) {
      if (!state.videoExportCancelled) {
        console.warn("Audio encoder cleanup failed", error);
      }
    }
  }

  if (encodingError) throw encodingError;
  return { encoded: !state.videoExportCancelled, reason: "" };
}

async function renderVideoExportFrames({
  formatLabel,
  frameRate,
  totalFrames,
  duration,
  exportStart,
  exportEnd,
  startingRotation,
  startingBinaryTime,
  startingFrame,
  addFrame
}) {
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
    if (state.videoExportCancelled) break;

    const elapsedExportTime = Math.min(duration, frameIndex / frameRate);
    const exportTime = Math.min(exportEnd, exportStart + elapsedExportTime);
    state.exportPlaybackTimeOverride = exportTime;
    state.frame = startingFrame + frameIndex;
    state.binaryStreamTime = startingBinaryTime + elapsedExportTime;
    state.binaryDeletionFrameDelta = 1 / frameRate;

    if (state.autoRotate) {
      state.rotation = normalizeRotation(
        startingRotation + elapsedExportTime * state.rotateSpeed
      );
    }

    state.geometryCache = null;
    updateHistory(true);
    drawScene();

    // Give the browser a chance to dispatch the modal cancel click before
    // handing another frame to the encoder.
    await nextEventLoopTurn();
    if (state.videoExportCancelled) break;

    await addFrame(frameIndex);
    await nextEventLoopTurn();
    if (state.videoExportCancelled) break;

    if (frameIndex % Math.max(1, Math.round(frameRate / 3)) === 0) {
      const percent = Math.min(
        90,
        Math.round(((frameIndex + 1) / totalFrames) * 90)
      );
      setVideoExportStatus(
        `Encoding ${formatLabel} video… ${percent}% · ${frameIndex + 1}/${totalFrames} frames`,
        "active"
      );
      setVideoExportProgress(
        percent,
        `Encoding frame ${frameIndex + 1} of ${totalFrames}`
      );
    }
  }
}

async function exportVideo() {
  if (state.isExportingVideo) {
    requestVideoExportCancel();
    return;
  }

  if (!state.hasAudio || !state.analysisReady || !state.decodedAudioBuffer) {
    setVideoExportStatus(
      "Load and finish analyzing an audio file before exporting video.",
      "error"
    );
    return;
  }

  const fileType = getSelectedVideoFileType();
  const formatLabel = getVideoFormatLabel(fileType);

  if (isFirefoxBrowser && fileType === "mp4") {
    setVideoExportStatus(
      "Firefox does not provide reliable H.264 decoder metadata for MP4 muxing. Select MKV, which uses a Firefox-compatible codec path, or export MP4 in Chrome/Edge.",
      "error"
    );
    return;
  }

  if (!window.VideoEncoder || !window.VideoFrame) {
    setVideoExportStatus(
      `${formatLabel} export requires a browser with WebCodecs video encoding support.`,
      "error"
    );
    return;
  }

  const resolution = getViewportResolutionDimensions();
  const frameRate = Number(elements.videoFrameRate.value) || videoExportDefaults.frameRate;
  const baseBitrateMbps = Number(elements.videoBitrate.value) || videoExportDefaults.bitrateMbps;
  const videoBitrate = getEffectiveVideoBitrate(
    baseBitrateMbps,
    resolution.width,
    resolution.height
  );
  const effectiveBitrateMbps = videoBitrate / 1_000_000;
  const exportRange = getVideoExportRange();
  const exportStart = exportRange.start;
  const exportEnd = exportRange.end;
  const duration = Math.max(0.001, exportRange.duration);
  const totalFrames = Math.max(1, Math.ceil(duration * frameRate));

  state.isExportingVideo = true;
  state.videoExportCancelled = false;
  state.videoExportCancelHandlers.clear();
  beginVideoExportUi();
  elements.exportVideo.textContent = "Cancel Video Export";
  elements.exportPng.disabled = true;
  elements.exportJson.disabled = true;
  elements.videoFileType.disabled = true;
  elements.videoFrameRate.disabled = true;
  elements.videoBitrate.disabled = true;
  elements.viewportResolution.disabled = true;
  setVideoExportStatus(
    `Preparing ${formatLabel} encoder · ${frameRate} FPS · ${effectiveBitrateMbps.toFixed(1)} Mbps quality mode…`,
    "active"
  );
  setVideoExportProgress(1, "Preparing encoder");

  const saved = {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    dpr: state.dpr,
    rotation: state.rotation,
    frame: state.frame,
    binaryStreamTime: state.binaryStreamTime,
    binaryStreamFrameInterval: state.binaryStreamFrameInterval,
    binaryDeletionFrameDelta: state.binaryDeletionFrameDelta,
    binaryDeletedNumbers: new Set(state.binaryDeletedNumbers),
    fpsValue: state.fpsValue,
    exportFrameRateOverride: state.exportFrameRateOverride,
    audioTime: audio.currentTime,
    audioWasPlaying: !audio.paused && !audio.ended,
    smoothPlaybackTime: state.smoothPlaybackTime,
    smoothPlaybackValid: state.smoothPlaybackValid,
    smoothPlaybackLastTimestamp: state.smoothPlaybackLastTimestamp
  };

  let videoEncoder = null;
  let mediabunnyOutput = null;

  try {
    audio.pause();
    await prepareExportLogoImage();
    throwIfVideoExportCancelled();

    const renderTarget = getWebpageRenderDimensions();
    const exportScale = Math.min(
      resolution.width / renderTarget.width,
      resolution.height / renderTarget.height
    );
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    state.dpr = exportScale;
    state.geometryCache = null;
    state.hudLayer = null;
    state.hudSpectrumSmoothed = null;
    state.fpsValue = frameRate;
    state.exportFrameRateOverride = frameRate;

    const startingRotation = saved.rotation;
    const startingBinaryTime = saved.binaryStreamTime;
    state.frame = saved.frame;

    if (fileType === "mkv") {
      const {
        Output,
        MkvOutputFormat,
        BufferTarget,
        CanvasSource,
        AudioBufferSource,
        getFirstEncodableVideoCodec,
        getFirstEncodableAudioCodec
      } = await loadMediabunnyModule();
      throwIfVideoExportCancelled();

      // Firefox's AVC encoder can report support while omitting the first
      // chunk's decoderConfig. Prefer royalty-free codecs there so the
      // muxer receives complete, usable packet metadata.
      const preferredVideoCodecs = isFirefoxBrowser
        ? ["vp9", "vp8", "av1", "avc"]
        : ["avc", "vp9", "vp8", "av1"];
      const selectedVideoCodec = await getFirstEncodableVideoCodec(
        preferredVideoCodecs,
        {
          width: resolution.width,
          height: resolution.height,
          bitrate: videoBitrate
        }
      );
      const selectedAudioCodec = await getFirstEncodableAudioCodec(
        ["opus", "aac"],
        {
          numberOfChannels: 2,
          sampleRate: 48_000,
          bitrate: 192_000
        }
      );
      throwIfVideoExportCancelled();

      if (!selectedVideoCodec) {
        throw new Error(
          "No Firefox-compatible MKV video encoder is available for the selected resolution and bitrate."
        );
      }
      if (!selectedAudioCodec) {
        throw new Error(
          "No compatible MKV audio encoder is available in this browser."
        );
      }

      setVideoExportStatus(
        `Preparing MKV ${selectedVideoCodec.toUpperCase()} + ${selectedAudioCodec.toUpperCase()} encoders…`,
        "active"
      );

      const target = new BufferTarget();
      mediabunnyOutput = new Output({
        format: new MkvOutputFormat(),
        target
      });
      const videoSource = new CanvasSource(canvas, {
        codec: selectedVideoCodec,
        bitrate: videoBitrate,
        bitrateMode: "variable",
        latencyMode: "quality",
        keyFrameInterval: 2,
        hardwareAcceleration: "no-preference",
        contentHint: "detail"
      });
      const audioSource = new AudioBufferSource({
        codec: selectedAudioCodec,
        bitrate: 192_000,
        transform: {
          numberOfChannels: 2,
          sampleRate: 48_000
        }
      });

      mediabunnyOutput.addVideoTrack(videoSource, { frameRate });
      mediabunnyOutput.addAudioTrack(audioSource);
      await mediabunnyOutput.start();

      let mkvCancelPromise = null;
      const cancelMkvExport = () => {
        if (mkvCancelPromise) return mkvCancelPromise;
        mkvCancelPromise = (async () => {
          try {
            videoSource.close();
          } catch (error) {
            console.warn("MKV video source cancellation failed", error);
          }
          try {
            audioSource.close();
          } catch (error) {
            console.warn("MKV audio source cancellation failed", error);
          }
          if (
            mediabunnyOutput &&
            ["pending", "started"].includes(mediabunnyOutput.state)
          ) {
            await mediabunnyOutput.cancel();
          }
        })();
        return mkvCancelPromise;
      };
      registerVideoExportCancelHandler(cancelMkvExport);
      throwIfVideoExportCancelled();

      const exportAudioBuffer = createExportAudioBufferSegment(
        state.decodedAudioBuffer,
        exportStart,
        exportEnd
      );
      let audioEncodingError = null;
      const audioEncodingPromise = audioSource
        .add(exportAudioBuffer)
        .catch((error) => {
          audioEncodingError = error;
        })
        .finally(() => {
          try {
            audioSource.close();
          } catch (error) {
            console.warn("MKV audio source cleanup failed", error);
          }
        });

      await renderVideoExportFrames({
        formatLabel,
        frameRate,
        totalFrames,
        duration,
        exportStart,
        exportEnd,
        startingRotation,
        startingBinaryTime,
        startingFrame: saved.frame,
        addFrame: (frameIndex) => {
          if (state.videoExportCancelled) return;
          const timing = getVideoFrameTiming(frameIndex, frameRate);
          return videoSource.add(
            timing.timestampSeconds,
            timing.durationSeconds,
            { keyFrame: frameIndex % Math.max(1, frameRate * 2) === 0 }
          );
        }
      });
      if (!state.videoExportCancelled) videoSource.close();

      if (state.videoExportCancelled) {
        await cancelMkvExport();
        await audioEncodingPromise;
        setVideoExportStatus("Video export cancelled.", "idle");
        return;
      }

      setVideoExportStatus("Encoding synchronized audio… 92%", "active");
      setVideoExportProgress(92, "Encoding audio");
      await audioEncodingPromise;
      if (audioEncodingError) throw audioEncodingError;

      if (state.videoExportCancelled) {
        await cancelMkvExport();
        setVideoExportStatus("Video export cancelled.", "idle");
        return;
      }

      setVideoExportStatus("Finalizing MKV container… 98%", "active");
      setVideoExportProgress(98, "Finalizing MKV");
      await mediabunnyOutput.finalize();
      const blob = new Blob([target.buffer], { type: "video/x-matroska" });
      const base = getExportFileBaseName();
      downloadBlob(blob, `${base}.mkv`);
      setVideoExportStatus(
        `MKV exported with ${selectedVideoCodec.toUpperCase()} video and ${selectedAudioCodec.toUpperCase()} audio · ${(blob.size / 1048576).toFixed(1)} MB`,
        "idle"
      );
      setVideoExportProgress(100, "Export complete");
    } else {
      const { Muxer, ArrayBufferTarget } = await loadMp4MuxerModule();
      throwIfVideoExportCancelled();
      const videoConfig = await chooseSupportedAvcConfig(
        resolution.width,
        resolution.height,
        videoBitrate,
        frameRate
      );
      throwIfVideoExportCancelled();

      let audioSupported = false;
      if (window.AudioEncoder && window.AudioData) {
        try {
          const audioSupport = await AudioEncoder.isConfigSupported({
            codec: "mp4a.40.2",
            sampleRate: state.decodedAudioBuffer.sampleRate,
            numberOfChannels: 2,
            bitrate: 192_000
          });
          audioSupported = Boolean(audioSupport.supported);
        } catch (error) {
          console.warn("AAC support check failed", error);
        }
      }

      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: {
          codec: "avc",
          width: resolution.width,
          height: resolution.height
        },
        ...(audioSupported
          ? {
              audio: {
                codec: "aac",
                sampleRate: state.decodedAudioBuffer.sampleRate,
                numberOfChannels: 2
              }
            }
          : {}),
        fastStart: "in-memory"
      });

      let encoderError = null;
      let encodedVideoFrameCount = 0;
      videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => {
          encodedVideoFrameCount += 1;
          muxer.addVideoChunk(chunk, metadata);
        },
        error: (error) => {
          encoderError = error;
        }
      });
      videoEncoder.configure(videoConfig);
      registerVideoExportCancelHandler(() => {
        try {
          if (videoEncoder && videoEncoder.state === "configured") {
            videoEncoder.reset();
          }
        } catch (error) {
          console.warn("Video encoder cancellation failed", error);
        }
      });

      await renderVideoExportFrames({
        formatLabel,
        frameRate,
        totalFrames,
        duration,
        exportStart,
        exportEnd,
        startingRotation,
        startingBinaryTime,
        startingFrame: saved.frame,
        addFrame: async (frameIndex) => {
          if (state.videoExportCancelled) return;
          if (encoderError) throw encoderError;
          const timing = getVideoFrameTiming(frameIndex, frameRate);
          const frame = new VideoFrame(canvas, {
            timestamp: timing.timestampUs,
            duration: timing.durationUs
          });
          videoEncoder.encode(frame, {
            keyFrame: frameIndex % Math.max(1, frameRate * 2) === 0
          });
          frame.close();
          // Keep at most one queued encode request. This applies real
          // backpressure instead of allowing a burst that can overload a
          // browser encoder and create uneven output cadence.
          await waitForEncoderQueue(videoEncoder, 1);
        }
      });

      if (state.videoExportCancelled) {
        setVideoExportStatus("Video export cancelled.", "idle");
        return;
      }

      await videoEncoder.flush();
      if (encoderError) throw encoderError;
      if (encodedVideoFrameCount !== totalFrames) {
        throw new Error(
          `Video encoder returned ${encodedVideoFrameCount} of ${totalFrames} frames. Retry at a lower resolution or use a different browser.`
        );
      }

      let audioResult = { encoded: false, reason: "AAC unavailable." };
      if (audioSupported) {
        setVideoExportStatus("Encoding synchronized audio… 92%", "active");
        setVideoExportProgress(92, "Encoding audio");
        audioResult = await encodeAudioIntoMuxer(
          muxer,
          state.decodedAudioBuffer,
          exportStart,
          exportEnd
        );
      }

      if (state.videoExportCancelled) {
        setVideoExportStatus("Video export cancelled.", "idle");
        return;
      }

      setVideoExportStatus("Finalizing MP4 container… 98%", "active");
      setVideoExportProgress(98, "Finalizing MP4");
      muxer.finalize();
      const blob = new Blob([target.buffer], { type: "video/mp4" });
      const base = getExportFileBaseName();
      downloadBlob(blob, `${base}.mp4`);

      setVideoExportStatus(
        audioResult.encoded
          ? `MP4 exported with synchronized audio · ${(blob.size / 1048576).toFixed(1)} MB`
          : `MP4 exported without audio (${audioResult.reason}) · ${(blob.size / 1048576).toFixed(1)} MB`,
        "idle"
      );
      setVideoExportProgress(100, "Export complete");
    }
  } catch (error) {
    if (state.videoExportCancelled) {
      setVideoExportStatus("Video export cancelled.", "idle");
    } else {
      console.error("Video export failed", error);
      const errorMessage =
        error && typeof error.message === "string"
          ? error.message
          : String(error || "Unknown video export error");
      const isMissingDecoderConfigError =
        /decoderConfig/i.test(errorMessage) &&
        /null|undefined|colorSpace/i.test(errorMessage);
      setVideoExportStatus(
        isMissingDecoderConfigError
          ? "VIDEO EXPORT ERROR / The browser omitted required codec metadata. In Firefox, select MKV and retry; use Chrome or Edge for MP4."
          : `VIDEO EXPORT ERROR / ${errorMessage}`,
        "error"
      );
    }
  } finally {
    try {
      if (videoEncoder && videoEncoder.state !== "closed") {
        videoEncoder.close();
      }
    } catch (error) {
      console.warn("Video encoder cleanup failed", error);
    }

    try {
      if (
        mediabunnyOutput &&
        ["pending", "started"].includes(mediabunnyOutput.state)
      ) {
        await mediabunnyOutput.cancel();
      }
    } catch (error) {
      console.warn("MKV output cleanup failed", error);
    }

    state.exportPlaybackTimeOverride = null;
    state.exportFrameRateOverride = saved.exportFrameRateOverride;
    canvas.width = saved.canvasWidth;
    canvas.height = saved.canvasHeight;
    state.dpr = saved.dpr;
    state.rotation = saved.rotation;
    state.frame = saved.frame;
    state.binaryStreamTime = saved.binaryStreamTime;
    state.binaryStreamTargetTime = saved.binaryStreamTime;
    state.binaryStreamFrameInterval = saved.binaryStreamFrameInterval;
    state.binaryStreamClockValid = false;
    state.lastBinaryStreamTimestamp = 0;
    state.binaryDeletionFrameDelta = saved.binaryDeletionFrameDelta;
    state.binaryDeletedNumbers.clear();
    for (const value of saved.binaryDeletedNumbers) {
      state.binaryDeletedNumbers.add(value);
    }
    state.fpsValue = saved.fpsValue;
    state.smoothPlaybackTime = saved.smoothPlaybackTime;
    state.smoothPlaybackValid = saved.smoothPlaybackValid;
    state.smoothPlaybackLastTimestamp = saved.smoothPlaybackLastTimestamp;
    state.geometryCache = null;
    state.hudLayer = null;
    state.hudSpectrumSmoothed = null;
    state.isExportingVideo = false;
    state.videoExportCancelled = false;
    state.videoExportCancelHandlers.clear();

    elements.exportVideo.disabled = false;
    elements.exportPng.disabled = false;
    elements.exportJson.disabled = false;
    elements.videoFileType.disabled = false;
    elements.videoFrameRate.disabled = false;
    elements.videoBitrate.disabled = false;
    elements.viewportResolution.disabled = false;
    updateVideoExportFormatUi(false);

    if (Number.isFinite(saved.audioTime)) {
      audio.currentTime = clamp(saved.audioTime, 0, audio.duration || saved.audioTime);
    }
    updateHistory(true);
    drawScene();
    state.needsRender = false;
    endVideoExportUi();

    if (saved.audioWasPlaying && state.hasAudio && state.analysisReady) {
      try {
        await ensureAudioGraph();
        await audio.play();
      } catch (error) {
        console.warn("Playback could not resume after export", error);
      }
    }
  }
}

elements.videoFileType.addEventListener("change", () => {
  updateVideoExportFormatUi(true);
});
elements.exportVideo.addEventListener("click", exportVideo);

// Cancel on pointer-down so the request is processed before any ancestor
// drag behavior can capture the pointer. The click listener remains for
// keyboard activation and assistive technology.
elements.videoExportCancel.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  requestVideoExportCancel();
});
elements.videoExportCancel.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  requestVideoExportCancel();
});

function collectExportedControlValues() {
  return {
    fftSize: state.fftSize,
    lineCount: state.lineCount,
    lineHeight: state.lineHeight,
    zoom: state.zoom,
    rotation: state.rotation,
    rotateSpeed: state.rotateSpeed,
    autoRotate: state.autoRotate,
    elevation: state.elevation,
    audioLoop: state.audioLoop,
    loopBpm: state.loopBpm,
    loopBars: state.loopBars,
    loopSnap: state.loopSnap,
    loopStart: state.loopStart,
    loopEnd: state.loopEnd,
    loopZoomStart: state.loopZoomStart,
    loopZoomEnd: state.loopZoomEnd,
    volume: state.volume,
    muted: state.muted,
    binaryCount: state.binaryCount,
    binaryFontSize: state.binaryFontSize,
    binaryNumberOffset: state.binaryNumberOffset,
    binaryFade: state.binaryFade,
    binaryDeletion: state.binaryDeletion,
    binaryDeletionSpeed: state.binaryDeletionSpeed,
    viewportSize: state.viewportSize,
    viewportResolution: state.viewportResolution,
    videoFileType: getSelectedVideoFileType(),
    videoFrameRate: Number(elements.videoFrameRate.value) || videoExportDefaults.frameRate,
    videoBitrateMbps: Number(elements.videoBitrate.value) || videoExportDefaults.bitrateMbps,
    productionBuild: true,
    viewportPreset: elements.viewportPreset.value,
    orientation: state.orientation,
    aspectRatio: state.aspectRatio,
    frequencyGraphPlacement: state.frequencyGraphPlacement,
    waveformGraphPlacement: state.waveformGraphPlacement,
    levelsGraphPlacement: state.levelsGraphPlacement,
    graphWidth: state.graphWidth,
    graphHeight: state.graphHeight,
    metadataX: state.metadataX,
    metadataY: state.metadataY,
    guiTextSize: state.guiTextSize,
    logoVisible: state.logoVisible,
    logoX: state.logoX,
    logoY: state.logoY,
    logoSize: state.logoSize,
    backgroundColor: state.backgroundColor,
    lineWidth: state.lineWidth,
    lineColor: state.lineColor,
    meshColor: state.backgroundColor,
    opacity: state.opacity
  };
}

elements.exportJson.addEventListener("click", () => {
  const exportFileBase = getExportFileBaseName();
  const settings = {
    version: 1,
    defaultsSource: "13.json",
    exportedAt: new Date().toISOString(),
    audioFile: state.fileName || null,
    exportFileName: exportFileBase,
    visualization: collectExportedControlValues()
  };

  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json"
  });
  downloadBlob(blob, `${exportFileBase}-settings.json`);
});

elements.fftSize.addEventListener("change", () => {
  state.fftSize = Number(elements.fftSize.value);
  resetHistory();
  if (state.decodedAudioBuffer) {
    scheduleReanalysis();
  } else {
    state.fftReanalysisVersion += 1;
    hideFftLoadProgress();
  }
});

bindRange(
  elements.lineCount,
  elements.lineCountValue,
  "lineCount",
  (value) => String(value),
  () => {
    resetHistory();
    if (!audio.paused && state.analysisReady) {
      updateHistory();
    }
  }
);

bindRange(
  elements.lineHeight,
  elements.lineHeightValue,
  "lineHeight",
  (value) => value.toFixed(2)
);

bindRange(
  elements.zoom,
  elements.zoomValue,
  "zoom",
  (value) => value.toFixed(2)
);

bindRange(
  elements.rotation,
  elements.rotationValue,
  "rotation",
  (value) => value.toFixed(2)
);

bindRange(
  elements.rotateSpeed,
  elements.rotateSpeedValue,
  "rotateSpeed",
  (value) => String(Math.round(value))
);

bindRange(
  elements.elevation,
  elements.elevationValue,
  "elevation",
  (value) => value.toFixed(2)
);

elements.autoRotate.checked = state.autoRotate;
elements.autoRotate.addEventListener("change", () => {
  state.autoRotate = elements.autoRotate.checked;
  state.lastAutoRotateTimestamp = 0;
  markRenderDirty();
});

elements.loopBpmValue.addEventListener("input", () => {
  const value = Number(elements.loopBpmValue.value);
  if (!Number.isFinite(value) || !state.loopReady) return;
  state.loopBpm = clamp(value, 40, 300);
  applyLoopBars();
  setLoopStatus(`Manual BPM set to ${Math.round(state.loopBpm)}.`, "active");
});

elements.loopBpmValue.addEventListener("change", () => {
  state.loopBpm = clamp(Number(elements.loopBpmValue.value) || loopDefaults.bpm, 40, 300);
  elements.loopBpmValue.value = String(Math.round(state.loopBpm));
  applyLoopBars();
});

elements.loopBarsValue.addEventListener("input", () => {
  const value = Number(elements.loopBarsValue.value);
  if (!Number.isFinite(value) || !state.loopReady) return;
  state.loopBars = clamp(Math.round(value), 1, 999);
  applyLoopBars();
});

elements.loopBarsValue.addEventListener("change", () => {
  state.loopBars = clamp(Math.round(Number(elements.loopBarsValue.value) || 1), 1, 999);
  elements.loopBarsValue.value = String(state.loopBars);
  applyLoopBars();
});

elements.loopSnap.addEventListener("change", () => {
  state.loopSnap = elements.loopSnap.checked;
  if (state.loopSnap) moveLoopSelectionTo(state.loopStart);
});

elements.detectLoopBpm.addEventListener("click", () => {
  void runLoopBpmDetection();
});
elements.fullTrackLoop.addEventListener("click", setFullTrackLoop);

[elements.loopStartHandle, elements.loopEndHandle, elements.loopSelectionRegion]
  .forEach((target) => {
    target.addEventListener("pointerdown", beginLoopSelectionDrag);
    target.addEventListener("pointermove", continueLoopSelectionDrag);
    target.addEventListener("pointerup", endLoopSelectionDrag);
    target.addEventListener("pointercancel", endLoopSelectionDrag);
  });

elements.loopZoomIn.addEventListener("click", () => {
  zoomLoopAtX(elements.loopWaveWrap.getBoundingClientRect().width / 2, 2);
});
elements.loopZoomOut.addEventListener("click", () => {
  zoomLoopAtX(elements.loopWaveWrap.getBoundingClientRect().width / 2, 0.5);
});
elements.loopZoomFit.addEventListener("click", fitLoopZoom);

elements.loopWaveWrap.addEventListener("wheel", (event) => {
  if (!state.loopReady) return;
  event.preventDefault();
  const rect = elements.loopWaveWrap.getBoundingClientRect();
  zoomLoopAtX(
    event.clientX - rect.left,
    event.deltaY < 0 ? 1.6 : 0.625
  );
}, { passive: false });

elements.loopWaveWrap.addEventListener("pointerdown", (event) => {
  if (!state.loopReady || event.target !== elements.loopWaveCanvas) return;
  const rect = elements.loopWaveWrap.getBoundingClientRect();
  const range = getLoopZoomRange();
  const amount = clamp(
    (event.clientX - rect.left) / Math.max(1, rect.width),
    0,
    1
  );
  const time = range.start + amount * range.width;
  audio.currentTime = time;
  resetSmoothPlaybackTo(time);
  updateLoopPlayhead(time);
  updateHistory(true);
  event.preventDefault();
});

elements.loopMinimapWindow.addEventListener("pointerdown", (event) => {
  if (!state.loopReady || event.button > 0) return;
  state.loopMinimapDragPointerId = event.pointerId;
  state.loopMinimapDragStartX = event.clientX;
  state.loopMinimapOriginalZoomStart = getLoopZoomRange().start;
  elements.loopMinimapWindow.classList.add("is-dragging");
  elements.loopMinimapWindow.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
});

elements.loopMinimapWindow.addEventListener("pointermove", (event) => {
  if (event.pointerId !== state.loopMinimapDragPointerId) return;
  const rect = elements.loopMinimapWrap.getBoundingClientRect();
  const range = getLoopZoomRange();
  const delta =
    ((event.clientX - state.loopMinimapDragStartX) / Math.max(1, rect.width)) *
    range.duration;
  const nextStart = state.loopMinimapOriginalZoomStart + delta;
  setLoopZoomWindow(nextStart, nextStart + range.width);
  event.preventDefault();
});

const endLoopMinimapDrag = (event) => {
  if (event.pointerId !== state.loopMinimapDragPointerId) return;
  state.loopMinimapDragPointerId = null;
  elements.loopMinimapWindow.classList.remove("is-dragging");
  if (elements.loopMinimapWindow.hasPointerCapture(event.pointerId)) {
    elements.loopMinimapWindow.releasePointerCapture(event.pointerId);
  }
};
elements.loopMinimapWindow.addEventListener("pointerup", endLoopMinimapDrag);
elements.loopMinimapWindow.addEventListener("pointercancel", endLoopMinimapDrag);

elements.loopMinimapWrap.addEventListener("pointerdown", (event) => {
  if (!state.loopReady || event.target === elements.loopMinimapWindow) return;
  const rect = elements.loopMinimapWrap.getBoundingClientRect();
  const range = getLoopZoomRange();
  const centerTime = clamp(
    (event.clientX - rect.left) / Math.max(1, rect.width),
    0,
    1
  ) * range.duration;
  setLoopZoomWindow(
    centerTime - range.width / 2,
    centerTime + range.width / 2
  );
});

elements.loopMinimapWindow.addEventListener("keydown", (event) => {
  if (!state.loopReady || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const range = getLoopZoomRange();
  const direction = event.key === "ArrowLeft" ? -1 : 1;
  const step = range.width * (event.shiftKey ? 0.25 : 0.08);
  setLoopZoomWindow(
    range.start + direction * step,
    range.end + direction * step
  );
  event.preventDefault();
});

elements.loopEditor.addEventListener("keydown", (event) => {
  const active = document.activeElement;
  if (active && active.matches("input, textarea, select, [contenteditable='true']")) return;
  if (event.key === "+" || event.key === "=") {
    zoomLoopAtX(elements.loopWaveWrap.getBoundingClientRect().width / 2, 2);
    event.preventDefault();
  } else if (event.key === "-") {
    zoomLoopAtX(elements.loopWaveWrap.getBoundingClientRect().width / 2, 0.5);
    event.preventDefault();
  } else if (event.key === "0") {
    fitLoopZoom();
    event.preventDefault();
  }
});

state.loopResizeObserver = new ResizeObserver(() => {
  drawLoopWaveform();
  drawLoopMinimap();
  updateLoopSelectionUi();
});
state.loopResizeObserver.observe(elements.loopWaveWrap);
state.loopResizeObserver.observe(elements.loopMinimapWrap);

elements.audioLoop.checked = state.audioLoop;
updateAudioLoopMode();
elements.audioLoop.addEventListener("change", () => {
  state.audioLoop = elements.audioLoop.checked;
  updateAudioLoopMode();
  if (state.audioLoop && hasPartialLoopSelection()) {
    const range = getSelectedLoopRange();
    if (audio.currentTime < range.start || audio.currentTime >= range.end) {
      audio.currentTime = range.start;
      resetSmoothPlaybackTo(range.start);
      updateHistory(true);
    }
  }
});

bindRange(
  elements.volume,
  elements.volumeValue,
  "volume",
  (value) => String(Math.round(value)),
  (value) => {
    audio.volume = Math.max(0, Math.min(1, value / 100));
  }
);

bindRange(
  elements.binaryCount,
  elements.binaryCountValue,
  "binaryCount",
  (value) => String(Math.round(value))
);

bindRange(
  elements.binaryFontSize,
  elements.binaryFontSizeValue,
  "binaryFontSize",
  (value) => value.toFixed(1)
);

bindRange(
  elements.binaryNumberOffset,
  elements.binaryNumberOffsetValue,
  "binaryNumberOffset",
  (value) => value.toFixed(1)
);

bindRange(
  elements.binaryFade,
  elements.binaryFadeValue,
  "binaryFade",
  (value) => String(Math.round(value))
);

bindRange(
  elements.binaryDeletion,
  elements.binaryDeletionValue,
  "binaryDeletion",
  (value) => String(Math.round(value))
);

bindRange(
  elements.binaryDeletionSpeed,
  elements.binaryDeletionSpeedValue,
  "binaryDeletionSpeed",
  (value) => value.toFixed(2)
);

bindRange(
  elements.viewportSize,
  elements.viewportSizeValue,
  "viewportSize",
  (value) => String(Math.round(value)),
  fitViewport
);

bindRange(
  elements.lineWidth,
  elements.lineWidthValue,
  "lineWidth",
  (value) => value.toFixed(1)
);

bindRange(
  elements.opacity,
  elements.opacityValue,
  "opacity",
  (value) => String(Math.round(value))
);

elements.viewportResolution.addEventListener("change", () => {
  state.viewportResolution = elements.viewportResolution.value;
  state.geometryCache = null;
  resizeCanvas();
  markRenderDirty();
});

elements.viewportPreset.addEventListener("change", () => {
  applyProductionViewportPreset(elements.viewportPreset.value);
});

elements.orientation.addEventListener("change", () => {
  state.orientation = elements.orientation.value;
  state.geometryCache = null;
  fitViewport();
  markRenderDirty();
});

elements.aspectRatio.addEventListener("change", () => {
  state.aspectRatio = elements.aspectRatio.value;
  updateExportFormatControls();
  state.geometryCache = null;
  fitViewport();
  markRenderDirty();
});

elements.frequencyGraphPlacement.addEventListener("change", () => {
  state.frequencyGraphPlacement =
    elements.frequencyGraphPlacement.value;
  state.hudLayer = null;
  markRenderDirty();
});

elements.waveformGraphPlacement.addEventListener("change", () => {
  state.waveformGraphPlacement = elements.waveformGraphPlacement.value;
  state.hudLayer = null;
  markRenderDirty();
});

elements.levelsGraphPlacement.addEventListener("change", () => {
  state.levelsGraphPlacement = elements.levelsGraphPlacement.value;
  state.hudLayer = null;
  markRenderDirty();
});

bindRange(
  elements.graphWidth,
  elements.graphWidthValue,
  "graphWidth",
  (value) => String(Math.round(value)),
  () => { state.hudLayer = null; }
);

bindRange(
  elements.graphHeight,
  elements.graphHeightValue,
  "graphHeight",
  (value) => value.toFixed(1),
  () => { state.hudLayer = null; }
);

bindRange(
  elements.metadataX,
  elements.metadataXValue,
  "metadataX",
  (value) => value.toFixed(2),
  () => { state.hudLayer = null; }
);

bindRange(
  elements.metadataY,
  elements.metadataYValue,
  "metadataY",
  (value) => value.toFixed(2),
  () => { state.hudLayer = null; }
);

bindRange(
  elements.guiTextSize,
  elements.guiTextSizeValue,
  "guiTextSize",
  (value) => value.toFixed(2),
  () => { state.hudLayer = null; }
);

elements.logoVisible.addEventListener("change", () => {
  state.logoVisible = elements.logoVisible.checked;
  updateViewportLogoLayout();
  markRenderDirty();
});

bindRange(
  elements.logoX,
  elements.logoXValue,
  "logoX",
  (value) => value.toFixed(1),
  updateViewportLogoLayout
);

bindRange(
  elements.logoY,
  elements.logoYValue,
  "logoY",
  (value) => value.toFixed(1),
  updateViewportLogoLayout
);

bindRange(
  elements.logoSize,
  elements.logoSizeValue,
  "logoSize",
  (value) => value.toFixed(1),
  updateViewportLogoLayout
);

function normalizeHexColor(value) {
  const raw = String(value || "").trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split("").map((character) => character + character).join("")}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw}`.toLowerCase();
  }
  return null;
}

function applyBackgroundColor(value) {
  const normalized = normalizeHexColor(value);
  if (!normalized) return false;
  elements.backgroundColor.value = normalized;
  elements.backgroundColorHex.value = normalized.toUpperCase();
  state.backgroundColor = normalized;
  state.meshColor = normalized;
  state.surfacePaletteCache = null;
  state.hudLayer = null;
  elements.viewportFrame.style.background = normalized;
  canvas.style.background = normalized;
  markRenderDirty();
  return true;
}

function applyLineColor(value) {
  const normalized = normalizeHexColor(value);
  if (!normalized) return false;
  elements.lineColor.value = normalized;
  elements.lineColorHex.value = normalized.toUpperCase();
  state.lineColor = normalized;
  state.hudLayer = null;
  document.documentElement.style.setProperty("--accent", normalized);
  markRenderDirty();
  return true;
}

function bindHexColorInput(hexInput, colorInput, applyColor) {
  hexInput.addEventListener("input", () => {
    const normalized = normalizeHexColor(hexInput.value);
    hexInput.setCustomValidity(normalized ? "" : "Enter a six-digit hexadecimal color.");
    if (normalized) applyColor(normalized);
  });

  const commitHexValue = () => {
    const fallback = colorInput.value;
    const normalized = normalizeHexColor(hexInput.value);
    if (normalized) {
      applyColor(normalized);
      hexInput.setCustomValidity("");
    } else {
      hexInput.value = fallback.toUpperCase();
      hexInput.setCustomValidity("");
    }
  };

  hexInput.addEventListener("change", commitHexValue);
  hexInput.addEventListener("blur", commitHexValue);
  hexInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitHexValue();
      hexInput.select();
    } else if (event.key === "Escape") {
      event.preventDefault();
      hexInput.value = colorInput.value.toUpperCase();
      hexInput.setCustomValidity("");
      hexInput.blur();
    }
  });

  colorInput.addEventListener("input", () => {
    applyColor(colorInput.value);
  });
}

bindHexColorInput(
  elements.backgroundColorHex,
  elements.backgroundColor,
  applyBackgroundColor
);
bindHexColorInput(
  elements.lineColorHex,
  elements.lineColor,
  applyLineColor
);


const resizeObserver = new ResizeObserver(() => fitViewport());
resizeObserver.observe(elements.viewportStage);

window.addEventListener("beforeunload", () => {
  state.videoExportCancelled = true;
  window.clearTimeout(state.reanalysisTimer);
  window.clearTimeout(fftLoadProgressHideTimer);
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
});

resetHistory();
initializeCollapsibleSections();
initializeSectionResetButtons();
updateSidebarToggle();
fitViewport();
requestAnimationFrame(render);
