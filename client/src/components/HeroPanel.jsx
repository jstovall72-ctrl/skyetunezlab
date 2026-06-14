import { useMemo } from "react";
import { SCALES, ROOTS, PROGRESSIONS, GENRES, getPianoRollNotes } from "../lib/midiEngine.js";
import styles from "./HeroPanel.module.css";

const SCALE_KEYS = Object.keys(SCALES);
const PROG_KEYS  = Object.keys(PROGRESSIONS);

export default function HeroPanel({ settings, trackStates, update, onGenerate, onRandomize, onPreview, onSave }) {
  const waveHeights = useMemo(() => Array.from({ length: 16 }, () => 20 + Math.random() * 75), [settings.bpm, settings.key]);
  const pianoNotes  = useMemo(() => getPianoRollNotes(settings, trackStates), [settings, trackStates]);

  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <div className={styles.kicker}>AI-powered MIDI creation</div>
        <h2 className={styles.heading}>Generate house music ideas in seconds.</h2>
        <p className={styles.sub}>Chords, basslines, drums, arps, stabs — full song starter packs. Tweak the vibe, then drag the MIDI files straight into your DAW.</p>

        <div className={styles.actions}>
          <button className={styles.primary} onClick={onGenerate}>⚡ Generate MIDI</button>
          <button className={styles.btn} onClick={onRandomize}>🎲 Randomize</button>
          <button className={styles.btn} onClick={onPreview}>▶ Preview</button>
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
        <div className={styles.kicker}>Live MIDI Preview</div>
        <div className={styles.wave}>
          {waveHeights.map((h, i) => (
            <div key={i} className={styles.bar} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className={styles.pianoRoll}>
          {pianoNotes.map((n, i) => (
            <div
              key={i}
              className={`${styles.note} ${n.type === "chord" ? styles.chordNote : styles.bassNote}`}
              style={{ left: `${n.left}%`, top: `${n.top}%`, width: `${n.width}%` }}
            />
          ))}
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
