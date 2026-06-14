// ─── SkyeTunezLab Audio Engine ─────────────────────────────────────────────
// Plays back MIDI patterns using Web Audio API with house-style synth sounds

let ctx = null;
let isPlaying = false;
let stopFns = [];

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ─── Midi note → frequency ──────────────────────────────────────────────────
function midiToHz(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// ─── Master bus with subtle compression ────────────────────────────────────
function getMaster(ctx) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 10;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.15;
  const gain = ctx.createGain();
  gain.gain.value = 0.72;
  comp.connect(gain);
  gain.connect(ctx.destination);
  return comp;
}

// ─── Synth sounds ──────────────────────────────────────────────────────────

function playKick(ctx, master, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(master);
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
  gain.gain.setValueAtTime(1.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
  osc.start(time); osc.stop(time + 0.35);
}

function playSnare(ctx, master, time) {
  // noise burst
  const bufLen = ctx.sampleRate * 0.12;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass"; filter.frequency.value = 1800;
  const gain = ctx.createGain();
  noise.connect(filter); filter.connect(gain); gain.connect(master);
  gain.gain.setValueAtTime(0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  noise.start(time); noise.stop(time + 0.12);

  // body tone
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.connect(og); og.connect(master);
  osc.frequency.value = 180;
  og.gain.setValueAtTime(0.5, time);
  og.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.start(time); osc.stop(time + 0.08);
}

function playHat(ctx, master, time, open = false) {
  const bufLen = ctx.sampleRate * (open ? 0.28 : 0.04);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass"; filter.frequency.value = 7000;
  const gain = ctx.createGain();
  noise.connect(filter); filter.connect(gain); gain.connect(master);
  gain.gain.setValueAtTime(open ? 0.3 : 0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.28 : 0.04));
  noise.start(time); noise.stop(time + (open ? 0.3 : 0.06));
}

function playBass(ctx, master, time, freq, dur) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, time);
  filter.frequency.exponentialRampToValueAtTime(200, time + dur * 0.6);
  osc.type = "sawtooth"; osc.frequency.value = freq;
  osc2.type = "square";  osc2.frequency.value = freq;
  const g2 = ctx.createGain(); g2.gain.value = 0.3;
  osc.connect(filter); osc2.connect(g2); g2.connect(filter);
  filter.connect(gain); gain.connect(master);
  gain.gain.setValueAtTime(0.0, time);
  gain.gain.linearRampToValueAtTime(0.55, time + 0.008);
  gain.gain.setValueAtTime(0.55, time + dur - 0.04);
  gain.gain.linearRampToValueAtTime(0.0, time + dur);
  osc.start(time); osc.stop(time + dur);
  osc2.start(time); osc2.stop(time + dur);
}

function playChord(ctx, master, time, freqs, dur) {
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 2400;
    osc.type = "sawtooth"; osc.frequency.value = freq;
    osc.connect(filter); filter.connect(gain); gain.connect(master);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.015);
    gain.gain.setValueAtTime(0.18, time + dur - 0.05);
    gain.gain.linearRampToValueAtTime(0, time + dur);
    osc.start(time); osc.stop(time + dur + 0.05);
  });
}

function playLead(ctx, master, time, freq, dur) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass"; filter.frequency.value = freq * 2; filter.Q.value = 1.5;
  osc.type = "sawtooth";  osc.frequency.value = freq;
  osc2.type = "sawtooth"; osc2.frequency.value = freq * 1.005; // slight detune
  const g2 = ctx.createGain(); g2.gain.value = 0.5;
  osc.connect(filter); osc2.connect(g2); g2.connect(filter);
  filter.connect(gain); gain.connect(master);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.22, time + 0.01);
  gain.gain.setValueAtTime(0.22, time + dur - 0.02);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.start(time); osc.stop(time + dur + 0.02);
  osc2.start(time); osc2.stop(time + dur + 0.02);
}

// ─── Main playback scheduler ────────────────────────────────────────────────

export function playPreview(midiTracks, bpm, onStop) {
  if (isPlaying) stopPreview();

  const ctx = getCtx();
  const master = getMaster(ctx);
  const secPerBeat = 60 / bpm;
  const secPerTick = secPerBeat / 480;
  const now = ctx.currentTime + 0.05;

  isPlaying = true;
  stopFns = [];

  // Find total length
  let maxTick = 0;
  for (const track of midiTracks) {
    for (const ev of track.events) {
      if (ev.tick > maxTick) maxTick = ev.tick;
    }
  }
  const totalSec = maxTick * secPerTick + 0.5;

  // Schedule all events
  for (const track of midiTracks) {
    const { name, events } = track;
    const isDrum = name === "Kick" || name === "Snare" || name === "HiHat";

    // Group note_on/note_off into { note, startTick, dur }
    if (isDrum) {
      for (const ev of events) {
        if (ev.type !== "on") continue;
        const t = now + ev.tick * secPerTick;
        if (name === "Kick")  playKick(ctx, master, t);
        if (name === "Snare") playSnare(ctx, master, t);
        if (name === "HiHat") playHat(ctx, master, t, ev.note === 46);
      }
    } else {
      // Pair on/off
      const pending = {};
      const sorted = [...events].sort((a, b) => a.tick - b.tick);
      for (const ev of sorted) {
        if (ev.type === "on") {
          pending[ev.note] = ev.tick;
        } else if (ev.type === "off" && pending[ev.note] !== undefined) {
          const startTick = pending[ev.note];
          const durSec = Math.max(0.05, (ev.tick - startTick) * secPerTick);
          const t = now + startTick * secPerTick;
          const freq = midiToHz(ev.note);

          if (name === "Bassline") playBass(ctx, master, t, freq, durSec);
          else if (name === "Chords") {
            // collect simultaneous chord notes
            playChord(ctx, master, t, [freq], durSec);
          }
          else if (name === "Lead") playLead(ctx, master, t, freq, durSec);
          delete pending[ev.note];
        }
      }
    }
  }

  // Auto-stop after pattern ends
  const timer = setTimeout(() => {
    isPlaying = false;
    onStop?.();
  }, totalSec * 1000);

  stopFns.push(() => clearTimeout(timer));
  return totalSec;
}

export function stopPreview() {
  isPlaying = false;
  stopFns.forEach((fn) => fn());
  stopFns = [];
  // Close and recreate context to kill all scheduled audio instantly
  if (ctx) { ctx.close(); ctx = null; }
}

export function getIsPlaying() { return isPlaying; }
