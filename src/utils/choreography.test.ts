import test from 'node:test';
import assert from 'node:assert/strict';
import { PHRASE_SPECS, SONG_ACTS, SONG_DURATION_SEC, WORD_CUES } from '../data/lyrics';
import {
  computeSceneStateAtProgress,
  computeSceneStateForCue,
  findActAtTime,
  findWordIndexAtTime,
  formatTimecode,
  progressToTime,
  timeToProgress,
} from './choreography';

test('word cues are strictly sequential, validate vocalEndSec exit bounds, and vary consecutive animations', () => {
  assert.ok(WORD_CUES.length > 150, 'Expected full word-by-word cue array');
  assert.equal(WORD_CUES[0].startSec, 0);
  assert.equal(WORD_CUES[WORD_CUES.length - 1].endSec, SONG_DURATION_SEC);

  let restCount = 0;
  for (let i = 0; i < WORD_CUES.length; i++) {
    const cue = WORD_CUES[i];
    assert.ok(cue.startSec < cue.endSec, `Word cue ${cue.id} start must be < end`);
    assert.ok(
      cue.startSec < cue.vocalEndSec && cue.vocalEndSec <= cue.endSec,
      `Word cue ${cue.id} vocalEndSec (${cue.vocalEndSec}) must be within (startSec=${cue.startSec}, endSec=${cue.endSec}]`
    );
    if (cue.vocalEndSec < cue.endSec - 0.05) {
      restCount++;
    }
    assert.ok(cue.word.length > 0);
    if (i > 0) {
      assert.ok(
        Math.abs(cue.startSec - WORD_CUES[i - 1].endSec) < 0.01,
        `Word cue ${cue.id} should follow previous cue continuously`
      );
      assert.notEqual(
        cue.entryAnim,
        WORD_CUES[i - 1].entryAnim,
        `Consecutive words (${WORD_CUES[i - 1].word} -> ${cue.word}) must use distinct entry animations`
      );
    }
  }

  assert.ok(restCount >= 10, `Expected instrumental/vocal rest exit cues, found ${restCount}`);
});

test('phrase specs and song acts cover entire 03:21 studio song seamlessly', () => {
  assert.equal(SONG_ACTS[0].startSec, 0);
  assert.equal(SONG_ACTS[SONG_ACTS.length - 1].endSec, SONG_DURATION_SEC);
  assert.equal(PHRASE_SPECS[0].startSec, 0);
  assert.equal(PHRASE_SPECS[PHRASE_SPECS.length - 1].endSec, SONG_DURATION_SEC);

  for (let i = 1; i < SONG_ACTS.length; i++) {
    assert.equal(SONG_ACTS[i].startSec, SONG_ACTS[i - 1].endSec);
  }
  for (let i = 1; i < PHRASE_SPECS.length; i++) {
    assert.ok(
      Math.abs(PHRASE_SPECS[i].startSec - PHRASE_SPECS[i - 1].endSec) < 0.01,
      `Phrase ${PHRASE_SPECS[i].id} must align seamlessly after ${PHRASE_SPECS[i - 1].id}`
    );
  }
});

test('findWordIndexAtTime and findActAtTime resolve exact studio timestamps', () => {
  assert.equal(findWordIndexAtTime(0), 0);
  assert.equal(findActAtTime(0), 'intro');
  assert.equal(findActAtTime(19), 'estrofe-1');
  assert.equal(findActAtTime(55), 'refrao-1');
  assert.equal(findActAtTime(92), 'estrofe-2');
  assert.equal(findActAtTime(155), 'ponte');
  assert.equal(findActAtTime(201.0), 'outro');
  assert.equal(findWordIndexAtTime(SONG_DURATION_SEC), WORD_CUES.length - 1);
});

test('progressToTime and timeToProgress round-trip cleanly', () => {
  assert.equal(timeToProgress(0), 0);
  assert.equal(timeToProgress(SONG_DURATION_SEC), 1);
  assert.equal(progressToTime(0.5), SONG_DURATION_SEC / 2);
  assert.ok(Math.abs(timeToProgress(progressToTime(0.42)) - 0.42) < 1e-12);
});

test('computeSceneStateForCue transforms backgrounds and 3D worlds per SemanticMotif', () => {
  const sala = computeSceneStateForCue(23.5 / SONG_DURATION_SEC, 'sala');
  assert.equal(sala.salaVisibility, 1);

  const amor = computeSceneStateForCue(27.5 / SONG_DURATION_SEC, 'amor');
  assert.equal(amor.amorVisibility, 1);

  const anjos = computeSceneStateForCue(32.25 / SONG_DURATION_SEC, 'anjos');
  assert.equal(anjos.wingsVisibility, 1);

  const festa = computeSceneStateForCue(40.1 / SONG_DURATION_SEC, 'festa');
  assert.equal(festa.discoVisibility, 1);

  const praia = computeSceneStateForCue(41.1 / SONG_DURATION_SEC, 'praia');
  assert.equal(praia.motif, 'praia');
  assert.equal(praia.praiaVisibility, 1);
  assert.equal(praia.waveVisibility, 1);
  assert.equal(praia.emberIntensity, 0.05);

  const madrugada = computeSceneStateForCue(42.8 / SONG_DURATION_SEC, 'madrugada');
  assert.equal(madrugada.madrugadaVisibility, 1);

  const alinhamento = computeSceneStateForCue(72.2 / SONG_DURATION_SEC, 'alinhamento');
  assert.equal(alinhamento.syzygyLock, 1);
  assert.equal(alinhamento.alignmentConvergence, 1);
  assert.ok(alinhamento.camPos[2] <= 4.0, 'Camera should zoom close to the aligned planets');

  const romaFogo = computeSceneStateForCue(103.5 / SONG_DURATION_SEC, 'roma-fogo');
  assert.equal(romaFogo.motif, 'roma-fogo');
  assert.equal(romaFogo.templeVisibility, 1);
  assert.equal(romaFogo.romaFireVisibility, 1);
  assert.equal(romaFogo.emberIntensity, 1);
  assert.notEqual(praia.bgHex, romaFogo.bgHex);

  const horaExata = computeSceneStateForCue(65.5 / SONG_DURATION_SEC, 'hora-exata');
  assert.equal(horaExata.clockVisibility, 1);

  const capela = computeSceneStateForCue(98.5 / SONG_DURATION_SEC, 'capela');
  assert.equal(capela.archVisibility, 1);

  const bridgeStart = computeSceneStateAtProgress(153.1 / SONG_DURATION_SEC);
  assert.equal(bridgeStart.actId, 'ponte');
  assert.equal(bridgeStart.helixVisibility, 1);
});

test('formatTimecode formats 03:21 and edge cases', () => {
  assert.equal(formatTimecode(0), '00:00');
  assert.equal(formatTimecode(201.8), '03:21');
  assert.equal(formatTimecode(-4), '00:00');
});
