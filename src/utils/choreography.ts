import {
  ActId,
  SemanticMotif,
  SONG_ACTS,
  SONG_DURATION_SEC,
  WORD_CUES,
} from '../data/lyrics';

export interface SceneVisualState {
  actId: ActId;
  motif: SemanticMotif;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  camRoll: number;
  alignmentConvergence: number;
  syzygyLock: number;
  ringSpread: number;
  astrolabeTilt: [number, number, number];
  coreIntensity: number;
  particleSpread: number;
  waveVisibility: number;
  tunnelVisibility: number;
  templeVisibility: number;
  helixVisibility: number;
  clockVisibility: number;
  archVisibility: number;
  wingsVisibility: number;
  discoVisibility: number;
  praiaVisibility: number;
  madrugadaVisibility: number;
  amorVisibility: number;
  salaVisibility: number;
  romaFireVisibility: number;
  emberIntensity: number;
  bgHex: string;
  bgSecondaryHex: string;
  auroraHex: string;
  accentHex: string;
  keyLightHex: string;
  rimLightHex: string;
}

export interface ActKeyframe {
  actId: ActId;
  centerProgress: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  camRoll: number;
  alignmentConvergence: number;
  syzygyLock: number;
  ringSpread: number;
  astrolabeTilt: [number, number, number];
  coreIntensity: number;
  particleSpread: number;
  waveVisibility: number;
  tunnelVisibility: number;
  templeVisibility: number;
  helixVisibility: number;
  clockVisibility: number;
  archVisibility: number;
  wingsVisibility: number;
  discoVisibility: number;
  praiaVisibility: number;
  madrugadaVisibility: number;
  amorVisibility: number;
  salaVisibility: number;
  romaFireVisibility: number;
  emberIntensity: number;
  bgColor: [number, number, number];
  bgSecondary: [number, number, number];
  auroraColor: [number, number, number];
  accentColor: [number, number, number];
  keyLightColor: [number, number, number];
  rimLightColor: [number, number, number];
}

export const ACT_KEYFRAMES: ActKeyframe[] = [
  {
    actId: 'intro',
    centerProgress: 0.0,
    camPos: [0, 1.1, 8.8],
    lookAt: [0, 0.1, 0],
    camRoll: 0.0,
    alignmentConvergence: 0.14,
    syzygyLock: 0.0,
    ringSpread: 1.0,
    astrolabeTilt: [0.3, 0.25, 0.1],
    coreIntensity: 0.85,
    particleSpread: 1.0,
    waveVisibility: 0.15,
    tunnelVisibility: 0.0,
    templeVisibility: 0.0,
    helixVisibility: 0.0,
    clockVisibility: 0.2,
    archVisibility: 0.0,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.1,
    bgColor: [7, 8, 14], // obsidian cosmos
    bgSecondary: [18, 22, 38],
    auroraColor: [232, 168, 56],
    accentColor: [232, 168, 56],
    keyLightColor: [255, 214, 153],
    rimLightColor: [110, 155, 225],
  },
  {
    actId: 'estrofe-1',
    centerProgress: 18.32 / SONG_DURATION_SEC,
    camPos: [-3.4, 0.9, 7.6],
    lookAt: [0.3, -0.1, 0],
    camRoll: -0.06,
    alignmentConvergence: 0.3,
    syzygyLock: 0.0,
    ringSpread: 0.88,
    astrolabeTilt: [0.62, -0.45, 0.25],
    coreIntensity: 1.05,
    particleSpread: 0.85,
    waveVisibility: 0.45,
    tunnelVisibility: 0.0,
    templeVisibility: 0.0,
    helixVisibility: 0.0,
    clockVisibility: 0.0,
    archVisibility: 0.85,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.2,
    bgColor: [34, 10, 20],
    bgSecondary: [82, 24, 38],
    auroraColor: [244, 126, 88],
    accentColor: [246, 184, 114],
    keyLightColor: [255, 196, 140],
    rimLightColor: [228, 108, 124],
  },
  {
    actId: 'pre-refrao-1',
    centerProgress: 32.86 / SONG_DURATION_SEC,
    camPos: [3.6, 2.0, 7.2],
    lookAt: [-0.2, 0.1, 0],
    camRoll: 0.09,
    alignmentConvergence: 0.62,
    syzygyLock: 0.0,
    ringSpread: 1.18,
    astrolabeTilt: [-0.32, 0.78, -0.32],
    coreIntensity: 1.45,
    particleSpread: 1.25,
    waveVisibility: 0.55,
    tunnelVisibility: 1.0,
    templeVisibility: 0.0,
    helixVisibility: 0.0,
    clockVisibility: 0.15,
    archVisibility: 0.0,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.3,
    bgColor: [5, 18, 46],
    bgSecondary: [14, 64, 118],
    auroraColor: [56, 208, 255],
    accentColor: [110, 224, 255],
    keyLightColor: [230, 244, 255],
    rimLightColor: [64, 184, 255],
  },
  {
    actId: 'refrao-1',
    centerProgress: 47.0 / SONG_DURATION_SEC,
    camPos: [0, 0.25, 6.2],
    lookAt: [0, 0, -0.4],
    camRoll: 0.0,
    alignmentConvergence: 1.0,
    syzygyLock: 0.45,
    ringSpread: 0.68,
    astrolabeTilt: [0.0, 0.0, 0.0],
    coreIntensity: 2.15,
    particleSpread: 1.45,
    waveVisibility: 0.0,
    tunnelVisibility: 0.45,
    templeVisibility: 0.0,
    helixVisibility: 0.35,
    clockVisibility: 0.78,
    archVisibility: 0.0,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.6,
    bgColor: [34, 19, 4],
    bgSecondary: [108, 58, 10],
    auroraColor: [255, 202, 72],
    accentColor: [255, 208, 84],
    keyLightColor: [255, 232, 165],
    rimLightColor: [255, 162, 64],
  },
  {
    actId: 'estrofe-2',
    centerProgress: 89.66 / SONG_DURATION_SEC,
    camPos: [-3.9, -1.0, 8.6],
    lookAt: [0, 0.35, 0],
    camRoll: -0.08,
    alignmentConvergence: 0.42,
    syzygyLock: 0.0,
    ringSpread: 1.25,
    astrolabeTilt: [0.85, 0.52, -0.38],
    coreIntensity: 1.5,
    particleSpread: 1.15,
    waveVisibility: 0.0,
    tunnelVisibility: 0.0,
    templeVisibility: 1.0,
    helixVisibility: 0.0,
    clockVisibility: 0.0,
    archVisibility: 0.9,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 1.0,
    bgColor: [44, 9, 8],
    bgSecondary: [122, 26, 14],
    auroraColor: [248, 88, 48],
    accentColor: [255, 136, 86],
    keyLightColor: [255, 184, 132],
    rimLightColor: [245, 78, 48],
  },
  {
    actId: 'pre-refrao-2',
    centerProgress: 104.34 / SONG_DURATION_SEC,
    camPos: [3.4, 1.7, 7.1],
    lookAt: [0, 0, 0],
    camRoll: 0.08,
    alignmentConvergence: 0.72,
    syzygyLock: 0.0,
    ringSpread: 1.05,
    astrolabeTilt: [-0.45, -0.65, 0.25],
    coreIntensity: 1.65,
    particleSpread: 1.3,
    waveVisibility: 0.35,
    tunnelVisibility: 1.0,
    templeVisibility: 0.0,
    helixVisibility: 0.25,
    clockVisibility: 0.25,
    archVisibility: 0.0,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.45,
    bgColor: [16, 16, 52],
    bgSecondary: [56, 36, 120],
    auroraColor: [162, 148, 255],
    accentColor: [176, 208, 255],
    keyLightColor: [255, 224, 182],
    rimLightColor: [144, 168, 255],
  },
  {
    actId: 'refrao-2',
    centerProgress: 118.34 / SONG_DURATION_SEC,
    camPos: [0, 0.2, 5.9],
    lookAt: [0, 0, -0.4],
    camRoll: 0.0,
    alignmentConvergence: 1.0,
    syzygyLock: 0.5,
    ringSpread: 0.62,
    astrolabeTilt: [0.03, 0.0, 0.0],
    coreIntensity: 2.3,
    particleSpread: 1.5,
    waveVisibility: 0.0,
    tunnelVisibility: 0.6,
    templeVisibility: 0.0,
    helixVisibility: 0.55,
    clockVisibility: 0.85,
    archVisibility: 0.0,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.75,
    bgColor: [40, 20, 4],
    bgSecondary: [118, 62, 12],
    auroraColor: [255, 206, 82],
    accentColor: [255, 206, 82],
    keyLightColor: [255, 236, 172],
    rimLightColor: [255, 168, 72],
  },
  {
    actId: 'ponte',
    centerProgress: 153.0 / SONG_DURATION_SEC,
    camPos: [0, 3.6, 7.6],
    lookAt: [0, -0.15, 0],
    camRoll: 0.04,
    alignmentConvergence: 0.88,
    syzygyLock: 0.25,
    ringSpread: 1.38,
    astrolabeTilt: [1.1, 0.0, 0.42],
    coreIntensity: 1.75,
    particleSpread: 1.65,
    waveVisibility: 0.0,
    tunnelVisibility: 0.0,
    templeVisibility: 0.0,
    helixVisibility: 1.0,
    clockVisibility: 0.2,
    archVisibility: 0.0,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.1,
    bgColor: [10, 16, 44],
    bgSecondary: [32, 48, 104],
    auroraColor: [188, 208, 255],
    accentColor: [232, 238, 255],
    keyLightColor: [224, 236, 255],
    rimLightColor: [152, 188, 255],
  },
  {
    actId: 'outro',
    centerProgress: 168.56 / SONG_DURATION_SEC,
    camPos: [0, 0.9, 10.2],
    lookAt: [0, 0, -0.4],
    camRoll: 0.0,
    alignmentConvergence: 0.96,
    syzygyLock: 0.75,
    ringSpread: 0.85,
    astrolabeTilt: [0.16, 0.32, 0.06],
    coreIntensity: 1.35,
    particleSpread: 1.85,
    waveVisibility: 0.2,
    tunnelVisibility: 0.0,
    templeVisibility: 0.0,
    helixVisibility: 0.75,
    clockVisibility: 0.9,
    archVisibility: 0.0,
    wingsVisibility: 0.0,
    discoVisibility: 0.0,
    praiaVisibility: 0.0,
    madrugadaVisibility: 0.0,
    amorVisibility: 0.0,
    salaVisibility: 0.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.15,
    bgColor: [9, 10, 22],
    bgSecondary: [32, 24, 52],
    auroraColor: [232, 176, 84],
    accentColor: [242, 196, 110],
    keyLightColor: [255, 220, 168],
    rimLightColor: [134, 170, 232],
  },
];

interface MotifOverride {
  camPos?: [number, number, number];
  lookAt?: [number, number, number];
  astrolabeTilt?: [number, number, number];
  ringSpread?: number;
  bgColor?: [number, number, number];
  bgSecondary?: [number, number, number];
  auroraColor?: [number, number, number];
  accentColor?: [number, number, number];
  keyLightColor?: [number, number, number];
  rimLightColor?: [number, number, number];
  waveVisibility?: number;
  tunnelVisibility?: number;
  templeVisibility?: number;
  helixVisibility?: number;
  clockVisibility?: number;
  archVisibility?: number;
  wingsVisibility?: number;
  discoVisibility?: number;
  praiaVisibility?: number;
  madrugadaVisibility?: number;
  amorVisibility?: number;
  salaVisibility?: number;
  romaFireVisibility?: number;
  emberIntensity?: number;
  alignmentConvergence?: number;
  syzygyLock?: number;
}

const MOTIF_OVERRIDES: Partial<Record<SemanticMotif, MotifOverride>> = {
  sala: {
    camPos: [-2.4, 0.65, 7.2],
    bgColor: [30, 14, 18],
    bgSecondary: [78, 34, 28],
    auroraColor: [245, 168, 98],
    accentColor: [250, 200, 128],
    archVisibility: 0.85,
    salaVisibility: 1.0,
    waveVisibility: 0.25,
    emberIntensity: 0.15,
  },
  amor: {
    camPos: [0, 0.22, 5.25],
    lookAt: [0, 0, -0.5],
    bgColor: [46, 10, 28],
    bgSecondary: [118, 22, 62],
    auroraColor: [255, 110, 152],
    accentColor: [255, 172, 198],
    rimLightColor: [255, 92, 142],
    amorVisibility: 1.0,
    helixVisibility: 0.35,
    syzygyLock: 0.45,
  },
  anjos: {
    camPos: [0, 0.45, 6.9],
    lookAt: [0, 0.1, -0.8],
    bgColor: [20, 24, 48],
    bgSecondary: [68, 66, 114],
    auroraColor: [255, 232, 176],
    accentColor: [255, 242, 206],
    keyLightColor: [255, 248, 225],
    rimLightColor: [198, 214, 255],
    wingsVisibility: 1.0,
    archVisibility: 0.55,
    emberIntensity: 0.08,
  },
  charme: {
    bgColor: [28, 14, 38],
    bgSecondary: [82, 34, 96],
    auroraColor: [248, 174, 112],
    accentColor: [255, 212, 148],
  },
  festa: {
    camPos: [1.8, -0.15, 6.4],
    bgColor: [32, 8, 52],
    bgSecondary: [112, 18, 128],
    auroraColor: [255, 88, 210],
    accentColor: [255, 148, 236],
    rimLightColor: [214, 72, 255],
    discoVisibility: 1.0,
    tunnelVisibility: 1.0,
    waveVisibility: 0.2,
  },
  praia: {
    camPos: [0, 0.42, 6.4],
    lookAt: [0, -0.15, -1.2],
    bgColor: [6, 30, 46],
    bgSecondary: [14, 92, 116],
    auroraColor: [64, 236, 214],
    accentColor: [132, 248, 232],
    keyLightColor: [224, 252, 248],
    rimLightColor: [52, 208, 224],
    praiaVisibility: 1.0,
    waveVisibility: 1.0,
    tunnelVisibility: 0.0,
    emberIntensity: 0.05,
  },
  madrugada: {
    camPos: [2.2, 1.05, 7.0],
    bgColor: [4, 8, 28],
    bgSecondary: [14, 24, 74],
    auroraColor: [108, 152, 255],
    accentColor: [164, 198, 255],
    rimLightColor: [84, 134, 255],
    madrugadaVisibility: 1.0,
    tunnelVisibility: 0.72,
    waveVisibility: 0.25,
  },
  tempo: {
    camPos: [0, 0.25, 5.8],
    bgColor: [16, 22, 36],
    bgSecondary: [46, 56, 86],
    auroraColor: [222, 186, 112],
    accentColor: [244, 212, 148],
    clockVisibility: 0.82,
    syzygyLock: 0.35,
  },
  'hora-exata': {
    camPos: [0, 0.12, 5.0],
    lookAt: [0, 0, -0.7],
    astrolabeTilt: [0, 0, 0],
    bgColor: [18, 22, 32],
    bgSecondary: [58, 54, 42],
    auroraColor: [255, 212, 88],
    accentColor: [255, 224, 118],
    keyLightColor: [255, 240, 188],
    clockVisibility: 1.0,
    alignmentConvergence: 0.96,
    syzygyLock: 0.65,
  },
  alinhamento: {
    // Camera zooms close to the planets as they lock into literal collinear alignment!
    camPos: [0, 0.42, 3.25],
    lookAt: [0, -0.04, -1.0],
    astrolabeTilt: [0, 0, 0],
    ringSpread: 0.96,
    bgColor: [38, 20, 4],
    bgSecondary: [118, 62, 10],
    auroraColor: [255, 204, 72],
    accentColor: [255, 218, 102],
    clockVisibility: 0.35,
    tunnelVisibility: 0.0,
    helixVisibility: 0.0,
    alignmentConvergence: 1.0,
    syzygyLock: 1.0,
  },
  atenas: {
    camPos: [-3.2, -0.75, 8.2],
    bgColor: [10, 26, 52],
    bgSecondary: [36, 78, 128],
    auroraColor: [168, 214, 255],
    accentColor: [236, 244, 255],
    keyLightColor: [242, 248, 255],
    rimLightColor: [112, 178, 248],
    templeVisibility: 1.0,
    archVisibility: 0.92,
    romaFireVisibility: 0.0,
    emberIntensity: 0.08,
  },
  capela: {
    camPos: [0, -0.85, 7.5],
    bgColor: [34, 18, 14],
    bgSecondary: [96, 52, 28],
    auroraColor: [255, 192, 112],
    accentColor: [255, 222, 168],
    templeVisibility: 0.92,
    archVisibility: 1.0,
    romaFireVisibility: 0.0,
    emberIntensity: 0.3,
  },
  'roma-fogo': {
    camPos: [-2.8, -0.65, 7.9],
    bgColor: [48, 8, 6],
    bgSecondary: [142, 28, 10],
    auroraColor: [255, 92, 36],
    accentColor: [255, 142, 72],
    keyLightColor: [255, 188, 128],
    rimLightColor: [255, 72, 28],
    templeVisibility: 1.0,
    archVisibility: 0.65,
    romaFireVisibility: 1.0,
    emberIntensity: 1.0,
  },
  escolha: {
    bgColor: [10, 18, 46],
    bgSecondary: [36, 54, 118],
    auroraColor: [192, 214, 255],
    accentColor: [242, 246, 255],
    helixVisibility: 1.0,
    emberIntensity: 0.05,
  },
  vidas: {
    bgColor: [16, 12, 42],
    bgSecondary: [56, 34, 108],
    auroraColor: [212, 188, 255],
    accentColor: [244, 226, 255],
    helixVisibility: 1.0,
    alignmentConvergence: 0.94,
    emberIntensity: 0.08,
  },
};

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function smoothstep01(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgbTupleToHex(rgb: [number, number, number]): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

export function timeToProgress(timeSec: number): number {
  return clamp01(timeSec / SONG_DURATION_SEC);
}

export function progressToTime(progress: number): number {
  return clamp01(progress) * SONG_DURATION_SEC;
}

export function findWordIndexAtTime(timeSec: number): number {
  const clamped = Math.max(0, Math.min(SONG_DURATION_SEC - 0.001, timeSec));
  for (let i = 0; i < WORD_CUES.length; i++) {
    const cue = WORD_CUES[i];
    if (clamped >= cue.startSec && clamped < cue.endSec) {
      return i;
    }
  }
  return WORD_CUES.length - 1;
}

export function findActAtTime(timeSec: number): ActId {
  const clamped = Math.max(0, Math.min(SONG_DURATION_SEC - 0.001, timeSec));
  for (const act of SONG_ACTS) {
    if (clamped >= act.startSec && clamped < act.endSec) {
      return act.id;
    }
  }
  return 'outro';
}

export function computeSceneStateForCue(
  progress: number,
  explicitMotif?: SemanticMotif
): SceneVisualState {
  const p = clamp01(progress);
  const timeSec = progressToTime(p);
  const activeCue = WORD_CUES[findWordIndexAtTime(timeSec)] ?? WORD_CUES[0];
  const motif: SemanticMotif = explicitMotif ?? activeCue.motif;

  let prev = ACT_KEYFRAMES[0];
  let next = ACT_KEYFRAMES[ACT_KEYFRAMES.length - 1];
  let t = 0;

  let activeIdx = ACT_KEYFRAMES.length - 1;
  for (let i = 0; i < ACT_KEYFRAMES.length - 1; i++) {
    if (p < ACT_KEYFRAMES[i + 1].centerProgress) {
      activeIdx = i;
      break;
    }
  }

  if (activeIdx < ACT_KEYFRAMES.length - 1) {
    const curr = ACT_KEYFRAMES[activeIdx];
    const upcoming = ACT_KEYFRAMES[activeIdx + 1];
    const actSpan = Math.max(0.001, upcoming.centerProgress - curr.centerProgress);
    const rampSpan = Math.min(0.015, actSpan * 0.25);
    const rampStart = upcoming.centerProgress - rampSpan;

    prev = curr;
    next = upcoming;
    if (p <= rampStart) {
      t = 0;
    } else {
      t = smoothstep01((p - rampStart) / Math.max(0.0001, rampSpan));
    }
  } else {
    prev = ACT_KEYFRAMES[ACT_KEYFRAMES.length - 1];
    next = prev;
    t = 0;
  }

  const actId = findActAtTime(timeSec);
  const ov = MOTIF_OVERRIDES[motif];

  const baseBg = lerpVec3(prev.bgColor, next.bgColor, t);
  const baseBg2 = lerpVec3(prev.bgSecondary, next.bgSecondary, t);
  const baseAurora = lerpVec3(prev.auroraColor, next.auroraColor, t);
  const baseAccent = lerpVec3(prev.accentColor, next.accentColor, t);
  const baseKey = lerpVec3(prev.keyLightColor, next.keyLightColor, t);
  const baseRim = lerpVec3(prev.rimLightColor, next.rimLightColor, t);

  return {
    actId,
    motif,
    camPos: ov?.camPos ?? lerpVec3(prev.camPos, next.camPos, t),
    lookAt: ov?.lookAt ?? lerpVec3(prev.lookAt, next.lookAt, t),
    camRoll: lerp(prev.camRoll, next.camRoll, t),
    alignmentConvergence:
      ov?.alignmentConvergence ?? lerp(prev.alignmentConvergence, next.alignmentConvergence, t),
    syzygyLock: ov?.syzygyLock ?? lerp(prev.syzygyLock, next.syzygyLock, t),
    ringSpread: ov?.ringSpread ?? lerp(prev.ringSpread, next.ringSpread, t),
    astrolabeTilt: ov?.astrolabeTilt ?? lerpVec3(prev.astrolabeTilt, next.astrolabeTilt, t),
    coreIntensity: lerp(prev.coreIntensity, next.coreIntensity, t),
    particleSpread: lerp(prev.particleSpread, next.particleSpread, t),
    waveVisibility: ov?.waveVisibility ?? lerp(prev.waveVisibility, next.waveVisibility, t),
    tunnelVisibility:
      ov?.tunnelVisibility ?? lerp(prev.tunnelVisibility, next.tunnelVisibility, t),
    templeVisibility:
      ov?.templeVisibility ?? lerp(prev.templeVisibility, next.templeVisibility, t),
    helixVisibility: ov?.helixVisibility ?? lerp(prev.helixVisibility, next.helixVisibility, t),
    clockVisibility: ov?.clockVisibility ?? lerp(prev.clockVisibility, next.clockVisibility, t),
    archVisibility: ov?.archVisibility ?? lerp(prev.archVisibility, next.archVisibility, t),
    wingsVisibility: ov?.wingsVisibility ?? lerp(prev.wingsVisibility, next.wingsVisibility, t),
    discoVisibility: ov?.discoVisibility ?? lerp(prev.discoVisibility, next.discoVisibility, t),
    praiaVisibility: ov?.praiaVisibility ?? lerp(prev.praiaVisibility, next.praiaVisibility, t),
    madrugadaVisibility:
      ov?.madrugadaVisibility ?? lerp(prev.madrugadaVisibility, next.madrugadaVisibility, t),
    amorVisibility: ov?.amorVisibility ?? lerp(prev.amorVisibility, next.amorVisibility, t),
    salaVisibility: ov?.salaVisibility ?? lerp(prev.salaVisibility, next.salaVisibility, t),
    romaFireVisibility:
      ov?.romaFireVisibility ?? lerp(prev.romaFireVisibility, next.romaFireVisibility, t),
    emberIntensity: ov?.emberIntensity ?? lerp(prev.emberIntensity, next.emberIntensity, t),
    bgHex: rgbTupleToHex(ov?.bgColor ?? baseBg),
    bgSecondaryHex: rgbTupleToHex(ov?.bgSecondary ?? baseBg2),
    auroraHex: rgbTupleToHex(ov?.auroraColor ?? baseAurora),
    accentHex: rgbTupleToHex(ov?.accentColor ?? baseAccent),
    keyLightHex: rgbTupleToHex(ov?.keyLightColor ?? baseKey),
    rimLightHex: rgbTupleToHex(ov?.rimLightColor ?? baseRim),
  };
}

export function computeSceneStateAtProgress(progress: number): SceneVisualState {
  return computeSceneStateForCue(progress);
}

export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const rounded = Math.floor(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
