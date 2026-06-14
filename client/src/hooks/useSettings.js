import { useState, useCallback } from "react";
import { SCALES, ROOTS, PROGRESSIONS, GENRES } from "../lib/midiEngine.js";

const DEFAULT_SETTINGS = {
  genre:        "Tech House",
  key:          "A",
  scale:        "Minor",
  bpm:          126,
  bars:         4,
  progression:  "i–VI–III–VII",
  kickPattern:  "4onfloor",
  hatPattern:   "closed",
  bassPattern:  "pumping",
  chordPattern: "stabs",
  leadPattern:  "arp",
  snarePattern: "house",
};

const DEFAULT_TRACKS = {
  chords: true,
  bass:   true,
  kick:   true,
  hats:   true,
  snare:  true,
  lead:   false,
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [trackStates, setTrackStates] = useState(DEFAULT_TRACKS);

  const update = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTrack = useCallback((trackKey) => {
    setTrackStates((prev) => ({ ...prev, [trackKey]: !prev[trackKey] }));
  }, []);

  const applyPreset = useCallback((preset) => {
    setSettings((prev) => ({
      ...prev,
      genre:        preset.genre        || prev.genre,
      key:          preset.key          || prev.key,
      scale:        preset.scale        || prev.scale,
      bpm:          preset.bpm          || prev.bpm,
      bars:         preset.bars         || prev.bars,
      progression:  preset.progression  || prev.progression,
      kickPattern:  preset.kickPattern  || prev.kickPattern,
      hatPattern:   preset.hatPattern   || prev.hatPattern,
      bassPattern:  preset.bassPattern  || prev.bassPattern,
      chordPattern: preset.chordPattern || prev.chordPattern,
      leadPattern:  preset.leadPattern  || prev.leadPattern,
    }));
    if (preset.tracksEnabled) {
      const next = { ...DEFAULT_TRACKS };
      Object.keys(next).forEach((k) => { next[k] = preset.tracksEnabled.includes(k); });
      setTrackStates(next);
    }
  }, []);

  const randomize = useCallback(() => {
    const keys  = ROOTS;
    const scales = Object.keys(SCALES);
    const progs  = Object.keys(PROGRESSIONS);
    const genres = GENRES;
    setSettings({
      genre:        genres[Math.floor(Math.random() * genres.length)],
      key:          keys[Math.floor(Math.random() * 12)],
      scale:        scales[Math.floor(Math.random() * scales.length)],
      bpm:          Math.floor(Math.random() * 36) + 110,
      bars:         [2, 4, 8][Math.floor(Math.random() * 3)],
      progression:  progs[Math.floor(Math.random() * progs.length)],
      kickPattern:  ["4onfloor", "breakbeat", "minimal"][Math.floor(Math.random() * 3)],
      hatPattern:   ["closed", "open"][Math.floor(Math.random() * 2)],
      bassPattern:  ["pumping", "walking", "groove"][Math.floor(Math.random() * 3)],
      chordPattern: ["stabs", "sustained", "offbeats"][Math.floor(Math.random() * 3)],
      leadPattern:  ["arp", "riff", "sparse"][Math.floor(Math.random() * 3)],
      snarePattern: ["house", "syncopated"][Math.floor(Math.random() * 2)],
    });
  }, []);

  const enabledCount = Object.values(trackStates).filter(Boolean).length;

  return { settings, trackStates, update, toggleTrack, applyPreset, randomize, enabledCount };
}
