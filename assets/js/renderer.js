// renderer.js — generated module split of app.js (behavior unchanged)
import { resetHistory, sampleSpectrogramRow, updateHistory } from "./analysis.js";
import { FREQUENCY_GRAPH_DB_MAX, FREQUENCY_GRAPH_DB_MIN, FREQUENCY_GRAPH_DB_STEP, FREQUENCY_GRAPH_MAX_HZ, FREQUENCY_GRAPH_MIN_HZ, FREQUENCY_GRAPH_POINT_COUNT, FREQUENCY_POINT_COUNT, audio, canvas, ctx, elements, state } from "./core.js";
import { enforceSelectedLoop, getSelectedLoopRange, hasPartialLoopSelection, updateBinaryStreamClock, updateLoopPlayhead } from "./loop.js";
import { currentPlayheadTime, updateSmoothPlaybackClock } from "./playback.js";
import { catmullRom, clamp, formatTime, hexToRgb, hexToRgba } from "./utils.js";

function terrainFillColor(baseColor, averageHeight, lightAmount, opacity) {
  const ambient = 0.42;
  const brightness = clamp(
    ambient + averageHeight * 0.38 + lightAmount * 0.20,
    0.32,
    1
  );

  return `rgba(${Math.round(baseColor.r * brightness)}, ${Math.round(baseColor.g * brightness)}, ${Math.round(baseColor.b * brightness)}, ${opacity})`;
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

export function updateViewportLogoLayout() {
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

export async function prepareExportLogoImage() {
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

export function drawScene() {
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

export function render(timestamp) {
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
    const loopRange = state.audioLoop && hasPartialLoopSelection()
      ? getSelectedLoopRange()
      : { start: 0, end: audio.duration, duration: audio.duration };
    const relativeTime = clamp(
      audio.currentTime - loopRange.start,
      0,
      Math.max(0, loopRange.duration)
    );
    elements.timeline.value = String(
      Math.round((relativeTime / Math.max(0.001, loopRange.duration)) * 1000)
    );
    elements.currentTime.textContent = formatTime(relativeTime);
    elements.duration.textContent = formatTime(loopRange.duration);
    updateLoopPlayhead(audio.currentTime);
    state.lastTimelineTimestamp = timestamp;
  }

  requestAnimationFrame(render);
}
