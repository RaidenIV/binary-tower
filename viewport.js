// viewport.js — generated module split of app.js (behavior unchanged)
import { defaults, loopDefaults, productionViewportPresets, videoExportDefaults } from "./config.js";
import { PREVIEW_MAX_RENDER_SCALE, PREVIEW_MIN_RENDER_SCALE, audio, canvas, elements, state } from "./core.js";
import { updateAudioLoopMode } from "./loop.js";
import { updateViewportLogoLayout } from "./renderer.js";
import { setControlAndDispatch } from "./reset.js";
import { clamp, markRenderDirty, normalizeRotation, setStatus } from "./utils.js";

export function viewportPresetNameFromSettings(orientation, aspectRatio) {
  if (aspectRatio === "square") return "square";
  return orientation === "portrait" ? "portrait" : "landscape";
}

export function applyProductionViewportPreset(name, announce = true) {
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

export function applyEmbeddedDefaultsToControls() {
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

export function fitViewport() {
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

export function getViewportResolutionDimensions() {
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

export function updateExportFormatControls() {
  const isSquare = state.aspectRatio === "square";
  elements.orientation.disabled = isSquare;
  elements.orientation.setAttribute("aria-disabled", String(isSquare));
  elements.orientation.title = isSquare
    ? "Orientation does not apply to a square viewport."
    : "Choose portrait or landscape viewport orientation.";
}

export function getWebpageRenderDimensions() {
  if (state.aspectRatio === "square") {
    return { width: 1080, height: 1080 };
  }

  return state.orientation === "portrait"
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}

export function resizeCanvas() {
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

export function setRotationFromViewport(value) {
  state.rotation = normalizeRotation(value);
  elements.rotation.value = String(state.rotation);
  elements.rotationValue.value = state.rotation.toFixed(2);
  state.geometryCache = null;
  markRenderDirty();
}

export function setElevationFromViewport(value) {
  state.elevation = clamp(value, 8, 60);
  elements.elevation.value = String(state.elevation);
  elements.elevationValue.value = state.elevation.toFixed(2);
  state.geometryCache = null;
  markRenderDirty();
}
