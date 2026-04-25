// Generates 4 WAV sound effects using only Node.js built-ins.
// Usage: node scripts/generateSounds.js

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

// ── WAV writer ────────────────────────────────────────────────────────────────

function writeWav(samples, filePath) {
  const numSamples = samples.length;
  const dataBytes = numSamples * 2; // 16-bit = 2 bytes per sample
  const buf = Buffer.alloc(44 + dataBytes);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);        // PCM chunk size
  buf.writeUInt16LE(1, 20);         // PCM format
  buf.writeUInt16LE(1, 22);         // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);         // block align
  buf.writeUInt16LE(16, 34);        // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buf);
}

// ── Signal generators ─────────────────────────────────────────────────────────

function sine(freq, durationMs, amplitude) {
  const n = Math.floor(SAMPLE_RATE * durationMs / 1000);
  const s = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    s[i] = amplitude * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
  }
  return s;
}

// ADSR envelope (all in ms; sustainLevel 0-1)
function adsr(s, attackMs, decayMs, sustainLevel, releaseMs) {
  const n = s.length;
  const aN = Math.floor(SAMPLE_RATE * attackMs / 1000);
  const dN = Math.floor(SAMPLE_RATE * decayMs / 1000);
  const rN = Math.floor(SAMPLE_RATE * releaseMs / 1000);
  const susN = Math.max(0, n - aN - dN - rN);

  for (let i = 0; i < n; i++) {
    let env;
    if (i < aN) {
      env = aN > 0 ? i / aN : 1;
    } else if (i < aN + dN) {
      const t = (i - aN) / Math.max(1, dN);
      env = 1 - t * (1 - sustainLevel);
    } else if (i < aN + dN + susN) {
      env = sustainLevel;
    } else {
      const t = (i - aN - dN - susN) / Math.max(1, rN);
      env = sustainLevel * (1 - t);
    }
    s[i] *= env;
  }
  return s;
}

// Mix multiple tracks into one Float64Array, then peak-normalize
function mix(tracks) {
  const maxLen = Math.max(...tracks.map(t => t.length));
  const out = new Float64Array(maxLen);
  for (const t of tracks) {
    for (let i = 0; i < t.length; i++) out[i] += t[i];
  }
  let peak = 0;
  for (let i = 0; i < out.length; i++) {
    if (Math.abs(out[i]) > peak) peak = Math.abs(out[i]);
  }
  if (peak > 0) {
    for (let i = 0; i < out.length; i++) out[i] = out[i] / peak * 0.88;
  }
  return out;
}

// Pad samples to targetLen by prepending `offsetSamples` zeros
function pad(s, totalLen, offsetSamples) {
  const out = new Float64Array(totalLen);
  const start = Math.min(offsetSamples, totalLen);
  const copy = Math.min(s.length, totalLen - start);
  for (let i = 0; i < copy; i++) out[start + i] = s[i];
  return out;
}

// ── Output directory ──────────────────────────────────────────────────────────

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── 1. hit.wav — 100ms positive tick (880 Hz, sharp attack) ──────────────────
{
  const s = sine(880, 100, 0.7);
  adsr(s, 2, 88, 0, 10);
  writeWav(s, path.join(outDir, 'hit.wav'));
  console.log('✓ hit.wav');
}

// ── 2. miss.wav — 150ms negative buzz (200 Hz + 270 Hz dissonant) ─────────────
{
  const s1 = sine(200, 150, 0.5);
  const s2 = sine(270, 150, 0.3);
  adsr(s1, 4, 100, 0.1, 46);
  adsr(s2, 4, 100, 0.1, 46);
  const s = mix([s1, s2]);
  writeWav(s, path.join(outDir, 'miss.wav'));
  console.log('✓ miss.wav');
}

// ── 3. record.wav — 600ms ascending arpeggio C5 E5 G5 C6 ────────────────────
{
  const total = Math.floor(SAMPLE_RATE * 600 / 1000);
  const noteFreqs = [523, 659, 784, 1047]; // C5 E5 G5 C6
  const noteMs = 140;
  const stepMs = 120; // onset spacing
  const tracks = noteFreqs.map((freq, i) => {
    const s = sine(freq, noteMs, 0.45);
    adsr(s, 5, 60, 0.2, 75);
    return pad(s, total, Math.floor(SAMPLE_RATE * (i * stepMs) / 1000));
  });
  writeWav(mix(tracks), path.join(outDir, 'record.wav'));
  console.log('✓ record.wav');
}

// ── 4. milestone.wav — 800ms major chord C5+E5+G5 with shimmer C6 ────────────
{
  const total = Math.floor(SAMPLE_RATE * 800 / 1000);
  const chordFreqs = [523, 659, 784];
  const chordTracks = chordFreqs.map(freq => {
    const s = sine(freq, 800, 0.3);
    adsr(s, 12, 200, 0.55, 200);
    return s;
  });
  // Shimmer note enters at 280ms
  const shimmer = sine(1047, 500, 0.25);
  adsr(shimmer, 8, 180, 0.3, 200);
  const shimmerPadded = pad(shimmer, total, Math.floor(SAMPLE_RATE * 0.28));
  writeWav(mix([...chordTracks, shimmerPadded]), path.join(outDir, 'milestone.wav'));
  console.log('✓ milestone.wav');
}

console.log('\nAll sounds generated in assets/sounds/');
