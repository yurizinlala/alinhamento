export type ActId =
  | 'intro'
  | 'estrofe-1'
  | 'pre-refrao-1'
  | 'refrao-1'
  | 'estrofe-2'
  | 'pre-refrao-2'
  | 'refrao-2'
  | 'ponte'
  | 'outro';

export type SemanticMotif =
  | 'intro'
  | 'sala'
  | 'amor'
  | 'anjos'
  | 'charme'
  | 'festa'
  | 'praia'
  | 'madrugada'
  | 'tempo'
  | 'hora-exata'
  | 'alinhamento'
  | 'atenas'
  | 'capela'
  | 'roma-fogo'
  | 'escolha'
  | 'vidas';

export type WordEntryAnim =
  | 'slam-drop'
  | 'whip-left'
  | 'whip-right'
  | 'rise-clip'
  | 'flip-3d-x'
  | 'rotate-swing'
  | 'letter-expand'
  | 'zoom-shatter'
  | 'outline-fill'
  | 'diagonal-slash'
  | 'pendulum-right'
  | 'elastic-bounce'
  | 'vertical-stretch'
  | 'orbital-arc'
  | 'glide-fade'
  | 'impact-flash';

export type WordTypographyVariant =
  | 'display-heavy'
  | 'serif-italic'
  | 'outline-stroke'
  | 'display-condensed'
  | 'accent-gold';

export interface WordTimingSpec {
  word: string;
  startSec: number;
  vocalEndSec?: number;
  motif?: SemanticMotif;
  emphasis?: boolean;
  italic?: boolean;
}

export interface PhraseSpec {
  id: string;
  actId: ActId;
  actTitle: string;
  startSec: number;
  endSec: number;
  defaultMotif: SemanticMotif;
  caption?: string;
  words: WordTimingSpec[];
}

export interface WordCue {
  id: string;
  phraseId: string;
  actId: ActId;
  actTitle: string;
  word: string;
  wordIndexInPhrase: number;
  totalWordsInPhrase: number;
  phraseText: string;
  startSec: number;
  vocalEndSec: number;
  endSec: number;
  entryAnim: WordEntryAnim;
  typography: WordTypographyVariant;
  isEmphasis: boolean;
  motif: SemanticMotif;
  caption?: string;
}

export interface SongAct {
  id: ActId;
  label: string;
  startSec: number;
  endSec: number;
  subtitle: string;
}

export const SONG_DURATION_SEC = 201.8;
export const SONG_BPM = 135;
export const DEFAULT_STUDIO_AUDIO_URL =
  '/assets/aistudio/J_o_-_Alinhamento_Milenar_31cc1621.mp3';

export const SONG_ACTS: SongAct[] = [
  { id: 'intro', label: 'Abertura', startSec: 0, endSec: 18.32, subtitle: 'Jão · SUPER (135 BPM)' },
  { id: 'estrofe-1', label: 'Estrofe I', startSec: 18.32, endSec: 32.86, subtitle: 'No meio da sala' },
  { id: 'pre-refrao-1', label: 'Pré-Refrão I', startSec: 32.86, endSec: 47.0, subtitle: 'Charme especial' },
  { id: 'refrao-1', label: 'Refrão I', startSec: 47.0, endSec: 89.66, subtitle: 'Alinhamento milenar' },
  { id: 'estrofe-2', label: 'Estrofe II', startSec: 89.66, endSec: 104.34, subtitle: 'Um quarto em Atenas' },
  { id: 'pre-refrao-2', label: 'Pré-Refrão II', startSec: 104.34, endSec: 118.34, subtitle: 'Os rolês na madrugada' },
  { id: 'refrao-2', label: 'Refrão II', startSec: 118.34, endSec: 153.0, subtitle: 'Mesmo plano, hora exata' },
  { id: 'ponte', label: 'Ponte', startSec: 153.0, endSec: 168.56, subtitle: 'Todas novas vidas' },
  { id: 'outro', label: 'Final', startSec: 168.56, endSec: 201.8, subtitle: 'Na hora exata' },
];

// Tempos exatos por palavra calibrados nos picos vocais do master anexado
export const PHRASE_SPECS: PhraseSpec[] = [
  {
    id: 'p-intro-1',
    actId: 'intro',
    actTitle: 'Abertura',
    startSec: 0,
    endSec: 18.32,
    defaultMotif: 'intro',
    caption: 'Jão · SUPER · 135 BPM',
    words: [
      { word: 'Alinhamento', startSec: 0, vocalEndSec: 3.1, emphasis: true },
      { word: 'Milenar', startSec: 3.1, vocalEndSec: 6.2, emphasis: true, motif: 'alinhamento' },
      { word: 'Jão', startSec: 6.2, vocalEndSec: 10.5, italic: true },
    ],
  },
  // ESTROFE I (18.32 - 32.86)
  {
    id: 'p-e1-1',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 18.32,
    endSec: 19.92,
    defaultMotif: 'sala',
    words: [
      { word: 'No', startSec: 18.32 },
      { word: 'meio', startSec: 18.56 },
      { word: 'da', startSec: 18.78 },
      { word: 'sala', startSec: 19.02, vocalEndSec: 19.72, emphasis: true },
    ],
  },
  {
    id: 'p-e1-2',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 19.92,
    endSec: 22.08,
    defaultMotif: 'sala',
    words: [
      { word: 'Me', startSec: 19.92 },
      { word: 'faltam', startSec: 20.22 },
      { word: 'as', startSec: 20.76 },
      { word: 'palavras', startSec: 21.0, vocalEndSec: 21.88, emphasis: true },
    ],
  },
  {
    id: 'p-e1-3',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 22.08,
    endSec: 23.94,
    defaultMotif: 'sala',
    words: [
      { word: 'Minha', startSec: 22.08 },
      { word: 'língua', startSec: 22.36 },
      { word: 'sempre', startSec: 22.78 },
      { word: 'enrola', startSec: 23.26, vocalEndSec: 23.82, emphasis: true },
    ],
  },
  {
    id: 'p-e1-4',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 23.94,
    endSec: 25.88,
    defaultMotif: 'amor',
    words: [
      { word: 'Pra', startSec: 23.94 },
      { word: 'dizer:', startSec: 24.14 },
      { word: 'te', startSec: 24.48, italic: true },
      { word: 'amo', startSec: 25.0, vocalEndSec: 25.72, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-e1-5',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 25.88,
    endSec: 27.68,
    defaultMotif: 'sala',
    words: [
      { word: 'Minha', startSec: 25.88 },
      { word: 'perna,', startSec: 26.1, emphasis: true },
      { word: 'sua', startSec: 26.58 },
      { word: 'barriga', startSec: 26.78, vocalEndSec: 27.54, emphasis: true },
    ],
  },
  {
    id: 'p-e1-6',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 27.68,
    endSec: 29.22,
    defaultMotif: 'amor',
    words: [
      { word: 'Amor', startSec: 27.68, emphasis: true, italic: true },
      { word: 'da', startSec: 27.92 },
      { word: 'minha', startSec: 28.12, italic: true },
      { word: 'vida', startSec: 28.84, vocalEndSec: 29.16, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-e1-7',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 29.22,
    endSec: 30.62,
    defaultMotif: 'sala',
    words: [
      { word: 'Em', startSec: 29.22 },
      { word: 'cima', startSec: 29.5 },
      { word: 'do', startSec: 29.74 },
      { word: 'meu', startSec: 29.94 },
      { word: 'colo', startSec: 30.2, vocalEndSec: 30.56, emphasis: true },
    ],
  },
  {
    id: 'p-e1-8',
    actId: 'estrofe-1',
    actTitle: 'Estrofe I',
    startSec: 30.62,
    endSec: 32.86,
    defaultMotif: 'anjos',
    words: [
      { word: 'Eu', startSec: 30.62 },
      { word: 'te', startSec: 31.05 },
      { word: 'mostro', startSec: 31.38 },
      { word: 'os', startSec: 31.82 },
      { word: 'anjos', startSec: 32.14, vocalEndSec: 32.78, emphasis: true, italic: true },
    ],
  },
  // PRÉ-REFRÃO I (32.86 - 47.00)
  {
    id: 'p-pr1-1',
    actId: 'pre-refrao-1',
    actTitle: 'Pré-Refrão I',
    startSec: 32.86,
    endSec: 36.56,
    defaultMotif: 'charme',
    words: [
      { word: 'A', startSec: 32.86 },
      { word: 'gente', startSec: 33.16 },
      { word: 'tem', startSec: 33.44 },
      { word: 'um', startSec: 33.98 },
      { word: 'charme', startSec: 34.56, emphasis: true },
      { word: 'especial', startSec: 35.0, vocalEndSec: 36.22, emphasis: true },
    ],
  },
  {
    id: 'p-pr1-2',
    actId: 'pre-refrao-1',
    actTitle: 'Pré-Refrão I',
    startSec: 36.56,
    endSec: 39.68,
    defaultMotif: 'charme',
    words: [
      { word: 'Todo', startSec: 36.56 },
      { word: 'mundo', startSec: 36.98 },
      { word: 'quer', startSec: 37.44 },
      { word: 'parar', startSec: 37.9, emphasis: true },
      { word: 'pra', startSec: 38.36 },
      { word: 'ver', startSec: 38.62, vocalEndSec: 39.42, emphasis: true },
    ],
  },
  {
    id: 'p-pr1-3',
    actId: 'pre-refrao-1',
    actTitle: 'Pré-Refrão I',
    startSec: 39.68,
    endSec: 43.7,
    defaultMotif: 'festa',
    words: [
      { word: 'Cada', startSec: 39.68, motif: 'festa' },
      { word: 'festa,', startSec: 40.08, emphasis: true, motif: 'festa' },
      { word: 'cada', startSec: 40.56, motif: 'praia' },
      { word: 'praia,', startSec: 41.0, emphasis: true, motif: 'praia' },
      { word: 'os', startSec: 41.9, motif: 'madrugada' },
      { word: 'rolês', startSec: 42.14, motif: 'madrugada' },
      { word: 'na', startSec: 42.58, motif: 'madrugada' },
      { word: 'madrugada', startSec: 42.76, vocalEndSec: 43.55, emphasis: true, motif: 'madrugada' },
    ],
  },
  {
    id: 'p-pr1-4',
    actId: 'pre-refrao-1',
    actTitle: 'Pré-Refrão I',
    startSec: 43.7,
    endSec: 47.0,
    defaultMotif: 'amor',
    words: [
      { word: 'A', startSec: 43.7 },
      { word: 'alma', startSec: 43.92, italic: true },
      { word: 'sempre', startSec: 44.58 },
      { word: 'sou', startSec: 45.18 },
      { word: 'eu', startSec: 45.46, emphasis: true },
      { word: 'e', startSec: 45.88 },
      { word: 'você', startSec: 46.34, vocalEndSec: 46.92, emphasis: true, italic: true },
    ],
  },
  // REFRÃO I (47.00 - 89.66)
  {
    id: 'p-r1-1',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 47.0,
    endSec: 50.56,
    defaultMotif: 'tempo',
    words: [
      { word: 'Tão', startSec: 47.0 },
      { word: 'estranho', startSec: 47.44, vocalEndSec: 50.1, emphasis: true },
    ],
  },
  {
    id: 'p-r1-2',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 50.56,
    endSec: 54.1,
    defaultMotif: 'tempo',
    words: [
      { word: 'Nós', startSec: 50.56 },
      { word: 'estamos', startSec: 51.0, vocalEndSec: 53.75, emphasis: true },
    ],
  },
  {
    id: 'p-r1-3',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 54.1,
    endSec: 61.16,
    defaultMotif: 'tempo',
    words: [
      { word: 'Vivos', startSec: 54.1, emphasis: true },
      { word: 'nesses', startSec: 54.8 },
      { word: 'mesmos', startSec: 55.24 },
      { word: 'dias,', startSec: 55.88, emphasis: true },
      { word: 'nesses', startSec: 56.58 },
      { word: 'mesmos', startSec: 57.0 },
      { word: 'anos', startSec: 57.66, vocalEndSec: 59.5, emphasis: true },
    ],
  },
  {
    id: 'p-r1-4',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 61.16,
    endSec: 64.78,
    defaultMotif: 'hora-exata',
    words: [
      { word: 'Mesmo', startSec: 61.16 },
      { word: 'plano', startSec: 61.58, vocalEndSec: 64.0, emphasis: true },
    ],
  },
  {
    id: 'p-r1-5',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 64.78,
    endSec: 68.34,
    defaultMotif: 'hora-exata',
    words: [
      { word: 'Hora', startSec: 64.78, emphasis: true },
      { word: 'exata', startSec: 65.22, vocalEndSec: 67.6, emphasis: true },
    ],
  },
  {
    id: 'p-r1-6',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 68.34,
    endSec: 71.88,
    defaultMotif: 'amor',
    words: [
      { word: 'Você', startSec: 68.34 },
      { word: 'me', startSec: 68.78 },
      { word: 'ama', startSec: 69.22, emphasis: true, italic: true },
      { word: 'e', startSec: 69.56 },
      { word: 'eu', startSec: 70.12 },
      { word: 'te', startSec: 70.78 },
      { word: 'amo', startSec: 71.0, vocalEndSec: 71.72, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-r1-7',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 71.88,
    endSec: 73.9,
    defaultMotif: 'alinhamento',
    caption: 'Convergência Orbital Completa',
    words: [
      { word: 'Alinhamento', startSec: 71.88, emphasis: true },
      { word: 'milenar', startSec: 73.1, vocalEndSec: 73.8, emphasis: true },
    ],
  },
  {
    id: 'p-r1-8',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 73.9,
    endSec: 80.58,
    defaultMotif: 'alinhamento',
    words: [
      { word: 'Você', startSec: 73.9, italic: true },
      { word: 'não', startSec: 74.32, italic: true },
      { word: 'acha?', startSec: 74.78, vocalEndSec: 76.9, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-r1-9',
    actId: 'refrao-1',
    actTitle: 'Refrão I',
    startSec: 80.58,
    endSec: 89.66,
    defaultMotif: 'alinhamento',
    words: [
      { word: 'Você', startSec: 80.58, italic: true },
      { word: 'não', startSec: 81.22, italic: true },
      { word: 'acha?', startSec: 81.66, vocalEndSec: 84.1, emphasis: true, italic: true },
    ],
  },
  // ESTROFE II (89.66 - 104.34)
  {
    id: 'p-e2-1',
    actId: 'estrofe-2',
    actTitle: 'Estrofe II',
    startSec: 89.66,
    endSec: 91.38,
    defaultMotif: 'atenas',
    words: [
      { word: 'Me', startSec: 89.66 },
      { word: 'perguntou,', startSec: 89.84 },
      { word: 'se', startSec: 90.34 },
      { word: 'lembra?', startSec: 90.56, vocalEndSec: 91.22, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-e2-2',
    actId: 'estrofe-2',
    actTitle: 'Estrofe II',
    startSec: 91.38,
    endSec: 93.46,
    defaultMotif: 'atenas',
    words: [
      { word: 'Um', startSec: 91.38 },
      { word: 'quarto', startSec: 91.88 },
      { word: 'em', startSec: 92.34 },
      { word: 'Atenas', startSec: 92.8, vocalEndSec: 93.36, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-e2-3',
    actId: 'estrofe-2',
    actTitle: 'Estrofe II',
    startSec: 93.46,
    endSec: 96.78,
    defaultMotif: 'capela',
    words: [
      { word: 'Correndo', startSec: 93.46 },
      { word: 'por', startSec: 94.1 },
      { word: 'palácios,', startSec: 94.34, emphasis: true },
      { word: 'pinturas', startSec: 95.24 },
      { word: 'obscenas', startSec: 95.9, vocalEndSec: 96.65, emphasis: true },
    ],
  },
  {
    id: 'p-e2-4',
    actId: 'estrofe-2',
    actTitle: 'Estrofe II',
    startSec: 96.78,
    endSec: 100.54,
    defaultMotif: 'capela',
    words: [
      { word: 'Em', startSec: 96.78 },
      { word: 'tetos', startSec: 97.0 },
      { word: 'de', startSec: 97.66 },
      { word: 'capelas,', startSec: 97.88, emphasis: true },
      { word: 'no', startSec: 98.56 },
      { word: 'céu', startSec: 98.76, emphasis: true, italic: true, motif: 'anjos' },
      { word: 'da', startSec: 99.22 },
      { word: 'minha', startSec: 99.44 },
      { word: 'boca', startSec: 99.9, vocalEndSec: 100.42, emphasis: true },
    ],
  },
  {
    id: 'p-e2-5',
    actId: 'estrofe-2',
    actTitle: 'Estrofe II',
    startSec: 100.54,
    endSec: 104.34,
    defaultMotif: 'roma-fogo',
    words: [
      { word: 'Na', startSec: 100.54, motif: 'anjos' },
      { word: 'cidade', startSec: 100.8, motif: 'anjos' },
      { word: 'dos', startSec: 101.44, motif: 'anjos' },
      { word: 'anjos,', startSec: 101.66, emphasis: true, motif: 'anjos' },
      { word: 'ou', startSec: 102.34, motif: 'roma-fogo' },
      { word: 'queimando', startSec: 103.0, emphasis: true, motif: 'roma-fogo' },
      { word: 'Roma', startSec: 103.66, vocalEndSec: 104.24, emphasis: true, motif: 'roma-fogo' },
    ],
  },
  // PRÉ-REFRÃO II (104.34 - 118.34)
  {
    id: 'p-pr2-1',
    actId: 'pre-refrao-2',
    actTitle: 'Pré-Refrão II',
    startSec: 104.34,
    endSec: 107.88,
    defaultMotif: 'charme',
    words: [
      { word: 'A', startSec: 104.34 },
      { word: 'gente', startSec: 104.6 },
      { word: 'tem', startSec: 104.9 },
      { word: 'um', startSec: 105.42 },
      { word: 'charme', startSec: 105.88, emphasis: true },
      { word: 'especial', startSec: 106.56, vocalEndSec: 107.68, emphasis: true },
    ],
  },
  {
    id: 'p-pr2-2',
    actId: 'pre-refrao-2',
    actTitle: 'Pré-Refrão II',
    startSec: 107.88,
    endSec: 111.18,
    defaultMotif: 'charme',
    words: [
      { word: 'Todo', startSec: 107.88 },
      { word: 'mundo', startSec: 108.34 },
      { word: 'quer', startSec: 108.82 },
      { word: 'parar', startSec: 109.22, emphasis: true },
      { word: 'pra', startSec: 109.68 },
      { word: 'ver', startSec: 110.04, vocalEndSec: 110.95, emphasis: true },
    ],
  },
  {
    id: 'p-pr2-3',
    actId: 'pre-refrao-2',
    actTitle: 'Pré-Refrão II',
    startSec: 111.18,
    endSec: 115.04,
    defaultMotif: 'festa',
    words: [
      { word: 'Cada', startSec: 111.18, motif: 'festa' },
      { word: 'festa,', startSec: 111.68, emphasis: true, motif: 'festa' },
      { word: 'cada', startSec: 112.12, motif: 'praia' },
      { word: 'praia,', startSec: 112.6, emphasis: true, motif: 'praia' },
      { word: 'os', startSec: 113.22, motif: 'madrugada' },
      { word: 'rolês', startSec: 113.46, motif: 'madrugada' },
      { word: 'na', startSec: 113.88, motif: 'madrugada' },
      { word: 'madrugada', startSec: 114.12, vocalEndSec: 114.95, emphasis: true, motif: 'madrugada' },
    ],
  },
  {
    id: 'p-pr2-4',
    actId: 'pre-refrao-2',
    actTitle: 'Pré-Refrão II',
    startSec: 115.04,
    endSec: 118.34,
    defaultMotif: 'amor',
    words: [
      { word: 'A', startSec: 115.04 },
      { word: 'alma', startSec: 115.38, italic: true },
      { word: 'sempre', startSec: 116.1 },
      { word: 'sou', startSec: 116.6 },
      { word: 'eu', startSec: 117.0, emphasis: true },
      { word: 'e', startSec: 117.66 },
      { word: 'você', startSec: 117.88, vocalEndSec: 118.28, emphasis: true, italic: true },
    ],
  },
  // REFRÃO II (118.34 - 153.00)
  {
    id: 'p-r2-1',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 118.34,
    endSec: 121.66,
    defaultMotif: 'tempo',
    words: [
      { word: 'Tão', startSec: 118.34 },
      { word: 'estranho', startSec: 118.78, vocalEndSec: 121.3, emphasis: true },
    ],
  },
  {
    id: 'p-r2-2',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 121.66,
    endSec: 125.22,
    defaultMotif: 'tempo',
    words: [
      { word: 'Nós', startSec: 121.66 },
      { word: 'estamos', startSec: 122.1, vocalEndSec: 124.85, emphasis: true },
    ],
  },
  {
    id: 'p-r2-3',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 125.22,
    endSec: 132.1,
    defaultMotif: 'tempo',
    words: [
      { word: 'Vivos', startSec: 125.22, emphasis: true },
      { word: 'nesses', startSec: 125.88 },
      { word: 'mesmos', startSec: 126.34 },
      { word: 'dias,', startSec: 127.0, emphasis: true },
      { word: 'nesses', startSec: 127.88 },
      { word: 'mesmos', startSec: 128.36 },
      { word: 'anos', startSec: 128.98, vocalEndSec: 131.0, emphasis: true },
    ],
  },
  {
    id: 'p-r2-4',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 132.1,
    endSec: 135.44,
    defaultMotif: 'hora-exata',
    words: [
      { word: 'Mesmo', startSec: 132.1 },
      { word: 'plano', startSec: 132.56, vocalEndSec: 135.1, emphasis: true },
    ],
  },
  {
    id: 'p-r2-5',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 135.44,
    endSec: 139.0,
    defaultMotif: 'hora-exata',
    words: [
      { word: 'Hora', startSec: 135.44, emphasis: true },
      { word: 'exata', startSec: 136.1, vocalEndSec: 138.6, emphasis: true },
    ],
  },
  {
    id: 'p-r2-6',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 139.0,
    endSec: 143.0,
    defaultMotif: 'amor',
    words: [
      { word: 'Você', startSec: 139.0 },
      { word: 'me', startSec: 139.68 },
      { word: 'ama', startSec: 140.12, emphasis: true, italic: true },
      { word: 'e', startSec: 140.62 },
      { word: 'eu', startSec: 141.22 },
      { word: 'te', startSec: 141.88 },
      { word: 'amo', startSec: 142.15, vocalEndSec: 142.85, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-r2-7',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 143.0,
    endSec: 145.46,
    defaultMotif: 'alinhamento',
    words: [
      { word: 'Alinhamento', startSec: 143.0, emphasis: true },
      { word: 'milenar', startSec: 144.2, vocalEndSec: 145.35, emphasis: true },
    ],
  },
  {
    id: 'p-r2-8',
    actId: 'refrao-2',
    actTitle: 'Refrão II',
    startSec: 145.46,
    endSec: 153.0,
    defaultMotif: 'alinhamento',
    words: [
      { word: 'Você', startSec: 145.46, italic: true },
      { word: 'não', startSec: 145.9, italic: true },
      { word: 'acha?', startSec: 146.56, vocalEndSec: 149.2, emphasis: true, italic: true },
    ],
  },
  // PONTE (153.00 - 168.56)
  {
    id: 'p-p-1',
    actId: 'ponte',
    actTitle: 'Ponte',
    startSec: 153.0,
    endSec: 158.1,
    defaultMotif: 'escolha',
    words: [
      { word: 'E', startSec: 153.0 },
      { word: 'de', startSec: 153.28 },
      { word: 'todos', startSec: 153.62 },
      { word: 'os', startSec: 154.1 },
      { word: 'meninos', startSec: 154.36, emphasis: true },
      { word: 'e', startSec: 155.02 },
      { word: 'meninas', startSec: 155.44, emphasis: true },
      { word: 'que', startSec: 156.12 },
      { word: 'eu', startSec: 156.32 },
      { word: 'já', startSec: 156.9 },
      { word: 'amei', startSec: 157.52, vocalEndSec: 158.02, emphasis: true, italic: true, motif: 'amor' },
    ],
  },
  {
    id: 'p-p-2',
    actId: 'ponte',
    actTitle: 'Ponte',
    startSec: 158.1,
    endSec: 160.78,
    defaultMotif: 'escolha',
    words: [
      { word: 'Eu', startSec: 158.1 },
      { word: 'escolhi', startSec: 158.32, emphasis: true },
      { word: 'você', startSec: 159.22, vocalEndSec: 160.52, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-p-3',
    actId: 'ponte',
    actTitle: 'Ponte',
    startSec: 160.78,
    endSec: 165.88,
    defaultMotif: 'vidas',
    words: [
      { word: 'E', startSec: 160.78 },
      { word: 'em', startSec: 161.22 },
      { word: 'todas', startSec: 161.46 },
      { word: 'novas', startSec: 161.92, emphasis: true },
      { word: 'vidas', startSec: 162.32, emphasis: true, italic: true },
      { word: 'que', startSec: 162.78 },
      { word: 'eu', startSec: 163.32 },
      { word: 'ainda', startSec: 163.66 },
      { word: 'for', startSec: 164.6 },
      { word: 'viver', startSec: 165.22, vocalEndSec: 165.76, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-p-4',
    actId: 'ponte',
    actTitle: 'Ponte',
    startSec: 165.88,
    endSec: 168.56,
    defaultMotif: 'escolha',
    words: [
      { word: 'Eu', startSec: 165.88 },
      { word: 'vou', startSec: 166.1 },
      { word: 'te', startSec: 166.58 },
      { word: 'escolher', startSec: 166.78, vocalEndSec: 168.35, emphasis: true, italic: true },
    ],
  },
  // FINAL / OUTRO (168.56 - 201.80)
  {
    id: 'p-o-1',
    actId: 'outro',
    actTitle: 'Final',
    startSec: 168.56,
    endSec: 173.44,
    defaultMotif: 'vidas',
    words: [{ word: 'Uh-uh-uh', startSec: 168.56, vocalEndSec: 172.6, italic: true }],
  },
  {
    id: 'p-o-2',
    actId: 'outro',
    actTitle: 'Final',
    startSec: 173.44,
    endSec: 176.9,
    defaultMotif: 'hora-exata',
    words: [
      { word: 'Na', startSec: 173.44 },
      { word: 'hora', startSec: 173.88, emphasis: true },
      { word: 'exata', startSec: 174.62, vocalEndSec: 176.5, emphasis: true },
    ],
  },
  {
    id: 'p-o-3',
    actId: 'outro',
    actTitle: 'Final',
    startSec: 176.9,
    endSec: 180.56,
    defaultMotif: 'vidas',
    words: [{ word: 'Uh-uh-uh', startSec: 176.9, vocalEndSec: 180.0, italic: true }],
  },
  {
    id: 'p-o-4',
    actId: 'outro',
    actTitle: 'Final',
    startSec: 180.56,
    endSec: 184.32,
    defaultMotif: 'alinhamento',
    words: [
      { word: 'Você', startSec: 180.56 },
      { word: 'não', startSec: 181.22 },
      { word: 'acha?', startSec: 182.14, vocalEndSec: 183.9, emphasis: true },
    ],
  },
  {
    id: 'p-o-5',
    actId: 'outro',
    actTitle: 'Final',
    startSec: 184.32,
    endSec: 191.26,
    defaultMotif: 'alinhamento',
    caption: 'Sinfonia Final',
    words: [
      { word: 'Alinhamento', startSec: 184.32, emphasis: true },
      { word: 'milenar', startSec: 186.2, vocalEndSec: 189.1, emphasis: true },
    ],
  },
  {
    id: 'p-o-6',
    actId: 'outro',
    actTitle: 'Final',
    startSec: 191.26,
    endSec: 194.52,
    defaultMotif: 'alinhamento',
    words: [
      { word: 'Você', startSec: 191.26, italic: true },
      { word: 'não', startSec: 191.88, italic: true },
      { word: 'acha?', startSec: 192.78, vocalEndSec: 194.2, emphasis: true, italic: true },
    ],
  },
  {
    id: 'p-o-7',
    actId: 'outro',
    actTitle: 'Final',
    startSec: 194.52,
    endSec: SONG_DURATION_SEC,
    defaultMotif: 'alinhamento',
    caption: 'Jão · SUPER · Alinhamento Milenar',
    words: [
      { word: 'Você', startSec: 194.52, italic: true },
      { word: 'não', startSec: 195.14, italic: true },
      { word: 'acha?', startSec: 195.64, vocalEndSec: 199.4, emphasis: true, italic: true },
    ],
  },
];

const ENTRY_ANIM_POOL: WordEntryAnim[] = [
  'slam-drop',
  'whip-left',
  'rise-clip',
  'flip-3d-x',
  'whip-right',
  'rotate-swing',
  'letter-expand',
  'zoom-shatter',
  'outline-fill',
  'diagonal-slash',
  'pendulum-right',
  'elastic-bounce',
  'vertical-stretch',
  'orbital-arc',
  'glide-fade',
  'impact-flash',
];

function chooseWordAnimation(
  word: string,
  globalIdx: number,
  isEmphasis: boolean,
  prevAnim: WordEntryAnim | null
): WordEntryAnim {
  const lower = word.toLowerCase();
  if (lower.includes('alinhamento') || lower.includes('milenar') || lower === 'escolhi') {
    if (prevAnim !== 'impact-flash') return 'impact-flash';
  }
  if (lower.includes('roma') || lower.includes('queimando')) {
    if (prevAnim !== 'slam-drop') return 'slam-drop';
  }
  if (lower.includes('atenas') || lower.includes('palácios')) {
    if (prevAnim !== 'flip-3d-x') return 'flip-3d-x';
  }
  if (lower.includes('enrola') || lower.includes('festa')) {
    if (prevAnim !== 'rotate-swing') return 'rotate-swing';
  }
  if (isEmphasis && prevAnim !== 'zoom-shatter' && globalIdx % 2 === 0) {
    return 'zoom-shatter';
  }

  let candidate = ENTRY_ANIM_POOL[(globalIdx * 5 + word.length * 3) % ENTRY_ANIM_POOL.length];
  if (candidate === prevAnim) {
    candidate = ENTRY_ANIM_POOL[(globalIdx + 1) % ENTRY_ANIM_POOL.length];
  }
  return candidate;
}

function chooseTypographyVariant(
  word: string,
  globalIdx: number,
  isEmphasis: boolean,
  isItalic: boolean
): WordTypographyVariant {
  if (isItalic) return 'serif-italic';
  if (isEmphasis) return 'accent-gold';
  const mod = (globalIdx + word.length) % 4;
  if (mod === 0) return 'display-heavy';
  if (mod === 1) return 'outline-stroke';
  if (mod === 2) return 'display-condensed';
  return 'display-heavy';
}

export const WORD_CUES: WordCue[] = (() => {
  const cues: WordCue[] = [];
  let globalIdx = 0;
  let prevAnim: WordEntryAnim | null = null;

  for (const phrase of PHRASE_SPECS) {
    const phraseText = phrase.words.map((w) => w.word).join(' ');
    for (let i = 0; i < phrase.words.length; i++) {
      const spec = phrase.words[i];
      const nextWordStart =
        i < phrase.words.length - 1 ? phrase.words[i + 1].startSec : phrase.endSec;

      const startSec = spec.startSec;
      const endSec = nextWordStart;
      const vocalEndSec = Math.min(endSec, spec.vocalEndSec ?? endSec);

      const entryAnim = chooseWordAnimation(
        spec.word,
        globalIdx,
        Boolean(spec.emphasis),
        prevAnim
      );
      prevAnim = entryAnim;

      const typography = chooseTypographyVariant(
        spec.word,
        globalIdx,
        Boolean(spec.emphasis),
        Boolean(spec.italic)
      );

      cues.push({
        id: `${phrase.id}-w${i}`,
        phraseId: phrase.id,
        actId: phrase.actId,
        actTitle: phrase.actTitle,
        word: spec.word,
        wordIndexInPhrase: i,
        totalWordsInPhrase: phrase.words.length,
        phraseText,
        startSec,
        vocalEndSec,
        endSec,
        entryAnim,
        typography,
        isEmphasis: Boolean(spec.emphasis),
        motif: spec.motif ?? phrase.defaultMotif,
        caption: phrase.caption,
      });
      globalIdx++;
    }
  }

  return cues;
})();
