import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import styles from "./RightPanel.module.css";

const FALLBACK_EXPORTS = [
  { id: "e1", name: "Tech House Pack #14", genre: "Tech House", key: "F", scale: "Minor", bpm: 128, createdAt: "Today" },
  { id: "e2", name: "Deep House Groove #8", genre: "Deep House", key: "A", scale: "Minor", bpm: 124, createdAt: "Yesterday" },
  { id: "e3", name: "Progressive Chords #22", genre: "Progressive", key: "C", scale: "Minor", bpm: 126, createdAt: "May 31" },
];

export default function RightPanel({ settings, enabledCount, onDownload, showToast }) {
  const [exports, setExports]   = useState(FALLBACK_EXPORTS);
  const [prompt, setPrompt]     = useState("Create a dark tech house groove with rolling bass, minor stabs, and an 8-bar build for a club track.");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.getExports()
      .then((data) => { if (data.length) setExports(data); })
      .catch(() => {});
  }, []);

  function handlePromptGenerate() {
    const p = prompt.toLowerCase();
    showToast("✨ Generating from prompt…");
    onDownload({ fromPrompt: true, prompt: p });
  }

  return (
    <>
      <div className={styles.panel}>
        <h3 className={styles.heading}>Current Pack</h3>
        <div className={styles.exportBox}>
          <Row label="Genre"  value={settings.genre} />
          <Row label="Key"    value={`${settings.key} ${settings.scale}`} />
          <Row label="BPM"    value={settings.bpm} />
          <Row label="Tracks" value={`${enabledCount} MIDI`} />
          <Row label="Bars"   value={settings.bars} />
        </div>
        <button className={styles.primary} onClick={() => onDownload()}>
          ⬇ Download MIDI Pack
        </button>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.heading}>Recent Exports</h3>
        {exports.map((e) => (
          <div key={e.id} className={styles.recentCard}>
            <strong className={styles.recentName}>{e.name}</strong>
            <span className={styles.recentMeta}>
              {e.createdAt} · {e.key} {e.scale} · {e.bpm} BPM
            </span>
          </div>
        ))}
      </div>

      <div className={styles.panel}>
        <h3 className={styles.heading}>AI Composer Prompt</h3>
        <textarea
          className={styles.promptBox}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <button className={styles.secondaryBtn} onClick={handlePromptGenerate}>
          ✨ Generate From Prompt
        </button>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
