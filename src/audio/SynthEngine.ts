import { DEFAULT_STUDIO_AUDIO_URL, SONG_BPM, SONG_DURATION_SEC } from '../data/lyrics';
import {
  analyzePcmEnvelope,
  AudioSyncProfile,
  buildSyncProfile,
  DEFAULT_SYNC_PROFILE,
} from '../utils/audioSync';

export type AudioSourceMode = 'studio-track' | 'custom-file' | 'synth';

export interface AudioMetrics {
  totalEnergy: number;
  bassEnergy: number;
  vocalEnergy: number;
}

export interface SynthEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  syncOffsetSec: number;
  sourceMode: AudioSourceMode;
  customFileName: string | null;
}

const CHORDS: number[][] = [
  [130.81, 196.0, 261.63, 329.63, 392.0], // C major
  [98.0, 196.0, 246.94, 293.66, 392.0], // G major
  [110.0, 164.81, 220.0, 261.63, 329.63], // A minor
  [87.31, 174.61, 220.0, 261.63, 349.23], // F major
];

const BASS_ROOTS = [65.41, 49.0, 55.0, 43.65];
const LEAD_MOTIF = [523.25, 587.33, 659.25, 587.33, 523.25, 392.0, 440.0, 523.25];

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;

  private isPlaying = false;
  private currentTime = 0;
  private duration = SONG_DURATION_SEC;
  private volume = 0.82;
  private muted = false;
  private syncOffsetSec = 0;
  private sourceMode: AudioSourceMode = 'studio-track';
  private customFileName: string | null = 'Alinhamento Milenar · Jão';

  private schedulerTimer: number | null = null;
  private lastTickPerf = 0;
  private nextStepTime = 0;
  private currentStep = 0;

  private audioElement: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private customObjectUrl: string | null = null;

  private onTimeUpdateCb?: (timeSec: number) => void;
  private onEndedCb?: () => void;
  private onAnalysisReadyCb?: (profile: AudioSyncProfile, peaks: number[]) => void;

  constructor(callbacks?: {
    onTimeUpdate?: (timeSec: number) => void;
    onEnded?: () => void;
    onAnalysisReady?: (profile: AudioSyncProfile, peaks: number[]) => void;
  }) {
    this.onTimeUpdateCb = callbacks?.onTimeUpdate;
    this.onEndedCb = callbacks?.onEnded;
    this.onAnalysisReadyCb = callbacks?.onAnalysisReady;

    if (typeof window !== 'undefined') {
      this.setupAudioElement(DEFAULT_STUDIO_AUDIO_URL, 'studio-track', 'Alinhamento Milenar · Jão');
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.76;
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.connectMediaElementIfNeeded();
    return this.ctx;
  }

  private connectMediaElementIfNeeded(): void {
    if (!this.ctx || !this.masterGain || !this.audioElement || this.mediaSource) return;
    try {
      this.mediaSource = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaSource.connect(this.masterGain);
    } catch {
      // Element already routed or unsupported
    }
  }

  private setupAudioElement(
    url: string,
    mode: 'studio-track' | 'custom-file',
    label: string
  ): void {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'metadata';

      this.audioElement.addEventListener('loadedmetadata', () => {
        if (!this.audioElement) return;
        const dur = this.audioElement.duration;
        if (Number.isFinite(dur) && dur > 1) {
          this.duration = dur;
          this.onTimeUpdateCb?.(this.currentTime);
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.pause();
        this.onEndedCb?.();
      });

      this.audioElement.addEventListener('error', () => {
        // Fallback gracefully to procedural 135 BPM synth if media load fails
        if (this.sourceMode === 'studio-track') {
          this.sourceMode = 'synth';
          this.customFileName = 'Instrumental 135 BPM';
          this.duration = SONG_DURATION_SEC;
        }
      });
    }

    this.audioElement.src = url;
    this.audioElement.volume = this.muted ? 0 : this.volume;
    this.sourceMode = mode;
    this.customFileName = label;

    // Decode & analyze waveform/sync envelope asynchronously when possible
    void this.analyzeAudioUrl(url, mode === 'studio-track');
  }

  private async analyzeAudioUrl(url: string, isStudioDefault: boolean): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuf = await res.arrayBuffer();

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      // Decode via temporary offline-friendly context so autoplay doesn't block analysis
      const decodeCtx = this.ctx ?? new AudioCtx();
      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
      if (!this.ctx && decodeCtx.state !== 'closed') {
        void decodeCtx.close();
      }

      const channel = audioBuffer.getChannelData(0);
      const analysis = analyzePcmEnvelope(channel, audioBuffer.sampleRate, 96);
      this.duration = analysis.durationSec;

      const profile = isStudioDefault
        ? {
            ...DEFAULT_SYNC_PROFILE,
            durationSec: analysis.durationSec,
            grooveDropSec: analysis.grooveDropSec,
            analyzed: true,
          }
        : buildSyncProfile(
            analysis.durationSec,
            analysis.leadingSilenceSec,
            analysis.grooveDropSec
          );

      this.onAnalysisReadyCb?.(profile, analysis.waveformPeaks);
    } catch {
      // Keep default sync profile cleanly if decode isn't supported
    }
  }

  public getState(): SynthEngineState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      muted: this.muted,
      syncOffsetSec: this.syncOffsetSec,
      sourceMode: this.sourceMode,
      customFileName: this.customFileName,
    };
  }

  public getDuration(): number {
    return this.duration;
  }

  public setSyncOffset(offsetSec: number): void {
    this.syncOffsetSec = Math.max(-10, Math.min(10, offsetSec));
  }

  public async play(): Promise<void> {
    if (this.isPlaying) return;
    const ctx = this.ensureContext();

    if (this.currentTime >= this.duration - 0.1) {
      this.currentTime = 0;
    }

    this.isPlaying = true;
    this.lastTickPerf = performance.now();

    if ((this.sourceMode === 'studio-track' || this.sourceMode === 'custom-file') && this.audioElement) {
      this.audioElement.currentTime = Math.min(this.duration - 0.05, Math.max(0, this.currentTime));
      try {
        await this.audioElement.play();
      } catch {
        // If browser blocked audio play or decode failed, fall back to synth timer cleanly
      }
    } else if (ctx) {
      this.nextStepTime = ctx.currentTime + 0.03;
      this.currentStep = Math.floor((this.currentTime / 60) * SONG_BPM * 2);
    }

    this.startLoop();
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  public seek(timeSec: number): void {
    const clamped = Math.max(0, Math.min(this.duration, timeSec));
    this.currentTime = clamped;
    this.lastTickPerf = performance.now();
    this.currentStep = Math.floor((clamped / 60) * SONG_BPM * 2);
    if ((this.sourceMode === 'studio-track' || this.sourceMode === 'custom-file') && this.audioElement) {
      if (Number.isFinite(this.audioElement.duration) && this.audioElement.duration > 0) {
        this.audioElement.currentTime = Math.min(this.audioElement.duration - 0.02, clamped);
      } else {
        this.audioElement.currentTime = clamped;
      }
    }
    this.onTimeUpdateCb?.(this.currentTime);
  }

  public setVolume(vol01: number): void {
    this.volume = Math.max(0, Math.min(1, vol01));
    if (this.masterGain && this.ctx) {
      const target = this.muted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.muted ? 0 : this.volume;
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      const target = this.muted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.muted ? 0 : this.volume;
    }
  }

  public async loadCustomFile(file: File): Promise<void> {
    this.ensureContext();
    this.pause();

    if (this.customObjectUrl) {
      URL.revokeObjectURL(this.customObjectUrl);
    }
    this.customObjectUrl = URL.createObjectURL(file);

    this.setupAudioElement(this.customObjectUrl, 'custom-file', file.name);
    this.seek(0);
    await this.analyzeAudioUrl(this.customObjectUrl, false);
  }

  public loadStudioTrack(): void {
    this.pause();
    this.duration = SONG_DURATION_SEC;
    this.setupAudioElement(DEFAULT_STUDIO_AUDIO_URL, 'studio-track', 'Alinhamento Milenar · Jão');
    this.seek(0);
  }

  public resetToProceduralSynth(): void {
    this.pause();
    this.sourceMode = 'synth';
    this.customFileName = 'Instrumental 135 BPM';
    this.duration = SONG_DURATION_SEC;
    this.seek(0);
  }

  public getMetrics(): AudioMetrics {
    if (!this.isPlaying) {
      return { totalEnergy: 0, bassEnergy: 0, vocalEnergy: 0 };
    }
    if (this.analyser && this.freqData) {
      this.analyser.getByteFrequencyData(this.freqData);
      const len = this.freqData.length;
      let bassSum = 0;
      const bassBins = Math.min(4, len);
      for (let i = 0; i < bassBins; i++) bassSum += this.freqData[i];

      let vocalSum = 0;
      const vStart = Math.min(4, len);
      const vEnd = Math.min(24, len);
      for (let i = vStart; i < vEnd; i++) vocalSum += this.freqData[i];

      let totalSum = 0;
      const totalBins = Math.min(32, len);
      for (let i = 0; i < totalBins; i++) totalSum += this.freqData[i];

      const bass = Math.min(1, (bassSum / Math.max(1, bassBins * 255)) * 1.45);
      const vocal = Math.min(1, (vocalSum / Math.max(1, (vEnd - vStart) * 255)) * 1.75);
      const total = Math.min(1, (totalSum / Math.max(1, totalBins * 255)) * 1.6);
      if (total > 0.015) {
        return { totalEnergy: total, bassEnergy: bass, vocalEnergy: vocal };
      }
    }

    const beatPhase = ((this.currentTime * SONG_BPM) / 60) % 1;
    const pulse = Math.pow(1 - beatPhase, 2) * 0.72;
    return { totalEnergy: pulse, bassEnergy: pulse, vocalEnergy: pulse * 0.8 };
  }

  public getEnergy(): number {
    return this.getMetrics().totalEnergy;
  }

  private startLoop(): void {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
    }
    this.schedulerTimer = window.setInterval(() => {
      if (!this.isPlaying) return;

      const nowPerf = performance.now();
      const dt = Math.min(0.25, (nowPerf - this.lastTickPerf) / 1000);
      this.lastTickPerf = nowPerf;

      if (
        (this.sourceMode === 'studio-track' || this.sourceMode === 'custom-file') &&
        this.audioElement
      ) {
        if (!this.audioElement.paused) {
          this.currentTime = Math.min(this.duration, this.audioElement.currentTime);
        } else {
          this.currentTime = Math.min(this.duration, this.currentTime + dt);
        }
      } else {
        this.currentTime = Math.min(this.duration, this.currentTime + dt);
        this.scheduleSynthNotes();
      }

      this.onTimeUpdateCb?.(this.currentTime);

      if (this.currentTime >= this.duration - 0.05 && this.sourceMode === 'synth') {
        this.pause();
        this.onEndedCb?.();
      }
    }, 25);
  }

  private scheduleSynthNotes(): void {
    if (!this.ctx || !this.masterGain) return;
    const stepDuration = 60 / SONG_BPM / 2;
    const lookAhead = 0.12;

    while (this.nextStepTime < this.ctx.currentTime + lookAhead) {
      this.triggerStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += stepDuration;
      this.currentStep++;
    }
  }

  private triggerStep(step: number, time: number): void {
    if (!this.ctx || !this.masterGain) return;

    const bar = Math.floor(step / 8);
    const stepInBar = step % 8;
    const chordIdx = bar % CHORDS.length;
    const chord = CHORDS[chordIdx];
    const bassFreq = BASS_ROOTS[chordIdx];

    const t = this.currentTime;
    const isChorus = (t >= 47.1 && t < 89.7) || (t >= 118.35 && t < 153.0);
    const isIntroOrOutro = t < 4.25 || t >= 184.4;
    const isBridge = t >= 153.0 && t < 168.5;
    const isAthens = t >= 89.7 && t < 104.35;

    if (stepInBar === 0) {
      this.playPadChord(chord, time, isChorus ? 0.095 : 0.06);
    }

    if (!isIntroOrOutro && (isChorus || isAthens || stepInBar % 2 === 0)) {
      this.playBassNote(bassFreq, time, isChorus ? 0.15 : 0.095);
    }

    const arpFreq = chord[stepInBar % chord.length] * (isChorus ? 2 : 1);
    this.playBellPluck(arpFreq, time, isChorus ? 0.07 : 0.045);

    if ((isChorus || isBridge) && stepInBar % 2 === 0) {
      const motifNote = LEAD_MOTIF[(step / 2) % LEAD_MOTIF.length];
      this.playBellPluck(motifNote, time, 0.052, 0.34);
    }

    if (!isIntroOrOutro) {
      if (stepInBar === 0 || stepInBar === 4 || (isChorus && stepInBar === 5)) {
        this.playKick(time, isChorus ? 0.26 : 0.17);
      }
      if (stepInBar === 2 || stepInBar === 6) {
        this.playSnare(time, isChorus ? 0.13 : 0.08);
      }
      this.playHiHat(time, stepInBar % 2 === 0 ? 0.036 : 0.02);
    }
  }

  private playPadChord(freqs: number[], time: number, level: number): void {
    if (!this.ctx || !this.masterGain) return;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1250, time);
    filter.frequency.exponentialRampToValueAtTime(1950, time + 0.75);
    filter.connect(this.masterGain);

    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freqs[i], time);
      osc.detune.setValueAtTime((i - 1) * 6, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(level / 3, time + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.75);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(time);
      osc.stop(time + 1.8);
    }
  }

  private playBassNote(freq: number, time: number, level: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, time);
    filter.frequency.exponentialRampToValueAtTime(145, time + 0.18);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.21);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  private playBellPluck(freq: number, time: number, level: number, dur = 0.26): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private playKick(time: number, level: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(132, time);
    osc.frequency.exponentialRampToValueAtTime(44, time + 0.1);

    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.17);
  }

  private playSnare(time: number, level: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.11);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1950;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
  }

  private playHiHat(time: number, level: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
  }

  public dispose(): void {
    this.pause();
    if (this.customObjectUrl) {
      URL.revokeObjectURL(this.customObjectUrl);
      this.customObjectUrl = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
