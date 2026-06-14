// ─── Music Theory ──────────────────────────────────────────────────────────────

export const SCALES = {
  Minor:      [0, 2, 3, 5, 7, 8, 10],
  Dorian:     [0, 2, 3, 5, 7, 9, 10],
  Phrygian:   [0, 1, 3, 5, 7, 8, 10],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Major:      [0, 2, 4, 5, 7, 9, 11],
};

export const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const PROGRESSIONS = {
  "i–VI–III–VII": [0, 5, 2, 6],
  "i–iv–VII–III": [0, 3, 6, 2],
  "i–VI–iv–V":    [0, 5, 3, 4],
  "i–VII–VI–VII": [0, 6, 5, 6],
  "i–iv–i–V":     [0, 3, 0, 4],
};

export const GENRES = ["Tech House", "Deep House", "Progressive", "Afro House", "Melodic Techno"];

export const TRACK_DEFS = {
  chords: { label: "Chords",   icon: "🎹", patterns: ["stabs", "sustained", "offbeats"] },
  bass:   { label: "Bass",     icon: "🎸", patterns: ["pumping", "walking", "groove"] },
  kick:   { label: "Kick",     icon: "🥁", patterns: ["4onfloor", "breakbeat", "minimal"] },
  hats:   { label: "Hi-Hats", icon: "🎼", patterns: ["closed", "open"] },
  snare:  { label: "Snare",   icon: "🔊", patterns: ["house", "syncopated"] },
  lead:   { label: "Lead Arp", icon: "✨", patterns: ["arp", "riff", "sparse"] },
};

function noteNum(rootMidi, octave, degree, intervals) {
  const len = intervals.length;
  return rootMidi + octave * 12 + intervals[degree % len] + Math.floor(degree / len) * 12;
}

// ─── MIDI Binary Writer ────────────────────────────────────────────────────────

function varLen(v) {
  if (v < 0x80) return [v];
  const out = [];
  let first = true;
  while (v > 0) {
    const b = v & 0x7f;
    v >>= 7;
    if (first) { out.unshift(b); first = false; }
    else out.unshift(b | 0x80);
  }
  return out;
}
const w16 = (v) => [(v >> 8) & 0xff, v & 0xff];
const w32 = (v) => [(v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];

export function buildMidiBytes(tracks) {
  const tpb = 480;
  const header = [0x4d, 0x54, 0x68, 0x64, ...w32(6), ...w16(1), ...w16(tracks.length), ...w16(tpb)];

  const allTrackBytes = tracks.map(({ name, channel, events }) => {
    const b = [];
    const nameBytes = [...name].map((c) => c.charCodeAt(0));
    b.push(...varLen(0), 0xff, 0x03, ...varLen(nameBytes.length), ...nameBytes);

    let cur = 0;
    const sorted = [...events].sort((a, z) => a.tick - z.tick);
    for (const ev of sorted) {
      const delta = ev.tick - cur;
      cur = ev.tick;
      b.push(...varLen(delta));
      if (ev.type === "tempo")   b.push(0xff, 0x51, 0x03, (ev.us >> 16) & 0xff, (ev.us >> 8) & 0xff, ev.us & 0xff);
      if (ev.type === "program") b.push(0xc0 | (channel & 0xf), ev.program & 0x7f);
      if (ev.type === "on")      b.push(0x90 | (channel & 0xf), ev.note & 0x7f, ev.vel & 0x7f);
      if (ev.type === "off")     b.push(0x80 | (channel & 0xf), ev.note & 0x7f, 0);
    }
    b.push(...varLen(0), 0xff, 0x2f, 0x00);
    return [0x4d, 0x54, 0x72, 0x6b, ...w32(b.length), ...b];
  });

  return new Uint8Array([...header, ...allTrackBytes.flat()]);
}

// ─── Track Generators ─────────────────────────────────────────────────────────

export function genTempo(bpm) {
  return { name: "Tempo", channel: 15, events: [{ tick: 0, type: "tempo", us: Math.round(60_000_000 / bpm) }] };
}

export function genKick(bars, pattern) {
  const tpb = 480;
  const events = [];
  for (let b = 0; b < bars; b++) {
    const base = b * 4 * tpb;
    const hits =
      pattern === "breakbeat" ? [0, Math.floor(tpb * 1.5), 2 * tpb, Math.floor(tpb * 3.5)]
      : pattern === "minimal" ? [0, 2 * tpb]
      : [0, tpb, 2 * tpb, 3 * tpb];
    for (const h of hits) {
      events.push({ tick: base + h,      type: "on",  channel: 9, note: 36, vel: 100 });
      events.push({ tick: base + h + 60, type: "off", channel: 9, note: 36 });
    }
  }
  return { name: "Kick", channel: 9, events };
}

export function genSnare(bars, pattern) {
  const tpb = 480;
  const events = [];
  for (let b = 0; b < bars; b++) {
    const base = b * 4 * tpb;
    const hits =
      pattern === "syncopated" ? [tpb, Math.floor(tpb * 2.5), 3 * tpb]
      : [tpb, 3 * tpb];
    for (const h of hits) {
      events.push({ tick: base + h,      type: "on",  channel: 9, note: 38, vel: 88 });
      events.push({ tick: base + h + 60, type: "off", channel: 9, note: 38 });
    }
  }
  return { name: "Snare", channel: 9, events };
}

export function genHats(bars, pattern) {
  const tpb = 480;
  const events = [];
  const div  = pattern === "open" ? tpb : tpb / 2;
  const note = pattern === "open" ? 46 : 42;
  for (let t = 0; t < bars * 4 * tpb; t += div) {
    const vel = t % tpb === 0 ? 80 : 60;
    events.push({ tick: t,      type: "on",  channel: 9, note, vel });
    events.push({ tick: t + 28, type: "off", channel: 9, note });
  }
  return { name: "HiHat", channel: 9, events };
}

export function genBass(bars, rootMidi, intervals, chordDegs, pattern) {
  const tpb = 480;
  const stepLen = tpb / 4;
  const events = [{ tick: 0, type: "program", channel: 1, program: 38 }];
  for (let b = 0; b < bars; b++) {
    const base = b * 4 * tpb;
    const deg  = chordDegs[b % chordDegs.length];
    const root  = noteNum(rootMidi, 2, deg,     intervals);
    const fifth = noteNum(rootMidi, 2, deg + 4, intervals);
    const seq =
      pattern === "walking" ? [root, 0, root, 0, fifth, 0, fifth, 0, root + 2, 0, root + 2, 0, fifth, 0, 0, 0]
      : pattern === "groove" ? [root, 0, 0, root, 0, 0, fifth, 0, root, 0, 0, root, 0, fifth, 0, 0]
      : [root, 0, 0, 0, root, 0, fifth, 0, root, 0, 0, 0, root, 0, 0, 0];
    for (let i = 0; i < 16; i++) {
      if (!seq[i]) continue;
      events.push({ tick: base + i * stepLen,                type: "on",  channel: 1, note: seq[i], vel: 92 });
      events.push({ tick: base + i * stepLen + stepLen - 10, type: "off", channel: 1, note: seq[i] });
    }
  }
  return { name: "Bassline", channel: 1, events };
}

export function genChords(bars, rootMidi, intervals, chordDegs, pattern) {
  const tpb = 480;
  const events = [{ tick: 0, type: "program", channel: 2, program: 88 }];
  for (let b = 0; b < bars; b++) {
    const base = b * 4 * tpb;
    const deg  = chordDegs[b % chordDegs.length];
    const cn = [
      noteNum(rootMidi, 4, deg,     intervals),
      noteNum(rootMidi, 4, deg + 2, intervals),
      noteNum(rootMidi, 4, deg + 4, intervals),
    ];
    const offsets =
      pattern === "stabs"    ? [0, tpb, 2 * tpb, Math.floor(2.5 * tpb)]
      : pattern === "offbeats" ? [Math.floor(tpb / 2), Math.floor(tpb * 2.5)]
      : [0];
    const dur =
      pattern === "stabs"    ? tpb / 4
      : pattern === "sustained" ? 4 * tpb - 10
      : tpb - 10;
    for (const off of offsets) {
      for (const n of cn) {
        events.push({ tick: base + off,       type: "on",  channel: 2, note: n, vel: 72 });
        events.push({ tick: base + off + dur, type: "off", channel: 2, note: n });
      }
    }
  }
  return { name: "Chords", channel: 2, events };
}

export function genLead(bars, rootMidi, intervals, chordDegs, pattern) {
  const tpb = 480;
  const stepLen = tpb / 4;
  const events = [{ tick: 0, type: "program", channel: 3, program: 81 }];
  const arpPat  = [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 4, 3, 2, 1, 0];
  const riffPat = [0, 0, 2, 0, 4, 0, 2, 0, 0, 2, 4, 2, 0, 4, 3, 2];
  const sparsePat = [0, null, 2, null, 4, null, null, 2, 0, null, 1, null, 2, null, null, null];
  const pat = pattern === "riff" ? riffPat : pattern === "sparse" ? sparsePat : arpPat;

  for (let b = 0; b < bars; b++) {
    const base  = b * 4 * tpb;
    const deg   = chordDegs[b % chordDegs.length];
    const avail = intervals.slice(0, 5).map((_, i) => noteNum(rootMidi, 5, deg + i, intervals));
    for (let i = 0; i < 16; i++) {
      if (pat[i] === null || pat[i] === undefined) continue;
      const n = avail[pat[i] % avail.length];
      events.push({ tick: base + i * stepLen,                type: "on",  channel: 3, note: n, vel: 78 });
      events.push({ tick: base + i * stepLen + stepLen - 12, type: "off", channel: 3, note: n });
    }
  }
  return { name: "Lead", channel: 3, events };
}

// ─── Build full track list from settings ──────────────────────────────────────

export function buildTracks(settings, trackStates) {
  const {
    key, scale, bpm, bars,
    progression, kickPattern, hatPattern, bassPattern, chordPattern, leadPattern,
  } = settings;

  const rootMidi  = ROOTS.indexOf(key);
  const intervals = SCALES[scale] || SCALES.Minor;
  const chordDegs = PROGRESSIONS[progression] || PROGRESSIONS["i–VI–III–VII"];

  const tracks = [genTempo(bpm)];
  if (trackStates.kick)  tracks.push(genKick(bars, kickPattern || "4onfloor"), genSnare(bars, "house"));
  if (trackStates.hats)  tracks.push(genHats(bars, hatPattern  || "closed"));
  if (trackStates.bass)  tracks.push(genBass(bars, rootMidi, intervals, chordDegs, bassPattern || "pumping"));
  if (trackStates.chords) tracks.push(genChords(bars, rootMidi, intervals, chordDegs, chordPattern || "stabs"));
  if (trackStates.lead)  tracks.push(genLead(bars, rootMidi, intervals, chordDegs, leadPattern || "arp"));
  return tracks;
}

// ─── Download helper ──────────────────────────────────────────────────────────

export function downloadMidi(filename, midiTracks) {
  const bytes = buildMidiBytes(midiTracks);
  const blob  = new Blob([bytes], { type: "audio/midi" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Piano roll preview data ──────────────────────────────────────────────────

export function getPianoRollNotes(settings, trackStates) {
  const { key, scale, bars, progression } = settings;
  const rootMidi  = ROOTS.indexOf(key);
  const intervals = SCALES[scale] || SCALES.Minor;
  const chordDegs = PROGRESSIONS[progression] || PROGRESSIONS["i–VI–III–VII"];
  const displayBars = Math.min(bars, 4);
  const notes = [];

  for (let b = 0; b < displayBars; b++) {
    const deg = chordDegs[b % chordDegs.length];
    if (trackStates.chords) {
      [0, 2, 4].forEach((d) => {
        const midi = noteNum(rootMidi, 4, deg + d, intervals);
        const top  = Math.max(5, Math.min(70, ((127 - midi) / 127) * 85));
        const left = (b / displayBars) * 88 + Math.random() * 4;
        notes.push({ left, top, width: 14 + Math.random() * 8, type: "chord" });
      });
    }
    if (trackStates.bass) {
      const midi = noteNum(rootMidi, 2, deg, intervals);
      const top  = 75 + ((midi % 12) / 12) * 18;
      notes.push({ left: (b / displayBars) * 88 + 1, top, width: 20, type: "bass" });
    }
  }
  return notes;
}
