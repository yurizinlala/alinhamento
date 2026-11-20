import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { SONG_ACTS, SONG_DURATION_SEC, WORD_CUES } from './data/lyrics';
import {
  computeSceneStateForCue,
  findActAtTime,
  findWordIndexAtTime,
  progressToTime,
  timeToProgress,
} from './utils/choreography';
import {
  AudioSyncProfile,
  DEFAULT_SYNC_PROFILE,
  mapAudioTimeToLyricTime,
  mapLyricTimeToAudioTime,
} from './utils/audioSync';
import { AlignmentScene, SceneExternalInput } from './three/AlignmentScene';
import { AudioSourceMode, SynthEngine } from './audio/SynthEngine';
import { KineticWordStage } from './components/KineticWordStage';
import { PlayerDock } from './components/PlayerDock';

// Tall invisible scroll runway so scrolling drives word-by-word kinetic cinema smoothly
const RUNWAY_PX_PER_WORD = 120;
const FALLBACK_WAVEFORM = Array.from({ length: 96 }, (_, i) =>
  Math.max(0.18, 0.35 + Math.sin(i * 0.42) * 0.25 + (i % 7 === 0 ? 0.28 : 0))
);

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AlignmentScene | null>(null);
  const synthRef = useRef<SynthEngine | null>(null);
  const heroUploadInputRef = useRef<HTMLInputElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [volume, setVolume] = useState(0.82);
  const [muted, setMuted] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [syncOffsetSec, setSyncOffsetSec] = useState(0);
  const [dockCollapsed, setDockCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [sourceMode, setSourceMode] = useState<AudioSourceMode>('studio-track');
  const [customFileName, setCustomFileName] = useState<string | null>('Alinhamento Milenar · Jão');
  const [syncProfile, setSyncProfile] = useState<AudioSyncProfile>(DEFAULT_SYNC_PROFILE);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>(FALLBACK_WAVEFORM);
  const [audioEnergy, setAudioEnergy] = useState(0);
  const [bassEnergy, setBassEnergy] = useState(0);
  const [vocalEnergy, setVocalEnergy] = useState(0);
  const [webglFallback, setWebglFallback] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const sceneInputRef = useRef<SceneExternalInput>({
    progress: 0,
    audioEnergy: 0,
    bassEnergy: 0,
    pointerX: 0,
    pointerY: 0,
    isPlaying: false,
    wordPulse: 0,
    motif: 'intro',
    isFinale: false,
  });

  const isPlayingRef = useRef(isPlaying);
  const syncScrollRef = useRef(syncScroll);
  const audioCurrentTimeRef = useRef(audioCurrentTime);
  const syncProfileRef = useRef(syncProfile);
  const syncOffsetSecRef = useRef(syncOffsetSec);
  const lastProgrammaticScrollTopRef = useRef<number | null>(null);
  const lastWordIdxRef = useRef(0);

  isPlayingRef.current = isPlaying;
  syncScrollRef.current = syncScroll;
  audioCurrentTimeRef.current = audioCurrentTime;
  syncProfileRef.current = syncProfile;
  syncOffsetSecRef.current = syncOffsetSec;

  const effectiveLyricTime = useMemo(() => {
    if (isPlaying) {
      return mapAudioTimeToLyricTime(audioCurrentTime, syncProfile, syncOffsetSec);
    }
    return progressToTime(scrollProgress);
  }, [isPlaying, audioCurrentTime, syncProfile, syncOffsetSec, scrollProgress]);

  const effectiveProgress = useMemo(
    () => timeToProgress(effectiveLyricTime),
    [effectiveLyricTime]
  );

  const activeWordIndex = useMemo(
    () => findWordIndexAtTime(effectiveLyricTime),
    [effectiveLyricTime]
  );

  const activeWordCue = WORD_CUES[activeWordIndex] ?? WORD_CUES[0];

  const activeActId = useMemo(
    () => findActAtTime(effectiveLyricTime),
    [effectiveLyricTime]
  );

  const isWordActive = !isPlaying || effectiveLyricTime <= activeWordCue.vocalEndSec;
  const isFinale = hasEnded || effectiveLyricTime >= 199.5;

  const visualState = useMemo(
    () => computeSceneStateForCue(effectiveProgress, activeWordCue.motif),
    [effectiveProgress, activeWordCue.motif]
  );

  // Trigger brief 3D kinetic pulse on every word transition
  useEffect(() => {
    if (lastWordIdxRef.current !== activeWordIndex) {
      lastWordIdxRef.current = activeWordIndex;
      sceneInputRef.current.wordPulse = 1.0;
      const decayTimer = window.setTimeout(() => {
        sceneInputRef.current.wordPulse = 0;
      }, 140);
      return () => window.clearTimeout(decayTimer);
    }
  }, [activeWordIndex]);

  useEffect(() => {
    sceneInputRef.current.progress = effectiveProgress;
    sceneInputRef.current.isPlaying = isPlaying;
    sceneInputRef.current.audioEnergy = audioEnergy;
    sceneInputRef.current.bassEnergy = bassEnergy;
    sceneInputRef.current.motif = activeWordCue.motif;
    sceneInputRef.current.isFinale = isFinale;
  }, [effectiveProgress, isPlaying, audioEnergy, bassEnergy, activeWordCue.motif, isFinale]);

  // Expose semantic DOM observability attributes
  useEffect(() => {
    document.body.dataset.playing = isPlaying ? 'true' : 'false';
    document.body.dataset.act = activeActId;
    document.body.dataset.word = isFinale
      ? 'você me ama e eu te amo'
      : isWordActive
      ? activeWordCue.word
      : '';
    document.body.dataset.wordActive = isWordActive ? 'true' : 'false';
    document.body.dataset.finale = isFinale ? 'true' : 'false';
    document.body.dataset.motif = activeWordCue.motif;
    document.body.dataset.anim = activeWordCue.entryAnim;
    document.body.dataset.source = sourceMode;
  }, [
    isPlaying,
    activeActId,
    isWordActive,
    isFinale,
    activeWordCue.word,
    activeWordCue.motif,
    activeWordCue.entryAnim,
    sourceMode,
  ]);

  // Initialize Three.js Multi-World Scene once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;
    try {
      sceneRef.current = new AlignmentScene(mount, () => sceneInputRef.current);
    } catch {
      setWebglFallback(true);
    }

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      sceneInputRef.current.pointerX = nx;
      sceneInputRef.current.pointerY = ny;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Initialize SynthEngine once (loads studio master MP3 & analyzes envelope)
  useEffect(() => {
    const synth = new SynthEngine({
      onTimeUpdate: (tAudio) => {
        setAudioCurrentTime(tAudio);
        if (syncScrollRef.current) {
          const lyricT = mapAudioTimeToLyricTime(
            tAudio,
            syncProfileRef.current,
            syncOffsetSecRef.current
          );
          setScrollProgress(timeToProgress(lyricT));
        }
        if (synthRef.current) {
          const metrics = synthRef.current.getMetrics();
          setAudioEnergy(metrics.totalEnergy);
          setBassEnergy(metrics.bassEnergy);
          setVocalEnergy(metrics.vocalEnergy);
        }
      },
      onEnded: () => {
        setIsPlaying(false);
        setHasEnded(true);
        setScrollProgress(1);
        setAudioEnergy(0);
        setBassEnergy(0);
        setVocalEnergy(0);
      },
      onAnalysisReady: (profile, peaks) => {
        setSyncProfile(profile);
        setWaveformPeaks(peaks);
      },
    });
    synthRef.current = synth;

    return () => {
      synth.dispose();
      synthRef.current = null;
    };
  }, []);

  const scrollToLyricTime = useCallback((lyricSec: number, smooth = false) => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = timeToProgress(lyricSec);
    const targetTop = Math.round(p * maxScroll);
    lastProgrammaticScrollTopRef.current = targetTop;
    window.scrollTo({
      top: targetTop,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Sync scroll position smoothly with music playback when syncScroll is active
  useEffect(() => {
    if (!isPlaying || !syncScroll) return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const targetTop = Math.round(timeToProgress(effectiveLyricTime) * maxScroll);
    if (Math.abs(window.scrollY - targetTop) > 4) {
      lastProgrammaticScrollTopRef.current = targetTop;
      window.scrollTo({ top: targetTop, behavior: 'auto' });
    }
  }, [isPlaying, syncScroll, effectiveLyricTime]);

  // Listen to manual user scroll
  useEffect(() => {
    const handleScroll = () => {
      const targetProgrammatic = lastProgrammaticScrollTopRef.current;
      if (targetProgrammatic !== null) {
        if (Math.abs(window.scrollY - targetProgrammatic) <= 3) {
          lastProgrammaticScrollTopRef.current = null;
          return;
        }
        lastProgrammaticScrollTopRef.current = null;
      }

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      setScrollProgress(p);

      const lyricSec = progressToTime(p);
      if (lyricSec < 199.5) {
        setHasEnded(false);
      }
      const audioSec = mapLyricTimeToAudioTime(
        lyricSec,
        syncProfileRef.current,
        syncOffsetSecRef.current
      );
      setAudioCurrentTime(audioSec);
      if (isPlayingRef.current && synthRef.current) {
        synthRef.current.seek(audioSec);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleTogglePlay = useCallback(async () => {
    const synth = synthRef.current;
    if (!synth) return;
    if (!isPlaying) {
      const lyricAt = progressToTime(scrollProgress);
      const audioStart = mapLyricTimeToAudioTime(lyricAt, syncProfile, syncOffsetSec);
      const shouldRestart = hasEnded || audioStart >= syncProfile.durationSec - 1;
      const safeStart = shouldRestart ? 0 : audioStart;
      if (shouldRestart) {
        setHasEnded(false);
        setScrollProgress(0);
        scrollToLyricTime(0, false);
      }
      synth.seek(safeStart);
      setAudioCurrentTime(safeStart);
      await synth.play();
      setIsPlaying(true);
    } else {
      synth.pause();
      const pausedLyric = mapAudioTimeToLyricTime(
        audioCurrentTimeRef.current,
        syncProfile,
        syncOffsetSec
      );
      setScrollProgress(timeToProgress(pausedLyric));
      if (syncScrollRef.current) {
        scrollToLyricTime(pausedLyric, false);
      }
      setIsPlaying(false);
      setAudioEnergy(0);
      setBassEnergy(0);
      setVocalEnergy(0);
    }
  }, [isPlaying, hasEnded, scrollProgress, syncProfile, syncOffsetSec, scrollToLyricTime]);

  const handleSeekAudio = useCallback(
    (audioSec: number) => {
      const clamped = Math.max(0, Math.min(syncProfile.durationSec, audioSec));
      setAudioCurrentTime(clamped);
      const lyricSec = mapAudioTimeToLyricTime(clamped, syncProfile, syncOffsetSec);
      if (lyricSec < 199.5) setHasEnded(false);
      setScrollProgress(timeToProgress(lyricSec));
      synthRef.current?.seek(clamped);
      scrollToLyricTime(lyricSec, false);
    },
    [syncProfile, syncOffsetSec, scrollToLyricTime]
  );

  const handleSeekLyric = useCallback(
    (lyricSec: number) => {
      const clampedLyric = Math.max(0, Math.min(SONG_DURATION_SEC, lyricSec));
      if (clampedLyric < 199.5) setHasEnded(false);
      const audioSec = mapLyricTimeToAudioTime(clampedLyric, syncProfile, syncOffsetSec);
      setAudioCurrentTime(audioSec);
      setScrollProgress(timeToProgress(clampedLyric));
      synthRef.current?.seek(audioSec);
      scrollToLyricTime(clampedLyric, false);
    },
    [syncProfile, syncOffsetSec, scrollToLyricTime]
  );

  const handlePrevAct = useCallback(() => {
    const idx = SONG_ACTS.findIndex((a) => a.id === activeActId);
    const prevIdx = Math.max(0, idx - 1);
    handleSeekLyric(SONG_ACTS[prevIdx].startSec + 0.05);
  }, [activeActId, handleSeekLyric]);

  const handleNextAct = useCallback(() => {
    const idx = SONG_ACTS.findIndex((a) => a.id === activeActId);
    const nextIdx = Math.min(SONG_ACTS.length - 1, idx + 1);
    handleSeekLyric(SONG_ACTS[nextIdx].startSec + 0.05);
  }, [activeActId, handleSeekLyric]);

  const handleVolumeChange = useCallback(
    (vol: number) => {
      setVolume(vol);
      if (vol > 0 && muted) {
        setMuted(false);
        synthRef.current?.setMuted(false);
      }
      synthRef.current?.setVolume(vol);
    },
    [muted]
  );

  const handleToggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    synthRef.current?.setMuted(next);
  }, [muted]);

  const handleChangeSyncOffset = useCallback(
    (deltaSec: number) => {
      const next = Math.max(-10, Math.min(10, Number((syncOffsetSec + deltaSec).toFixed(2))));
      setSyncOffsetSec(next);
      synthRef.current?.setSyncOffset(next);
    },
    [syncOffsetSec]
  );

  const handleSelectCustomAudio = useCallback(async (file: File) => {
    if (!synthRef.current) return;
    setIsPlaying(false);
    setHasEnded(false);
    setSourceMode('custom-file');
    setCustomFileName(file.name);
    setSyncOffsetSec(0);
    setAudioCurrentTime(0);
    setScrollProgress(0);
    window.scrollTo({ top: 0, behavior: 'auto' });

    await synthRef.current.loadCustomFile(file);
    try {
      await synthRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, []);

  const handleResetStudioAudio = useCallback(() => {
    synthRef.current?.loadStudioTrack();
    setSourceMode('studio-track');
    setCustomFileName('Alinhamento Milenar · Jão');
    setSyncOffsetSec(0);
    setAudioCurrentTime(0);
    setScrollProgress(0);
    setIsPlaying(false);
    setHasEnded(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Global drag-and-drop audio upload anywhere on viewport
  useEffect(() => {
    let dragCounter = 0;
    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        dragCounter++;
        setIsDraggingFile(true);
      }
    };
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        dragCounter = Math.max(0, dragCounter - 1);
        if (dragCounter === 0) setIsDraggingFile(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingFile(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name))) {
        void handleSelectCustomAudio(file);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleSelectCustomAudio]);

  // Support ?autostart=1 to jump straight into Estrofe I ("No meio da sala")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const timer = window.setTimeout(() => {
        handleSeekLyric(18.55);
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [handleSeekLyric]);

  // Keyboard shortcuts: Space (Play/Pause), H (Collapse Dock)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        void handleTogglePlay();
      } else if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTogglePlay]);

  const runwayHeightPx = WORD_CUES.length * RUNWAY_PX_PER_WORD;
  const displayedAudioTime = isPlaying
    ? audioCurrentTime
    : mapLyricTimeToAudioTime(effectiveLyricTime, syncProfile, syncOffsetSec);

  return (
    <div id="top" className="relative min-h-screen text-[#F4EFE6]">
      {/* Hidden input triggered by Hero "Subir Música" CTA */}
      <input
        ref={heroUploadInputRef}
        type="file"
        accept="audio/*"
        aria-label="Upload de arquivo de áudio"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleSelectCustomAudio(file);
          e.currentTarget.value = '';
        }}
      />

      {/* Isolated 3D WebGL Multi-World Canvas Mount */}
      <div
        ref={canvasMountRef}
        data-testid="three-canvas-container"
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Fallback gradient backdrop if WebGL is unavailable */}
      {webglFallback ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 45%, ${visualState.auroraHex}33 0%, ${visualState.bgHex} 72%)`,
          }}
        />
      ) : null}

      {/* Measured atmospheric readability scrim tinted to active motif */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[1] pointer-events-none transition-colors duration-500"
        style={{
          background: `radial-gradient(ellipse 68% 48% at 50% 48%, rgba(7, 8, 13, 0.24) 0%, rgba(7, 8, 13, 0.14) 55%, ${visualState.bgHex}99 100%)`,
        }}
      />

      {/* Smooth pure-black finale curtain so everything fades to darkness cleanly */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[2] bg-black pointer-events-none transition-opacity duration-1000 ease-out"
        style={{ opacity: isFinale ? 1 : 0 }}
      />

      {/* Drag & Drop Audio Overlay */}
      {isDraggingFile ? (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080D]/88 border-2 border-dashed border-[#E8A838] m-4 rounded-2xl pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <Upload className="h-9 w-9 text-[#E8A838]" aria-hidden="true" />
            <p className="font-display text-xl font-bold text-[#F4EFE6]">
              Solte a música aqui
            </p>
            <p className="text-xs text-[#B8C0CF]">
              A letra cinética e os mundos 3D serão sincronizados automaticamente com o áudio
            </p>
          </div>
        </div>
      ) : null}

      {/* Vertical Scroll Progress Hairline (fades out at finale) */}
      <div
        aria-hidden="true"
        className="fixed right-3 top-1/2 z-20 hidden h-36 w-[2px] -translate-y-1/2 bg-white/10 transition-opacity duration-700 sm:block"
        style={{ opacity: isFinale ? 0 : 1 }}
      >
        <div
          className="w-full origin-top transition-transform duration-150"
          style={{
            height: '100%',
            transform: `scaleY(${Math.max(0.03, effectiveProgress)})`,
            backgroundColor: visualState.accentHex,
          }}
        />
      </div>

      {/* Fixed Single-Word Kinetic Typography Cinema Stage (No Top Navbar) */}
      <main>
        <KineticWordStage
          cue={activeWordCue}
          isWordActive={isWordActive}
          isFinale={isFinale}
          accentHex={visualState.accentHex}
          auroraHex={visualState.auroraHex}
          audioEnergy={audioEnergy}
          vocalEnergy={vocalEnergy}
          isPlaying={isPlaying}
          isHeroIntro={activeWordIndex === 0 && !isPlaying && !isFinale}
          onStartExplore={() => handleSeekLyric(18.38)}
          onStartPlay={() => void handleTogglePlay()}
          onOpenUpload={() => heroUploadInputRef.current?.click()}
        />

        {/* Scroll Runway with semantic chapter anchor markers */}
        <div
          aria-hidden="true"
          className="relative w-full pointer-events-none"
          style={{ height: `${runwayHeightPx}px` }}
        >
          {SONG_ACTS.map((act) => (
            <div
              key={act.id}
              id={act.id}
              style={{
                position: 'absolute',
                top: `${timeToProgress(act.startSec) * 100}%`,
                left: 0,
                height: '1px',
                width: '1px',
              }}
            />
          ))}
        </div>
      </main>

      {/* Collapsible Bottom Music Player & Audio-Synced Motion Dock */}
      <PlayerDock
        isPlaying={isPlaying}
        currentTime={displayedAudioTime}
        duration={syncProfile.durationSec}
        volume={volume}
        muted={muted}
        syncScroll={syncScroll}
        syncOffsetSec={syncOffsetSec}
        collapsed={dockCollapsed}
        sourceMode={sourceMode}
        customFileName={customFileName}
        waveformPeaks={waveformPeaks}
        isAutoSynced={syncProfile.analyzed}
        onTogglePlay={() => void handleTogglePlay()}
        onSeek={handleSeekAudio}
        onPrevAct={handlePrevAct}
        onNextAct={handleNextAct}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleSyncScroll={() => setSyncScroll((s) => !s)}
        onChangeSyncOffset={handleChangeSyncOffset}
        onToggleCollapsed={() => setDockCollapsed((c) => !c)}
        onSelectCustomAudio={(f) => void handleSelectCustomAudio(f)}
        onResetStudioAudio={handleResetStudioAudio}
      />
    </div>
  );
}
