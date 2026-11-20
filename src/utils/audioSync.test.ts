import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzePcmEnvelope,
  buildSyncProfile,
  mapAudioTimeToLyricTime,
  mapLyricTimeToAudioTime,
} from './audioSync';
import { SONG_DURATION_SEC } from '../data/lyrics';

test('analyzePcmEnvelope detects leading silence and intro groove drop accurately', () => {
  const sampleRate = 8000;
  const totalSec = 20;
  const samples = new Float32Array(sampleRate * totalSec);

  // 0..1.5s pure silence
  // 1.5..5.75s soft intro (-24dB -> amp 0.08)
  for (let i = Math.floor(1.5 * sampleRate); i < Math.floor(5.75 * sampleRate); i++) {
    samples[i] = 0.08 * Math.sin(i * 0.1);
  }
  // 5.75..20s full groove drop (amp 0.75)
  for (let i = Math.floor(5.75 * sampleRate); i < samples.length; i++) {
    samples[i] = 0.75 * Math.sin(i * 0.1);
  }

  const analysis = analyzePcmEnvelope(samples, sampleRate, 40);
  assert.ok(Math.abs(analysis.durationSec - 20) < 0.05);
  assert.ok(
    analysis.leadingSilenceSec >= 1.4 && analysis.leadingSilenceSec <= 1.65,
    `Expected ~1.5s leading silence, got ${analysis.leadingSilenceSec}`
  );
  assert.ok(
    analysis.grooveDropSec >= 5.65 && analysis.grooveDropSec <= 5.9,
    `Expected ~5.75s groove drop, got ${analysis.grooveDropSec}`
  );
  assert.equal(analysis.waveformPeaks.length, 40);
});

test('buildSyncProfile trims leading silence and preserves round-trip mapping', () => {
  // Simulate studio track with 1.5s extra silence at the beginning
  const profile = buildSyncProfile(SONG_DURATION_SEC + 1.5, 1.5, 5.75);
  assert.equal(profile.timeScale, 1);

  // At audio t=20.0s (which corresponds to 18.5s in the studio master -> Estrofe I), lyric time should be ~18.5s
  const lyricAt20 = mapAudioTimeToLyricTime(20.0, profile, 0);
  assert.ok(Math.abs(lyricAt20 - 18.5) < 0.05, `Expected ~18.5s, got ${lyricAt20}`);

  const backToAudio = mapLyricTimeToAudioTime(18.5, profile, 0);
  assert.ok(Math.abs(backToAudio - 20.0) < 0.05, `Expected ~20.0s, got ${backToAudio}`);
});

test('buildSyncProfile scales proportionally for shorter/edited uploads', () => {
  const halfDuration = SONG_DURATION_SEC / 2;
  const profile = buildSyncProfile(halfDuration, 0, 2.12);
  assert.ok(profile.timeScale > 1.9 && profile.timeScale < 2.1);

  const midpointLyric = mapAudioTimeToLyricTime(halfDuration / 2, profile, 0);
  assert.ok(Math.abs(midpointLyric - SONG_DURATION_SEC / 2) < 1.5);
});
