// reset.js — generated module split of app.js (behavior unchanged)
import { defaults, loopDefaults, videoExportDefaults } from "./config.js";
import { resetHistory } from "./analysis.js";
import { audio, elements, state } from "./core.js";
import { endVideoExportUi, requestVideoExportCancel, setVideoExportProgress, updateVideoExportFormatUi } from "./export.js";
import { hideAudioLoadProgress, hideFftLoadProgress } from "./loader.js";
import { drawLoopMinimap, drawLoopWaveform, galaxyLoopController, resetBinaryStreamClock, setLoopControlsEnabled, setLoopStatus, updateLoopPlayhead, updateLoopSelectionUi } from "./loop.js";
import { clamp, markRenderDirty, setStatus } from "./utils.js";
import { applyEmbeddedDefaultsToControls, applyProductionViewportPreset, fitViewport, viewportPresetNameFromSettings } from "./viewport.js";

export function resetVisualizerToDefaults() {
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

export function setControlAndDispatch(control, value, eventType = "input") {
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

export function initializeSectionResetButtons() {
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
