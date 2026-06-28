/**
 * Immutable application defaults and viewport presets.
 * Edit this file to change startup behavior without touching the visualizer engine.
 */
// Defaults embedded from the attached 13.json preset.
// Video-export and loop-editor view options remain separate output/UI
// controls and do not alter the visualization values stored in 13.json.
export const defaults = Object.freeze({
  fftSize: 4096,
  lineCount: 35,
  lineHeight: 1.5,
  zoom: 0.55,
  rotation: -19.83439999999616,
  rotateSpeed: 8,
  autoRotate: true,
  elevation: 10,
  audioLoop: false,
  volume: 100,
  muted: false,
  binaryCount: 35,
  binaryFontSize: 16,
  binaryNumberOffset: -5,
  binaryFade: 0,
  binaryDeletion: 15,
  binaryDeletionSpeed: 0.25,
  viewportSize: 100,
  viewportResolution: "4k",
  orientation: "landscape",
  aspectRatio: "widescreen",
  frequencyGraphPlacement: "top-right",
  waveformGraphPlacement: "bottom-left",
  levelsGraphPlacement: "bottom-right",
  graphWidth: 10,
  graphHeight: 4.5,
  metadataX: 1.5,
  metadataY: 2.5,
  guiTextSize: 0.75,
  logoVisible: true,
  logoX: 50,
  logoY: 5,
  logoSize: 5.5,
  backgroundColor: "#2424c8",
  lineWidth: 1,
  lineColor: "#dca8d8",
  meshColor: "#2424c8",
  opacity: 100
});

export const isFirefoxBrowser = /Firefox\//i.test(navigator.userAgent);

export const videoExportDefaults = Object.freeze({
  // Firefox's H.264 WebCodecs output can omit the decoder metadata that
  // MP4 muxing requires. Default Firefox to the MKV/VP9 path instead.
  fileType: isFirefoxBrowser ? "mkv" : "mp4",
  frameRate: 60,
  bitrateMbps: 24
});

export const loopDefaults = Object.freeze({
  bpm: 125,
  bars: 4,
  snap: true,
  start: 0,
  end: 7.68,
  zoomStart: 0,
  zoomEnd: 174.1935625
});

// Production viewport layouts embedded from landscape.json, square.json,
// and portrait.json. These HUD settings are intentionally not editable.
export const productionViewportPresets = Object.freeze({
  landscape: Object.freeze({
    orientation: "landscape",
    aspectRatio: "widescreen",
    frequencyGraphPlacement: "top-right",
    waveformGraphPlacement: "bottom-left",
    levelsGraphPlacement: "bottom-right",
    graphWidth: 10,
    graphHeight: 4.5,
    metadataX: 1.5,
    metadataY: 2.5,
    guiTextSize: 0.75,
    logoVisible: true,
    logoX: 50,
    logoY: 5,
    logoSize: 5.5
  }),
  square: Object.freeze({
    orientation: "landscape",
    aspectRatio: "square",
    frequencyGraphPlacement: "top-right",
    waveformGraphPlacement: "bottom-left",
    levelsGraphPlacement: "bottom-right",
    graphWidth: 14,
    graphHeight: 4.5,
    metadataX: 2.5,
    metadataY: 2.5,
    guiTextSize: 1.25,
    logoVisible: true,
    logoX: 50,
    logoY: 5,
    logoSize: 10
  }),
  portrait: Object.freeze({
    orientation: "portrait",
    aspectRatio: "widescreen",
    frequencyGraphPlacement: "top-right",
    waveformGraphPlacement: "bottom-left",
    levelsGraphPlacement: "bottom-right",
    graphWidth: 22,
    graphHeight: 4.5,
    metadataX: 2.75,
    metadataY: 1.5,
    guiTextSize: 1.5,
    logoVisible: true,
    logoX: 50,
    logoY: 3.5,
    logoSize: 14
  })
});
