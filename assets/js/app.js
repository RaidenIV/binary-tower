// app.js — generated module split of app.js (behavior unchanged)
import { loopDefaults } from "./config.js";
import { resetHistory, scheduleReanalysis, updateHistory } from "./analysis.js";
import { applyBackgroundColor, applyLineColor, beginViewportRotation, bindHexColorInput, bindRange, continueViewportRotation, endViewportRotation, enhanceValueEditors, initializeCollapsibleSections, updateSidebarToggle } from "./controls.js";
import { audio, elements, state } from "./core.js";
import { collectExportedControlValues, endVideoExportUi, exportPngAtSelectedResolution, exportVideo, getExportFileBaseName, requestVideoExportCancel, setVideoExportProgress, updateVideoExportFormatUi } from "./export.js";
import { fftLoadProgressHideTimer, hideFftLoadProgress, loadAudioFile } from "./loader.js";
import { applyLoopBars, beginLoopSelectionDrag, continueLoopSelectionDrag, drawLoopMinimap, drawLoopWaveform, endLoopMinimapDrag, endLoopSelectionDrag, fitLoopZoom, galaxyLoopController, getLoopZoomRange, getSelectedLoopRange, hasPartialLoopSelection, moveLoopSelectionTo, resetSmoothPlaybackTo, runLoopBpmDetection, setFullTrackLoop, setLoopControlsEnabled, setLoopStatus, setLoopZoomWindow, updateAudioLoopMode, updateLoopPlayhead, updateLoopSelectionUi, zoomLoopAtX } from "./loop.js";
import { togglePlayback } from "./playback.js";
import { render, updateViewportLogoLayout } from "./renderer.js";
import { initializeSectionResetButtons, resetVisualizerToDefaults } from "./reset.js";
import { clamp, downloadBlob, formatTime, markRenderDirty, setStatus } from "./utils.js";
import { applyEmbeddedDefaultsToControls, applyProductionViewportPreset, fitViewport, resizeCanvas, updateExportFormatControls } from "./viewport.js";

applyEmbeddedDefaultsToControls();

setLoopControlsEnabled(false);

updateLoopSelectionUi();

drawLoopWaveform();

drawLoopMinimap();

setVideoExportProgress(0, "Preparing");

endVideoExportUi();

enhanceValueEditors();

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

function audioTimeFromTimelineValue(value) {
  const loopRange = state.audioLoop && hasPartialLoopSelection()
    ? getSelectedLoopRange()
    : { start: 0, duration: audio.duration };
  const progress = clamp(Number(value) / 1000, 0, 1);
  return loopRange.start + progress * loopRange.duration;
}

elements.timeline.addEventListener("input", () => {
  state.isSeeking = true;
  if (Number.isFinite(audio.duration)) {
    const previewTime = audioTimeFromTimelineValue(elements.timeline.value);
    const loopStart = state.audioLoop && hasPartialLoopSelection()
      ? getSelectedLoopRange().start
      : 0;
    audio.currentTime = previewTime;
    resetSmoothPlaybackTo(previewTime);
    elements.currentTime.textContent = formatTime(previewTime - loopStart);
    updateLoopPlayhead(previewTime);
    updateHistory(true);
    markRenderDirty();
  }
});

elements.timeline.addEventListener("change", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = audioTimeFromTimelineValue(elements.timeline.value);
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
    if (elements.audioFile.disabled) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
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
  if (elements.audioFile.disabled) return;

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

elements.exportPng.addEventListener(
  "click",
  exportPngAtSelectedResolution
);

elements.videoFileType.addEventListener("change", () => {
  updateVideoExportFormatUi(true);
});

elements.exportVideo.addEventListener("click", exportVideo);

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
