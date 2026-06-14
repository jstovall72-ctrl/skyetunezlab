import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import styles from "./PresetsPanel.module.css";

const FALLBACK_PRESETS = [
  { id: "1", name: "Festival Tech",      genre: "Tech House",  key: "F", scale: "Minor",  bpm: 128, bars: 4, tag: "hot", description: "Big drums, tight bass, bright stabs", tracksEnabled: ["chords","bass","kick","hats"], progression: "i–VI–III–VII", chordPattern: "stabs",    bassPattern: "pumping" },
  { id: "2", name: "Deep Night",         genre: "Deep House",  key: "A", scale: "Dorian", bpm: 120, bars: 8, tag: "new", description: "Warm chords, rolling sub, soft arp",  tracksEnabled: ["chords","bass","kick","hats","lead"], progression: "i–iv–VII–III", chordPattern: "sustained", bassPattern: "walking" },
  { id: "3", name: "Progressive Lift",   genre: "Progressive", key: "C", scale: "Minor",  bpm: 124, bars: 8, tag: "ai",  description: "Emotional chords and long builds",     tracksEnabled: ["chords","bass","kick","hats"], progression: "i–VI–iv–V",   chordPattern: "offbeats",  bassPattern: "groove"  },
  { id: "4", name: "Afro Sunrise",       genre: "Afro House",  key: "G", scale: "Dorian", bpm: 122, bars: 4, tag: "ai",  description: "Percussive swing, melodic warmth",     tracksEnabled: ["chords","bass","kick","hats","lead"], progression: "i–VII–VI–VII", chordPattern: "stabs", bassPattern: "walking" },
];

export default function PresetsPanel({ onApply, showToast }) {
  const [presets, setPresets]     = useState(FALLBACK_PRESETS);
  const [selected, setSelected]   = useState("1");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.getPresets()
      .then((data) => { if (data.length) setPresets(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(preset) {
    setSelected(preset.id);
    onApply(preset);
    showToast(`Loaded: ${preset.name}`);
  }

  return (
    <div>
      {loading && <p className={styles.loading}>Loading presets…</p>}
      {presets.map((p) => (
        <div
          key={p.id}
          className={`${styles.card} ${selected === p.id ? styles.selected : ""}`}
          onClick={() => handleSelect(p)}
        >
          <div>
            <strong className={styles.name}>{p.name}</strong>
            <span className={styles.desc}>{p.description}</span>
          </div>
          {p.tag && <span className={`${styles.tag} ${styles[p.tag]}`}>{p.tag.toUpperCase()}</span>}
        </div>
      ))}
    </div>
  );
}
