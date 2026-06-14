import styles from "./Sidebar.module.css";

const NAV_CREATE = [
  { icon: "⚡", label: "Lab Generator", active: true },
  { icon: "🎹", label: "Chord Engine" },
  { icon: "🥁", label: "Drum Grooves" },
  { icon: "🎸", label: "Basslines" },
  { icon: "🎼", label: "Song Starters" },
];
const NAV_LIB = [
  { icon: "💾", label: "Saved Presets" },
  { icon: "📦", label: "MIDI Packs" },
  { icon: "⭐", label: "Favorites" },
  { icon: "🧪", label: "Experiments" },
];

export default function Sidebar({ exportCount }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>STL</div>
        <div>
          <h1 className={styles.brandName}>SkyeTunezLab</h1>
          <span className={styles.brandSub}>Producer MIDI playground</span>
        </div>
      </div>

      <p className={styles.navTitle}>Create</p>
      {NAV_CREATE.map((item) => (
        <div key={item.label} className={`${styles.navItem} ${item.active ? styles.active : ""}`}>
          {item.icon} {item.label}
        </div>
      ))}

      <p className={styles.navTitle}>Library</p>
      {NAV_LIB.map((item) => (
        <div key={item.label} className={styles.navItem}>
          {item.icon} {item.label}
        </div>
      ))}

      <div className={styles.creditBox}>
        <strong>{exportCount}</strong>
        <p>Free MIDI exports remaining this month. Upgrade for unlimited packs and AI composer tools.</p>
      </div>
    </aside>
  );
}
