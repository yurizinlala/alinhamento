import { SONG_DURATION_SEC } from '../data/lyrics';

export const REF_GROOVE_DROP_SEC = 4.25;
export const REF_LEADING_SILENCE_SEC = 0.05;

export interface AudioEnvelopeAnalysis {
  durationSec: number;
  leadingSilenceSec: number;
  grooveDropSec: number;
  waveformPeaks: number[];
}

export interface AudioSyncProfile {
  durationSec: number;
  leadingSilenceSec: number;
  grooveDropSec: number;
  timeScale: number;
  autoOffsetSec: number;
  analyzed: boolean;
}

export const DEFAULT_SYNC_PROFILE: AudioSyncProfile = {
  durationSec: SONG_DURATION_SEC,
  leadingSilenceSec: 0,
  grooveDropSec: REF_GROOVE_DROP_SEC,
  timeScale: 1,
  autoOffsetSec: 0,
  analyzed: false,
};

/**
 * Analyzes mono PCM samples to detect leading silence, the first energetic
 * beat/groove drop, and a normalized 96-bar waveform envelope.
 */
export function analyzePcmEnvelope(
  samples: Float32Array,
  sampleRate: number,
  barCount = 96
): AudioEnvelopeAnalysis {
  if (samples.length === 0 || sampleRate <= 0) {
    return {
      durationSec: SONG_DURATION_SEC,
      leadingSilenceSec: 0,
      grooveDropSec: REF_GROOVE_DROP_SEC,
      waveformPeaks: new Array(barCount).fill(0.25),
    };
  }

  const durationSec = samples.length / sampleRate;
  const windowSamples = Math.max(1, Math.floor(sampleRate * 0.05)); // 50ms windows
  const numWindows = Math.max(1, Math.floor(samples.length / windowSamples));
  const rmsWindows = new Float32Array(numWindows);

  let maxRms = 0;
  for (let w = 0; w < numWindows; w++) {
    const start = w * windowSamples;
    const end = Math.min(samples.length, start + windowSamples);
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      const s = samples[i];
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    rmsWindows[w] = rms;
    if (rms > maxRms) maxRms = rms;
  }

  const safeMax = Math.max(1e-5, maxRms);
  const silenceThreshold = safeMax * 0.035;
  let leadingSilenceSec = 0;
  for (let w = 0; w < numWindows; w++) {
    if (rmsWindows[w] > silenceThreshold) {
      leadingSilenceSec = (w * windowSamples) / sampleRate;
      break;
    }
  }

  // Detect the main intro drop / groove entry within the first 25s
  const searchLimitSec = Math.min(25, durationSec * 0.35);
  const searchWindows = Math.min(numWindows, Math.floor((searchLimitSec * sampleRate) / windowSamples));
  let grooveDropSec = Math.min(durationSec * 0.1, leadingSilenceSec + REF_GROOVE_DROP_SEC);
  const dropThreshold = safeMax * 0.34;
  for (let w = 1; w < searchWindows; w++) {
    if (rmsWindows[w] >= dropThreshold && rmsWindows[w] > rmsWindows[w - 1] * 1.45) {
      grooveDropSec = (w * windowSamples) / sampleRate;
      break;
    }
  }

  // Downsample into normalized waveform bars for scrubber visualization
  const waveformPeaks: number[] = [];
  for (let b = 0; b < barCount; b++) {
    const wStart = Math.floor((b / barCount) * numWindows);
    const wEnd = Math.max(wStart + 1, Math.floor(((b + 1) / barCount) * numWindows));
    let peak = 0;
    for (let w = wStart; w < Math.min(numWindows, wEnd); w++) {
      if (rmsWindows[w] > peak) peak = rmsWindows[w];
    }
    waveformPeaks.push(Math.max(0.08, Math.min(1, peak / safeMax)));
  }

  return {
    durationSec,
    leadingSilenceSec,
    grooveDropSec,
    waveformPeaks,
  };
}

/**
 * Builds an automatic time-warping profile so uploaded tracks (including versions
 * with extra leading silence, slight tempo differences, or trimmed edits) align
 * cleanly with the reference song structure.
 */
export function buildSyncProfile(
  durationSec: number,
  leadingSilenceSec: number,
  grooveDropSec: number
): AudioSyncProfile {
  const safeDur = Math.max(1, durationSec);
  const effectiveAudioSpan = Math.max(1, safeDur - leadingSilenceSec);
  const refEffectiveSpan = SONG_DURATION_SEC - REF_LEADING_SILENCE_SEC;

  // If duration is within ±1.5s of studio master, preserve 1:1 pace and only trim leading silence/drop shift
  const isNearStudioLength = Math.abs(effectiveAudioSpan - refEffectiveSpan) <= 1.8;
  const timeScale = isNearStudioLength ? 1 : refEffectiveSpan / effectiveAudioSpan;

  // Compare detected groove drop against expected studio drop (4.25s) if plausible
  const expectedDrop = leadingSilenceSec + REF_GROOVE_DROP_SEC / timeScale;
  const dropDelta = grooveDropSec - expectedDrop;
  const useDropShift = Math.abs(dropDelta) <= 2.5 && grooveDropSec > leadingSilenceSec + 0.5;
  const anchorSilence = useDropShift
    ? Math.max(0, grooveDropSec - REF_GROOVE_DROP_SEC / timeScale)
    : leadingSilenceSec;

  return {
    durationSec: safeDur,
    leadingSilenceSec: anchorSilence,
    grooveDropSec,
    timeScale,
    autoOffsetSec: -anchorSilence,
    analyzed: true,
  };
}

export function mapAudioTimeToLyricTime(
  audioTimeSec: number,
  profile: AudioSyncProfile,
  manualOffsetSec = 0
): number {
  const shifted = Math.max(0, audioTimeSec - profile.leadingSilenceSec);
  const scaled = shifted * profile.timeScale + manualOffsetSec;
  return Math.max(0, Math.min(SONG_DURATION_SEC, scaled));
}

export function mapLyricTimeToAudioTime(
  lyricTimeSec: number,
  profile: AudioSyncProfile,
  manualOffsetSec = 0
): number {
  const unshifted = Math.max(0, lyricTimeSec - manualOffsetSec);
  const rawAudio = unshifted / Math.max(0.01, profile.timeScale) + profile.leadingSilenceSec;
  return Math.max(0, Math.min(profile.durationSec, rawAudio));
}
