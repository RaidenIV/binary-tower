// export.js — generated module split of app.js (behavior unchanged)
import { isFirefoxBrowser, videoExportDefaults } from "./config.js";
import { updateHistory } from "./analysis.js";
import { audio, canvas, elements, state } from "./core.js";
import { getSelectedLoopRange, hasPartialLoopSelection } from "./loop.js";
import { ensureAudioGraph } from "./playback.js";
import { drawScene, prepareExportLogoImage } from "./renderer.js";
import { clamp, downloadBlob, normalizeRotation, sanitizeFileName, setStatus } from "./utils.js";
import { getViewportResolutionDimensions, getWebpageRenderDimensions } from "./viewport.js";

export function getExportFileBaseName() {
  const customName = elements.exportFileName.value.trim();
  if (customName) return sanitizeFileName(customName);
  if (state.fileName) return sanitizeFileName(state.fileName);
  return "binary-tower";
}

function canvasToPngBlob() {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

export async function exportPngAtSelectedResolution() {
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

export function updateVideoExportFormatUi(resetStatus = true) {
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

export function setVideoExportProgress(percent, detail = "Encoding") {
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

export function requestVideoExportCancel() {
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

export function endVideoExportUi() {
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

export async function exportVideo() {
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

export function collectExportedControlValues() {
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
