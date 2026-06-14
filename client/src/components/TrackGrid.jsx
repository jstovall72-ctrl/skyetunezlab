import { TRACK_DEFS } from "../lib/midiEngine.js";
import styles from "./TrackGrid.module.css";

export default function TrackGrid({ trackStates, onToggle }) {
  return (
    <div className={styles.grid}>
      {Object.entries(TRACK_DEFS).map(([key, def]) => {
        const on = trackStates[key];
        return (
          <div
            key={key}
            className={`${styles.track} ${on ? styles.enabled : styles.disabled}`}
            onClick={() => onToggle(key)}
          >
            {on && <span className={styles.check}>✓</span>}
            <div className={styles.icon}>{def.icon}</div>
            <strong className={styles.label}>{def.label}</strong>
            <span className={styles.sub}>{def.patterns[0]}</span>
          </div>
        );
      })}
    </div>
  );
}
