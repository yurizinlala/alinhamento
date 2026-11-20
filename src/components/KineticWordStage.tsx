import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, Play, Upload } from 'lucide-react';
import {
  SemanticMotif,
  WordCue,
  WordEntryAnim,
  WordTypographyVariant,
} from '../data/lyrics';

interface KineticWordStageProps {
  cue: WordCue;
  isWordActive: boolean;
  isFinale: boolean;
  accentHex: string;
  auroraHex: string;
  audioEnergy: number;
  vocalEnergy: number;
  isPlaying: boolean;
  isHeroIntro: boolean;
  onStartExplore: () => void;
  onStartPlay: () => void;
  onOpenUpload: () => void;
}

function getWordMotionPreset(anim: WordEntryAnim) {
  switch (anim) {
    case 'slam-drop':
      return {
        initial: { opacity: 0, y: -110, scale: 1.9, rotate: -4, filter: 'blur(8px)' },
        animate: { opacity: 1, y: 0, scale: 1, rotate: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: 65, scale: 0.72, filter: 'blur(6px)' },
        transition: { type: 'spring' as const, stiffness: 360, damping: 24 },
      };
    case 'whip-left':
      return {
        initial: { opacity: 0, x: -180, skewX: -24, scale: 0.9 },
        animate: { opacity: 1, x: 0, skewX: 0, scale: 1 },
        exit: { opacity: 0, x: 160, skewX: 16 },
        transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'whip-right':
      return {
        initial: { opacity: 0, x: 180, skewX: 24, scale: 0.9 },
        animate: { opacity: 1, x: 0, skewX: 0, scale: 1 },
        exit: { opacity: 0, x: -160, skewX: -16 },
        transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'rise-clip':
      return {
        initial: { opacity: 0, y: 80, clipPath: 'inset(100% 0% 0% 0%)' },
        animate: { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' },
        exit: { opacity: 0, y: -55, clipPath: 'inset(0% 0% 100% 0%)' },
        transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
      };
    case 'flip-3d-x':
      return {
        initial: { opacity: 0, rotateX: 88, y: 36, scale: 0.84 },
        animate: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
        exit: { opacity: 0, rotateX: -75, y: -30, scale: 0.85 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'rotate-swing':
      return {
        initial: { opacity: 0, rotate: -18, y: 64, scale: 0.82 },
        animate: { opacity: 1, rotate: 0, y: 0, scale: 1 },
        exit: { opacity: 0, rotate: 12, y: -48, scale: 0.88 },
        transition: { type: 'spring' as const, stiffness: 280, damping: 20 },
      };
    case 'pendulum-right':
      return {
        initial: { opacity: 0, rotate: 16, x: 75, y: -25 },
        animate: { opacity: 1, rotate: 0, x: 0, y: 0 },
        exit: { opacity: 0, rotate: -10, x: -65, y: 20 },
        transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
      };
    case 'letter-expand':
      return {
        initial: { opacity: 0, letterSpacing: '-0.14em', scaleX: 1.4, scaleY: 0.75 },
        animate: { opacity: 1, letterSpacing: '0.01em', scaleX: 1, scaleY: 1 },
        exit: { opacity: 0, letterSpacing: '0.24em', scale: 0.9 },
        transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'zoom-shatter':
      return {
        initial: { opacity: 0, scale: 0.2, filter: 'blur(14px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.6, filter: 'blur(10px)' },
        transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'outline-fill':
      return {
        initial: { opacity: 0, scale: 1.28, y: -18 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.82, y: 24 },
        transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'diagonal-slash':
      return {
        initial: { opacity: 0, x: -110, y: 85, rotate: -10 },
        animate: { opacity: 1, x: 0, y: 0, rotate: 0 },
        exit: { opacity: 0, x: 110, y: -75, rotate: 8 },
        transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'elastic-bounce':
      return {
        initial: { opacity: 0, scale: 0.35, y: 45 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.5, y: -40 },
        transition: { type: 'spring' as const, stiffness: 420, damping: 18 },
      };
    case 'vertical-stretch':
      return {
        initial: { opacity: 0, scaleY: 2.2, scaleX: 0.6, y: -40 },
        animate: { opacity: 1, scaleY: 1, scaleX: 1, y: 0 },
        exit: { opacity: 0, scaleY: 0.3, scaleX: 1.4 },
        transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'orbital-arc':
      return {
        initial: { opacity: 0, x: 105, y: -65, rotate: 14 },
        animate: { opacity: 1, x: 0, y: 0, rotate: 0 },
        exit: { opacity: 0, x: -95, y: 55, rotate: -12 },
        transition: { duration: 0.36, ease: [0.16, 1, 0.3, 1] as const },
      };
    case 'impact-flash':
      return {
        initial: { opacity: 0, scale: 2.35, filter: 'blur(10px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 0.72, filter: 'blur(8px)' },
        transition: { type: 'spring' as const, stiffness: 340, damping: 22 },
      };
    case 'glide-fade':
    default:
      return {
        initial: { opacity: 0, y: 34, letterSpacing: '0.2em' },
        animate: { opacity: 1, y: 0, letterSpacing: '0.02em' },
        exit: { opacity: 0, y: -28 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      };
  }
}

function getWordTypographyStyle(
  variant: WordTypographyVariant,
  accentHex: string
): { className: string; style: React.CSSProperties } {
  const baseShadow = '0 6px 36px rgba(5, 6, 12, 0.92), 0 2px 8px rgba(5, 6, 12, 0.96)';
  switch (variant) {
    case 'serif-italic':
      return {
        className:
          'font-serif italic font-semibold tracking-tight text-[clamp(2.85rem,11.8vw,9.0rem)] leading-none',
        style: {
          color: '#F6F0E4',
          textShadow: baseShadow,
        },
      };
    case 'outline-stroke':
      return {
        className:
          'font-display font-extrabold tracking-tight text-[clamp(2.65rem,11vw,8.5rem)] leading-none',
        style: {
          color: 'rgba(244, 239, 230, 0.16)',
          WebkitTextStroke: `2.5px ${accentHex}`,
          filter: 'drop-shadow(0 6px 28px rgba(5, 6, 12, 0.96))',
        },
      };
    case 'display-condensed':
      return {
        className:
          'font-display font-extrabold tracking-[-0.04em] text-[clamp(2.6rem,10.8vw,8.4rem)] leading-none',
        style: {
          color: '#F4EFE6',
          textShadow: baseShadow,
        },
      };
    case 'accent-gold':
      return {
        className:
          'font-display font-extrabold tracking-tight text-[clamp(2.75rem,11.4vw,8.9rem)] leading-none',
        style: {
          color: accentHex,
          textShadow: `${baseShadow}, 0 0 42px ${accentHex}55`,
        },
      };
    case 'display-heavy':
    default:
      return {
        className:
          'font-display font-extrabold tracking-tight text-[clamp(2.65rem,11vw,8.5rem)] leading-none',
        style: {
          color: '#F4EFE6',
          textShadow: baseShadow,
        },
      };
  }
}

const MotifBackdropGraphic: React.FC<{
  motif: SemanticMotif;
  accentHex: string;
  auroraHex: string;
}> = ({ motif, accentHex, auroraHex }) => {
  switch (motif) {
    case 'anjos':
      return (
        <svg viewBox="0 0 400 260" className="h-[min(62vw,340px)] w-[min(86vw,520px)] opacity-40">
          <path
            d="M196 138 C145 92 78 60 22 72 C55 112 95 138 158 148 M194 146 C140 120 82 110 38 126 C78 152 124 162 170 156"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.6"
          />
          <path
            d="M204 138 C255 92 322 60 378 72 C345 112 305 138 242 148 M206 146 C260 120 318 110 362 126 C322 152 276 162 230 156"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.6"
          />
          <circle cx="200" cy="82" r="24" fill="none" stroke={auroraHex} strokeWidth="1.2" />
        </svg>
      );
    case 'hora-exata':
    case 'tempo':
      return (
        <svg viewBox="0 0 320 320" className="h-[min(68vw,380px)] w-[min(68vw,380px)] opacity-45">
          <circle cx="160" cy="160" r="132" fill="none" stroke={accentHex} strokeWidth="1.5" />
          <circle
            cx="160"
            cy="160"
            r="116"
            fill="none"
            stroke={auroraHex}
            strokeWidth="0.9"
            strokeDasharray="4 8"
          />
          <line x1="160" y1="28" x2="160" y2="46" stroke={accentHex} strokeWidth="2.2" />
          <line x1="160" y1="274" x2="160" y2="292" stroke={accentHex} strokeWidth="1.5" />
          <line x1="28" y1="160" x2="46" y2="160" stroke={accentHex} strokeWidth="1.5" />
          <line x1="274" y1="160" x2="292" y2="160" stroke={accentHex} strokeWidth="1.5" />
          <line
            x1="160"
            y1="160"
            x2="160"
            y2={motif === 'hora-exata' ? '56' : '74'}
            stroke={accentHex}
            strokeWidth="2.4"
          />
          <line
            x1="160"
            y1="160"
            x2={motif === 'hora-exata' ? '160' : '228'}
            y2={motif === 'hora-exata' ? '82' : '116'}
            stroke={auroraHex}
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'praia':
      return (
        <svg viewBox="0 0 480 220" className="h-[min(50vw,280px)] w-[min(92vw,580px)] opacity-45">
          <path
            d="M16 125 Q 76 75, 136 125 T 256 125 T 376 125 T 464 125"
            fill="none"
            stroke={auroraHex}
            strokeWidth="2"
          />
          <path
            d="M28 156 Q 94 112, 160 156 T 292 156 T 424 156"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.4"
          />
          <circle cx="372" cy="58" r="24" fill="none" stroke={accentHex} strokeWidth="1.2" />
        </svg>
      );
    case 'festa':
      return (
        <svg viewBox="0 0 320 320" className="h-[min(70vw,400px)] w-[min(70vw,400px)] opacity-40">
          {Array.from({ length: 12 }, (_, idx) => {
            const ang = (idx / 12) * Math.PI * 2;
            const x1 = 160 + Math.cos(ang) * 58;
            const y1 = 160 + Math.sin(ang) * 58;
            const x2 = 160 + Math.cos(ang) * (idx % 2 === 0 ? 148 : 112);
            const y2 = 160 + Math.sin(ang) * (idx % 2 === 0 ? 148 : 112);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={idx % 2 === 0 ? auroraHex : accentHex}
                strokeWidth={idx % 2 === 0 ? '2' : '1.2'}
              />
            );
          })}
        </svg>
      );
    case 'amor':
      return (
        <svg viewBox="0 0 320 280" className="h-[min(62vw,340px)] w-[min(68vw,380px)] opacity-45">
          <circle cx="132" cy="140" r="68" fill="none" stroke={auroraHex} strokeWidth="1.5" />
          <circle cx="188" cy="140" r="68" fill="none" stroke={accentHex} strokeWidth="1.5" />
          <path
            d="M160 218 C108 176 74 142 74 106 C74 82 94 64 118 64 C138 64 152 76 160 90 C168 76 182 64 202 64 C226 64 246 82 246 106 C246 142 212 176 160 218 Z"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.2"
            opacity="0.7"
          />
        </svg>
      );
    case 'sala':
      return (
        <svg viewBox="0 0 360 300" className="h-[min(66vw,350px)] w-[min(76vw,420px)] opacity-40">
          <rect x="44" y="34" width="272" height="232" fill="none" stroke={accentHex} strokeWidth="1.4" />
          <rect x="92" y="64" width="176" height="172" fill="none" stroke={auroraHex} strokeWidth="1.2" />
          <line x1="44" y1="34" x2="92" y2="64" stroke={accentHex} strokeWidth="1" />
          <line x1="316" y1="34" x2="268" y2="64" stroke={accentHex} strokeWidth="1" />
          <line x1="44" y1="266" x2="92" y2="236" stroke={accentHex} strokeWidth="1" />
          <line x1="316" y1="266" x2="268" y2="236" stroke={accentHex} strokeWidth="1" />
        </svg>
      );
    case 'atenas':
    case 'capela':
      return (
        <svg viewBox="0 0 360 300" className="h-[min(66vw,360px)] w-[min(78vw,430px)] opacity-42">
          <path
            d="M66 258 L66 132 A114 114 0 0 1 294 132 L294 258"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.8"
          />
          <path
            d="M104 258 L104 140 A76 76 0 0 1 256 140 L256 258"
            fill="none"
            stroke={auroraHex}
            strokeWidth="1.2"
          />
          <line x1="42" y1="258" x2="318" y2="258" stroke={accentHex} strokeWidth="1.5" />
        </svg>
      );
    case 'roma-fogo':
      return (
        <svg viewBox="0 0 320 320" className="h-[min(66vw,370px)] w-[min(66vw,370px)] opacity-48">
          <path
            d="M160 34 C198 92 240 132 230 198 C222 246 194 278 160 286 C126 278 98 246 90 198 C80 132 122 92 160 34 Z"
            fill="none"
            stroke={auroraHex}
            strokeWidth="1.8"
          />
          <path
            d="M160 102 C182 140 202 166 196 208 C191 238 176 258 160 264 C144 258 129 238 124 208 C118 166 138 140 160 102 Z"
            fill="none"
            stroke={accentHex}
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'alinhamento':
      return (
        <svg viewBox="0 0 340 340" className="h-[min(70vw,390px)] w-[min(70vw,390px)] opacity-48">
          <circle cx="170" cy="170" r="118" fill="none" stroke={accentHex} strokeWidth="1.8" />
          <circle cx="170" cy="170" r="88" fill="none" stroke={auroraHex} strokeWidth="1.3" />
          <line x1="22" y1="170" x2="318" y2="170" stroke={accentHex} strokeWidth="1" />
          <line x1="170" y1="22" x2="170" y2="318" stroke={accentHex} strokeWidth="1" />
        </svg>
      );
    case 'escolha':
    case 'vidas':
      return (
        <svg viewBox="0 0 420 220" className="h-[min(50vw,280px)] w-[min(86vw,500px)] opacity-42">
          <path
            d="M120 110 C120 60 190 60 210 110 C230 160 300 160 300 110 C300 60 230 60 210 110 C190 160 120 160 120 110 Z"
            fill="none"
            stroke={auroraHex}
            strokeWidth="1.8"
          />
          <circle cx="120" cy="110" r="5" fill={accentHex} />
          <circle cx="300" cy="110" r="5" fill={accentHex} />
        </svg>
      );
    case 'madrugada':
      return (
        <svg viewBox="0 0 320 320" className="h-[min(64vw,350px)] w-[min(64vw,350px)] opacity-42">
          <path
            d="M198 76 A84 84 0 1 0 244 212 A66 66 0 1 1 198 76 Z"
            fill="none"
            stroke={auroraHex}
            strokeWidth="1.8"
          />
          <circle cx="222" cy="106" r="3" fill={accentHex} />
        </svg>
      );
    case 'charme':
    case 'intro':
    default:
      return (
        <svg viewBox="0 0 320 320" className="h-[min(66vw,370px)] w-[min(66vw,370px)] opacity-35">
          <circle cx="160" cy="160" r="126" fill="none" stroke={accentHex} strokeWidth="1.1" />
          <polygon
            points="160,36 284,160 160,284 36,160"
            fill="none"
            stroke={auroraHex}
            strokeWidth="1"
          />
        </svg>
      );
  }
};

export const KineticWordStage: React.FC<KineticWordStageProps> = ({
  cue,
  isWordActive,
  isFinale,
  accentHex,
  auroraHex,
  audioEnergy,
  vocalEnergy,
  isPlaying,
  isHeroIntro,
  onStartExplore,
  onStartPlay,
  onOpenUpload,
}) => {
  const preset = getWordMotionPreset(cue.entryAnim);
  const typo = getWordTypographyStyle(cue.typography, accentHex);
  const pulseScale = isPlaying ? 1 + audioEnergy * 0.035 + vocalEnergy * 0.045 : 1;
  const isImpact = cue.entryAnim === 'impact-flash' || cue.entryAnim === 'zoom-shatter';

  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none flex flex-col items-center justify-center px-4 pb-20 pt-8"
      style={{ perspective: '1100px' }}
    >
      {/* Dynamic Lyric-Reactive Vector Art Frame (fades out completely at finale) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden transition-opacity duration-700"
        style={{ opacity: isFinale ? 0 : 1 }}
      >
        {/* Expanding Shockwave Ring on active word entry */}
        {isWordActive && !isFinale ? (
          <motion.div
            key={`ring-${cue.id}`}
            initial={{ scale: 0.45, opacity: isImpact ? 0.65 : 0.25 }}
            animate={{ scale: isImpact ? 1.85 : 1.35, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="absolute h-64 w-64 sm:h-88 sm:w-88 rounded-full border"
            style={{ borderColor: auroraHex }}
          />
        ) : null}

        {/* Semantic Lyric-Driven Vector Art */}
        <AnimatePresence mode="wait">
          {!isFinale ? (
            <motion.div
              key={`motif-${cue.motif}`}
              initial={{ opacity: 0, scale: 0.88, rotate: -6 }}
              animate={{ opacity: 1, scale: pulseScale, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute flex items-center justify-center"
            >
              <MotifBackdropGraphic
                motif={cue.motif}
                accentHex={accentHex}
                auroraHex={auroraHex}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* SINGLE-WORD KINETIC STAGE OR FINALE MESSAGE */}
      <div className="relative flex min-h-[140px] sm:min-h-[190px] w-full max-w-5xl items-center justify-center">
        <AnimatePresence mode="popLayout">
          {isFinale ? (
            <motion.p
              key="finale-dedication"
              data-testid="finale-message"
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif italic text-center text-[clamp(1.75rem,4.6vw,3.4rem)] font-medium tracking-wide text-[#F4EFE6] select-none px-4"
            >
              você me ama e eu te amo
            </motion.p>
          ) : isWordActive ? (
            <motion.div
              key={cue.id}
              data-testid="active-kinetic-word"
              data-anim={cue.entryAnim}
              data-motif={cue.motif}
              initial={preset.initial}
              animate={{
                ...preset.animate,
                scale:
                  (typeof preset.animate.scale === 'number' ? preset.animate.scale : 1) *
                  pulseScale,
              }}
              exit={preset.exit}
              transition={preset.transition}
              className={`${typo.className} text-center select-none px-3`}
              style={typo.style}
            >
              {cue.word}
            </motion.div>
          ) : (
            <motion.div
              key="vocal-rest"
              data-testid="vocal-rest-gap"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: accentHex }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Hero CTA actions when at start of song (no navbar needed) */}
      {isHeroIntro ? (
        <div className="pointer-events-auto mt-7 flex flex-col items-center gap-3.5">
          <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-[#D2D8E4]">
            <span>Jão</span>
            <span aria-hidden="true">·</span>
            <span>Álbum SUPER</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">03:21</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onStartPlay}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8A838] px-4 py-2 text-xs font-semibold text-[#07080D] transition-colors duration-150 hover:bg-[#F2BA52] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EFE6]"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>{isPlaying ? 'Pausar Música' : 'Ouvir Agora'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-[#07080D]/75 px-4 py-2 text-xs font-medium text-[#F4EFE6] transition-colors duration-150 hover:border-[#E8A838] hover:text-[#E8A838] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Subir Música</span>
            </button>
            <button
              type="button"
              onClick={onStartExplore}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#07080D]/55 px-3.5 py-2 text-xs font-medium text-[#B8C0CF] transition-colors duration-150 hover:border-white/30 hover:text-[#F4EFE6] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]"
            >
              <span>Explorar</span>
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
