// analysis.js — generated module split of app.js (behavior unchanged)
import { ANALYSIS_FRAMES_PER_SECOND, FREQUENCY_GRAPH_DB_MAX, FREQUENCY_GRAPH_DB_MIN, FREQUENCY_GRAPH_MAX_HZ, FREQUENCY_GRAPH_MIN_HZ, FREQUENCY_GRAPH_POINT_COUNT, FREQUENCY_POINT_COUNT, MAX_ANALYSIS_FRAMES, MIN_DB_RANGE, TERRAIN_ATTACK_MS, TERRAIN_RELEASE_MS, audio, state } from "./core.js";
import { hideFftLoadProgress, setFftLoadProgress } from "./loader.js";
import { currentPlayheadTime } from "./playback.js";
import { catmullRom, clamp, markRenderDirty, setStatus } from "./utils.js";

export function resetHistory() {
  const points = FREQUENCY_POINT_COUNT;
  state.history = Array.from(
    { length: state.lineCount },
    () => new Float32Array(points)
  );
  state.historyIsFlat = true;
  state.geometryCache = null;
  markRenderDirty();
}

function createFftWorkspace(size) {
  const levels = Math.log2(size);

  if (!Number.isInteger(levels)) {
    throw new Error("FFT size must be a power of two.");
  }

  const real = new Float32Array(size);
  const imaginary = new Float32Array(size);
  const bitReversedIndices = new Uint32Array(size);
  const windowValues = new Float64Array(size);

  for (let index = 0; index < size; index += 1) {
    let value = index;
    let reversed = 0;
    for (let bit = 0; bit < levels; bit += 1) {
      reversed = (reversed << 1) | (value & 1);
      value >>= 1;
    }
    bitReversedIndices[index] = reversed;
    windowValues[index] =
      0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1));
  }

  const stages = [];
  for (let blockSize = 2; blockSize <= size; blockSize *= 2) {
    const halfBlock = blockSize / 2;
    const phaseStep = (-2 * Math.PI) / blockSize;
    const cosine = new Float64Array(halfBlock);
    const sine = new Float64Array(halfBlock);

    for (let offset = 0; offset < halfBlock; offset += 1) {
      const angle = phaseStep * offset;
      cosine[offset] = Math.cos(angle);
      sine[offset] = Math.sin(angle);
    }

    stages.push({ blockSize, halfBlock, cosine, sine });
  }

  return {
    size,
    real,
    imaginary,
    bitReversedIndices,
    windowValues,
    stages
  };
}

function fillFftInput(workspace, channels, channelScale, frameStart) {
  const {
    size,
    real,
    imaginary,
    bitReversedIndices,
    windowValues
  } = workspace;
  const sampleCount = channels[0]?.length || 0;

  for (let sampleOffset = 0; sampleOffset < size; sampleOffset += 1) {
    const sourceIndex = frameStart + sampleOffset;
    let sample = 0;

    if (sourceIndex >= 0 && sourceIndex < sampleCount) {
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
        sample += channels[channelIndex][sourceIndex] * channelScale;
      }
    }

    const destinationIndex = bitReversedIndices[sampleOffset];
    real[destinationIndex] = sample * windowValues[sampleOffset];
    imaginary[destinationIndex] = 0;
  }
}

function runFft(workspace) {
  const { size, real, imaginary, stages } = workspace;

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
    const { blockSize, halfBlock, cosine, sine } = stages[stageIndex];

    for (let blockStart = 0; blockStart < size; blockStart += blockSize) {
      for (let offset = 0; offset < halfBlock; offset += 1) {
        const evenIndex = blockStart + offset;
        const oddIndex = evenIndex + halfBlock;
        const oddReal =
          real[oddIndex] * cosine[offset] -
          imaginary[oddIndex] * sine[offset];
        const oddImaginary =
          real[oddIndex] * sine[offset] +
          imaginary[oddIndex] * cosine[offset];
        const evenReal = real[evenIndex];
        const evenImaginary = imaginary[evenIndex];

        real[oddIndex] = evenReal - oddReal;
        imaginary[oddIndex] = evenImaginary - oddImaginary;
        real[evenIndex] = evenReal + oddReal;
        imaginary[evenIndex] = evenImaginary + oddImaginary;
      }
    }
  }
}

function createFrequencyBinPositions(
  pointCount,
  maximumFrequencyHz,
  sampleRate,
  fftSize
) {
  const positions = new Float64Array(pointCount);
  const maximumBin = fftSize / 2;

  for (let index = 0; index < pointCount; index += 1) {
    const amount = pointCount <= 1 ? 0 : index / (pointCount - 1);
    const frequencyHz = logarithmicFrequencyAtPosition(
      amount,
      maximumFrequencyHz
    );
    positions[index] = clamp(
      (frequencyHz * fftSize) / sampleRate,
      0,
      maximumBin
    );
  }

  return positions;
}

function sampleFftMagnitude(real, imaginary, binPosition) {
  const maximumBin = real.length / 2;
  const lowerBin = Math.floor(clamp(binPosition, 0, maximumBin));
  const upperBin = Math.min(maximumBin, lowerBin + 1);
  const amount = binPosition - lowerBin;
  const lowerMagnitude = Math.sqrt(
    real[lowerBin] * real[lowerBin] +
    imaginary[lowerBin] * imaginary[lowerBin]
  );

  if (upperBin === lowerBin) return lowerMagnitude;

  const upperMagnitude = Math.sqrt(
    real[upperBin] * real[upperBin] +
    imaginary[upperBin] * imaginary[upperBin]
  );
  return lowerMagnitude + (upperMagnitude - lowerMagnitude) * amount;
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

export async function analyzeAudio(audioBuffer, fftSize, options = {}) {
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
  const channels = Array.from(
    { length: audioBuffer.numberOfChannels },
    (_, channelIndex) => audioBuffer.getChannelData(channelIndex)
  );
  const channelScale = 1 / Math.max(1, channels.length);
  const halfWindow = fftSize / 2;
  const fftWorkspace = createFftWorkspace(fftSize);
  const maximumAnalyzedFrequency = Math.min(
    FREQUENCY_GRAPH_MAX_HZ,
    audioBuffer.sampleRate * 0.5
  );
  const terrainBinPositions = createFrequencyBinPositions(
    FREQUENCY_POINT_COUNT,
    maximumAnalyzedFrequency,
    audioBuffer.sampleRate,
    fftSize
  );
  const graphBinPositions = createFrequencyBinPositions(
    FREQUENCY_GRAPH_POINT_COUNT,
    maximumAnalyzedFrequency,
    audioBuffer.sampleRate,
    fftSize
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
      progress * Math.max(0, audioBuffer.length - 1)
    );
    const frameStart = centerSample - halfWindow;

    fillFftInput(
      fftWorkspace,
      channels,
      channelScale,
      frameStart
    );
    runFft(fftWorkspace);

    // Sample the terrain across the same logarithmic frequency axis as
    // the top-right graph. Equal horizontal mesh distances now represent
    // equal frequency ratios from 20 Hz through 20 kHz (or Nyquist when
    // the decoded source has a lower maximum frequency).
    for (
      let frequencyIndex = 0;
      frequencyIndex < FREQUENCY_POINT_COUNT;
      frequencyIndex += 1
    ) {
      const magnitude = sampleFftMagnitude(
        fftWorkspace.real,
        fftWorkspace.imaginary,
        terrainBinPositions[frequencyIndex]
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
      const magnitude = sampleFftMagnitude(
        fftWorkspace.real,
        fftWorkspace.imaginary,
        graphBinPositions[graphIndex]
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

export function sampleSpectrogramRow(
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

export function updateHistory(force = false) {
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

export function scheduleReanalysis() {
  window.clearTimeout(state.reanalysisTimer);
  const requestVersion = ++state.fftReanalysisVersion;
  setFftLoadProgress(2, `Queued ${state.fftSize} FFT analysis…`);
  state.reanalysisTimer = window.setTimeout(
    () => reanalyzeLoadedAudio(requestVersion),
    180
  );
}
