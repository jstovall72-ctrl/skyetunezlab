import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import HeroPanel from "./components/HeroPanel.jsx";
import TrackGrid from "./components/TrackGrid.jsx";
import PresetsPanel from "./components/PresetsPanel.jsx";
import ArrangementBuilder from "./components/ArrangementBuilder.jsx";
import RightPanel from "./components/RightPanel.jsx";
import Toast from "./components/Toast.jsx";
import { useSettings } from "./hooks/useSettings.js";
import { useToast } from "./hooks/useToast.js";
import { buildTracks, downloadMidi } from "./lib/midiEngine.js";
import { api } from "./lib/api.js";
import styles from "./App.module.css";

export default function App() {
  const { settings, trackStates, update, toggleTrack, applyPreset, randomize, enabledCount } = useSettings();
  const { toast, showToast } = useToast();
  const [exportCount, setExportCount] = useState(42);

  function doGenerate() {
    const tracks   = buildTracks(settings, trackStates);
    const filename = `STL_${settings.key}${settings.scale.slice(0, 3)}_${settings.bpm}bpm.mid`;
    downloadMidi(filename, tracks);

    const exportData = {
      name:   `${settings.genre} Pack`,
      genre:  settings.genre,
      key:    settings.key,
      scale:  settings.scale,
      bpm:    settings.bpm,
      bars:   settings.bars,
      tracks: Object.entries(trackStates).filter(([, v]) => v).map(([k]) => k),
    };
    api.logExport(exportData).catch(() => {});
    setExportCount((n) => Math.max(0, n - 1));
    showToast(`⚡ Generated ${settings.key} ${settings.scale} @ ${settings.bpm} BPM`);
  }

  function handleSavePreset() {
    const data = {
      ...settings,
      tracksEnabled: Object.entries(trackStates).filter(([, v]) => v).map(([k]) => k),
      tag: "new",
      description: `${settings.genre} in ${settings.key} ${settings.scale}`,
      name: `${settings.genre} — ${settings.key} ${settings.scale}`,
    };
    api.savePreset(data)
      .then(() => showToast("💾 Preset saved to Google Sheets!"))
      .catch(() => showToast("💾 Preset saved locally"));
  }

  return (
    <div className={styles.app}>
      <Sidebar exportCount={exportCount} />

      <main className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.search}>Search presets, genres, artists, grooves…</div>
          <div className={styles.topActions}>
            <span className={styles.pill}>{settings.bpm} BPM</span>
            <span className={styles.pill}>{settings.key} {settings.scale}</span>
            <button className={styles.primaryBtn} onClick={doGenerate}>⬇ Export Pack</button>
          </div>
        </div>

        <HeroPanel
          settings={settings}
          trackStates={trackStates}
          update={update}
          onGenerate={doGenerate}
          onRandomize={() => { randomize(); showToast("🎲 Randomized!"); }}
          onPreview={() => showToast("▶ Previewing pattern…")}
          onSave={handleSavePreset}
        />

        <div className={styles.sectionGrid}>
          <div className={styles.panel}>
            <h3 className={styles.panelHeading}>Tracks to Generate</h3>
            <TrackGrid trackStates={trackStates} onToggle={toggleTrack} />
          </div>
          <div className={styles.panel}>
            <h3 className={styles.panelHeading}>Inspired Presets</h3>
            <PresetsPanel onApply={applyPreset} showToast={showToast} />
          </div>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelHeading}>Arrangement Builder</h3>
          <ArrangementBuilder trackStates={trackStates} settings={settings} />
        </div>
      </main>

      <aside className={styles.right}>
        <RightPanel
          settings={settings}
          enabledCount={enabledCount}
          onDownload={doGenerate}
          showToast={showToast}
        />
      </aside>

      <Toast message={toast} />
    </div>
  );
}
