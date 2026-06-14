import { useState, useEffect } from "react";
import styles from "./ArrangementBuilder.module.css";

const LANE_STYLES = {
  chords: "on",
  bass:   "grn",
  kick:   "alt",
  hats:   "on",
  snare:  "alt",
  lead:   "grn",
};

function randomClips(trackOn, bars) {
  return Array.from({ length: 8 }, (_, i) => trackOn && i < bars && Math.random() > 0.15);
}

export default function ArrangementBuilder({ trackStates, settings }) {
  const [clips, setClips] = useState({});

  useEffect(() => {
    const next = {};
    Object.keys(trackStates).forEach((t) => {
      next[t] = randomClips(trackStates[t], settings.bars);
    });
    setClips(next);
  }, [settings.key, settings.bars, settings.bpm]);

  function toggleClip(track, idx) {
    setClips((prev) => {
      const lane = [...(prev[track] || [])];
      lane[idx] = !lane[idx];
      return { ...prev, [track]: lane };
    });
  }

  const activeLanes = Object.entries(trackStates).filter(([, on]) => on);

  return (
    <div className={styles.arrangement}>
      {activeLanes.map(([track]) => (
        <div key={track} className={styles.lane}>
          <span className={styles.laneName}>{track.charAt(0).toUpperCase() + track.slice(1)}</span>
          <div className={styles.clips}>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className={`${styles.clip} ${clips[track]?.[i] ? styles[LANE_STYLES[track]] : ""}`}
                onClick={() => toggleClip(track, i)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
