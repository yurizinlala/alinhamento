import React, { useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Link2,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { AudioSourceMode } from '../audio/SynthEngine';
import { formatTimecode } from '../utils/choreography';

interface PlayerDockProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  syncScroll: boolean;
  syncOffsetSec: number;
  collapsed: boolean;
  sourceMode: AudioSourceMode;
  customFileName: string | null;
  waveformPeaks: number[];
  isAutoSynced: boolean;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
  onPrevAct: () => void;
  onNextAct: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleSyncScroll: () => void;
  onChangeSyncOffset: (deltaSec: number) => void;
  onToggleCollapsed: () => void;
  onSelectCustomAudio: (file: File) => void;
  onResetStudioAudio: () => void;
}

export const PlayerDock: React.FC<PlayerDockProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  syncScroll,
  syncOffsetSec,
  collapsed,
  sourceMode,
  customFileName,
  waveformPeaks,
  isAutoSynced,
  onTogglePlay,
  onSeek,
  onPrevAct,
  onNextAct,
  onVolumeChange,
  onToggleMute,
  onToggleSyncScroll,
  onChangeSyncOffset,
  onToggleCollapsed,
  onSelectCustomAudio,
  onResetStudioAudio,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  return (
    <div className="fixed bottom-3 left-1/2 z-30 w-[min(940px,94vw)] -translate-x-1/2 pointer-events-none">
      {/* Collapse / Expand toggle tab */}
      <div className="flex justify-center pointer-events-auto">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Mostrar player de música' : 'Ocultar player de música'}
          className="inline-flex h-6 items-center gap-1.5 rounded-t-lg border border-b-0 border-white/15 bg-[#0B0D14]/94 px-3 text-[11px] font-medium text-[#B8C0CF] transition-colors duration-150 hover:text-[#F4EFE6] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]"
        >
          {collapsed ? (
            <>
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
              <span>Mostrar Player</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
              <span>Ocultar Player</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container — no backdrop-blur over WebGL */}
      <div
        className={`pointer-events-auto overflow-hidden rounded-xl border border-white/15 bg-[#0B0D14]/95 shadow-2xl transition-all duration-300 ease-out ${
          collapsed
            ? 'max-h-0 opacity-0 border-transparent pointer-events-none'
            : 'max-h-56 opacity-100 px-3 py-2.5 sm:px-5 sm:py-3.5'
        }`}
      >
        {/* Top metadata & real audio waveform scrubber */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between gap-3 text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 min-w-0 truncate text-[#F4EFE6]">
              <span className="font-semibold text-[#E8A838] truncate">
                {customFileName || 'Alinhamento Milenar · Jão'}
              </span>
              {isAutoSynced ? (
                <span className="hidden md:inline font-mono text-[10px] text-[#E8A838]/90 whitespace-nowrap">
                  · Áudio Sincronizado
                </span>
              ) : null}
            </div>

            <div className="font-mono text-[11px] sm:text-xs tabular-nums text-[#B8C0CF] whitespace-nowrap shrink-0">
              <span className="text-[#F4EFE6]">{formatTimecode(currentTime)}</span>
              <span className="mx-1 text-white/35">/</span>
              <span>{formatTimecode(duration)}</span>
            </div>
          </div>

          {/* Interactive Waveform + Range Scrubber */}
          <div className="relative flex h-6 items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 flex h-5 items-center justify-between gap-[2px]"
            >
              {waveformPeaks.map((peak, idx) => {
                const barRatio = idx / Math.max(1, waveformPeaks.length - 1);
                const passed = barRatio <= progressRatio;
                return (
                  <span
                    key={idx}
                    className="flex-1 rounded-full transition-colors duration-100"
                    style={{
                      height: `${Math.max(18, Math.round(peak * 100))}%`,
                      backgroundColor: passed
                        ? 'rgba(232, 168, 56, 0.85)'
                        : 'rgba(244, 239, 230, 0.16)',
                    }}
                  />
                );
              })}
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.05}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Progresso da música"
              className="motion-slider relative z-10 w-full opacity-80"
            />
          </div>
        </div>

        {/* Playback, Upload, Calibration & Volume Controls */}
        <div className="mt-2 sm:mt-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Transport controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={onPrevAct}
              aria-label="Seção anterior"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[#B8C0CF] transition-colors duration-150 hover:bg-white/10 hover:text-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]"
            >
              <SkipBack className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pausar música' : 'Reproduzir música'}
              className="flex h-8 min-w-8 sm:h-9 sm:min-w-9 items-center justify-center gap-2 rounded-lg bg-[#E8A838] px-3 sm:px-3.5 text-xs font-semibold text-[#07080D] transition-colors duration-150 hover:bg-[#F2BA52] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EFE6]"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" aria-hidden="true" />
                  <span className="hidden sm:inline">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" aria-hidden="true" />
                  <span className="hidden sm:inline">Tocar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onNextAct}
              aria-label="Próxima seção"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[#B8C0CF] transition-colors duration-150 hover:bg-white/10 hover:text-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Right: Sync Scroll, Upload Music, Offset Calibration, Volume */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleSyncScroll}
              aria-pressed={syncScroll}
              aria-label="Sincronizar rolagem com a música"
              className={`inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 text-[11px] sm:text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838] ${
                syncScroll
                  ? 'border-[#E8A838]/50 bg-[#E8A838]/15 text-[#E8A838]'
                  : 'border-white/10 bg-transparent text-[#B8C0CF] hover:text-[#F4EFE6]'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              aria-label="Selecionar arquivo de música"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSelectCustomAudio(file);
                e.currentTarget.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Subir música MP3 ou WAV"
              title="Subir música (MP3, WAV, M4A) e sincronizar a letra automaticamente"
              className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-medium text-[#F4EFE6] transition-colors duration-150 hover:border-[#E8A838] hover:text-[#E8A838] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Subir Música</span>
            </button>

            {/* Fine offset calibration when audio is active */}
            <div className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeSyncOffset(-0.25)}
                aria-label="Atrasar letra em 0.25s"
                className="h-9 rounded-lg border border-white/10 px-2 font-mono text-[11px] text-[#B8C0CF] hover:text-[#F4EFE6]"
              >
                -0.25s
              </button>
              <span className="font-mono text-[11px] tabular-nums text-[#E8A838] px-1">
                {syncOffsetSec >= 0 ? `+${syncOffsetSec.toFixed(2)}s` : `${syncOffsetSec.toFixed(2)}s`}
              </span>
              <button
                type="button"
                onClick={() => onChangeSyncOffset(0.25)}
                aria-label="Adiantar letra em 0.25s"
                className="h-9 rounded-lg border border-white/10 px-2 font-mono text-[11px] text-[#B8C0CF] hover:text-[#F4EFE6]"
              >
                +0.25s
              </button>
            </div>

            {sourceMode === 'custom-file' ? (
              <button
                type="button"
                onClick={onResetStudioAudio}
                aria-label="Voltar para a faixa original"
                title="Voltar para a faixa original"
                className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#B8C0CF] hover:text-[#F4EFE6]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}

            <div className="flex items-center gap-1.5 pl-0.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Ativar som' : 'Silenciar som'}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-[#B8C0CF] transition-colors duration-150 hover:bg-white/10 hover:text-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-[#D95D39]" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <div className="hidden sm:flex items-center w-20">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  aria-label="Controle de volume"
                  className="motion-slider w-full"
                />
              </div>
              <span className="hidden lg:inline font-mono text-[11px] tabular-nums text-[#B8C0CF] w-8 text-right">
                {muted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
