import { useMemo, useState, useEffect, useRef } from "react";
import { SCALES, ROOTS, PROGRESSIONS, GENRES, getPianoRollNotes, buildTracks } from "../lib/midiEngine.js";
import { playPreview, stopPreview, getIsPlaying } from "../lib/audioEngine.js";
import styles from "./HeroPanel.module.css";

const SCALE_KEYS = Object.keys(SCALES);
const PROG_KEYS  = Object.keys(PROGRESSIONS);

export default function HeroPanel({ settings, trackStates, update, onGenerate, onRandomize, onSave }) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const durationRef = useRef(0);
  const startRef    = useRef(0);

  const pianoNotes = useMemo(() => getPianoRollNotes(settings, trackStates), [settings, trackStates]);
  const waveHeights = useMemo(() => Array.from({ length: 16 }, () => 20 + Math.random() * 75), [settings.bpm, settings.key]);

  // Stop playback if settings change
  useEffect(() => {
    if (playing) handleStop();
  }, [settings, trackStates]);

  function handleStop() {
    stopPreview();
    setPlaying(false);
    setProgress(0);
    clearInterval(progressRef.current);
  }

  function handlePreview() {
    if (playing) { handleStop(); return; }

    const tracks = buildTracks(settings, trackStates);
    const totalSec = playPreview(tracks, settings.bpm, () => {
      setPlaying(false);
      setProgress(0);
      clearInterval(progressRef.current);
    });

    setPlaying(true);
    setProgress(0);
    durationRef.current = totalSec;
    startRef.current = performance.now();

    progressRef.current = setInterval(() => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const pct = Math.min(1, elapsed / durationRef.current);
      setProgress(pct);
      if (pct >= 1) clearInterval(progressRef.current);
    }, 50);
  }

  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <div className={styles.kicker}>AI-powered MIDI creation</div>
        <h2 className={styles.heading}>Generate house music ideas in seconds.</h2>
        <p className={styles.sub}>Chords, basslines, drums, arps, stabs — full song starter packs. Tweak the vibe, then drag the MIDI files straight into your DAW.</p>

        <div className={styles.actions}>
          <button className={styles.primary} onClick={onGenerate}>⚡ Generate MIDI</button>
          <button className={styles.btn} onClick={onRandomize}>🎲 Randomize</button>
          <button
            className={`${styles.btn} ${playing ? styles.btnActive : ""}`}
            onClick={handlePreview}
          >
            {playing ? "⏹ Stop" : "▶ Preview"}
          </button>
          <button className={styles.btn} onClick={onSave}>💾 Save Preset</button>
        </div>

        <div className={styles.controlGrid}>
          <Control label="Genre">
            <select value={settings.genre} onChange={(e) => update("genre", e.target.value)}>
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Control>
          <Control label="Key">
            <select value={settings.key} onChange={(e) => update("key", e.target.value)}>
              {ROOTS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Control>
          <Control label="Scale">
            <select value={settings.scale} onChange={(e) => update("scale", e.target.value)}>
              {SCALE_KEYS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Control>
          <Control label={`BPM — ${settings.bpm}`}>
            <input type="range" min="110" max="145" step="1"
              value={settings.bpm} onChange={(e) => update("bpm", +e.target.value)} />
          </Control>
          <Control label="Bars">
            <select value={settings.bars} onChange={(e) => update("bars", +e.target.value)}>
              {[2, 4, 8, 16].map((b) => <option key={b} value={b}>{b} bars</option>)}
            </select>
          </Control>
          <Control label="Progression">
            <select value={settings.progression} onChange={(e) => update("progression", e.target.value)}>
              {PROG_KEYS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Control>
          <Control label="Energy">
            <select defaultValue="Club">
              {["Club", "Peak", "Late Night", "Afterhours"].map((e) => <option key={e}>{e}</option>)}
            </select>
          </Control>
          <Control label="Swing">
            <select defaultValue="None">
              {["None", "Light", "Groove", "Heavy"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Control>
        </div>
      </div>

      <div className={styles.visualizer}>
        <div className={styles.vizHeader}>
          <div className={styles.kicker}>Live MIDI Preview</div>
          {playing && (
            <div className={styles.playingBadge}>
              <span className={styles.dot} />
              Playing
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Waveform — bars animate when playing */}
        <div className={styles.wave}>
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className={`${styles.bar} ${playing ? styles.barPlaying : ""}`}
              style={{
                height: `${h}%`,
                animationDelay: playing ? `${(i * 0.06).toFixed(2)}s` : "0s",
              }}
            />
          ))}
        </div>

        {/* Piano roll */}
        <div className={styles.pianoRoll}>
          {pianoNotes.map((n, i) => (
            <div
              key={i}
              className={`${styles.note} ${n.type === "chord" ? styles.chordNote : styles.bassNote} ${playing ? styles.notePlaying : ""}`}
              style={{ left: `${n.left}%`, top: `${n.top}%`, width: `${n.width}%` }}
            />
          ))}
          {/* Playhead */}
          {playing && (
            <div className={styles.playhead} style={{ left: `${progress * 100}%` }} />
          )}
        </div>
      </div>
    </section>
  );
}

function Control({ label, children }) {
  return (
    <div className={styles.control}>
      <label className={styles.controlLabel}>{label}</label>
      {children}
    </div>
  );
}
