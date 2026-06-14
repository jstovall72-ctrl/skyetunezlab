import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// ─── Google Sheets auth ────────────────────────────────────────────────────────
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ─── Sheet helpers ─────────────────────────────────────────────────────────────
async function readSheet(sheets, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  return res.data.values || [];
}

async function appendRow(sheets, range, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/presets  — reads "Presets" sheet
// Expected columns: id, name, genre, key, scale, bpm, bars, progression,
//                   kick_pattern, hat_pattern, bass_pattern, chord_pattern,
//                   tracks_enabled, tag, description
app.get("/api/presets", async (req, res) => {
  try {
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "Presets!A2:O");
    const presets = rows.map((r) => ({
      id: r[0],
      name: r[1],
      genre: r[2],
      key: r[3],
      scale: r[4],
      bpm: Number(r[5]),
      bars: Number(r[6]),
      progression: r[7],
      kickPattern: r[8] || "4onfloor",
      hatPattern: r[9] || "closed",
      bassPattern: r[10] || "pumping",
      chordPattern: r[11] || "stabs",
      tracksEnabled: r[12] ? r[12].split(",") : ["chords", "bass", "kick", "hats"],
      tag: r[13] || "",
      description: r[14] || "",
    }));
    res.json(presets);
  } catch (err) {
    console.error("presets error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exports  — reads "Exports" sheet (recent export history)
// Expected columns: id, name, genre, key, scale, bpm, bars, created_at, tracks
app.get("/api/exports", async (req, res) => {
  try {
    const sheets = getSheetsClient();
    const rows = await readSheet(sheets, "Exports!A2:I");
    const exports_ = rows
      .map((r) => ({
        id: r[0],
        name: r[1],
        genre: r[2],
        key: r[3],
        scale: r[4],
        bpm: Number(r[5]),
        bars: Number(r[6]),
        createdAt: r[7],
        tracks: r[8] ? r[8].split(",") : [],
      }))
      .reverse()
      .slice(0, 10);
    res.json(exports_);
  } catch (err) {
    console.error("exports error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exports  — logs a new export
app.post("/api/exports", async (req, res) => {
  try {
    const { name, genre, key, scale, bpm, bars, tracks } = req.body;
    const sheets = getSheetsClient();
    const id = `exp_${Date.now()}`;
    const createdAt = new Date().toISOString();
    await appendRow(sheets, "Exports!A:I", [
      id, name, genre, key, scale, bpm, bars, createdAt, tracks.join(","),
    ]);
    res.json({ ok: true, id });
  } catch (err) {
    console.error("log export error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/presets  — save a new preset
app.post("/api/presets", async (req, res) => {
  try {
    const {
      name, genre, key, scale, bpm, bars, progression,
      kickPattern, hatPattern, bassPattern, chordPattern,
      tracksEnabled, tag, description,
    } = req.body;
    const sheets = getSheetsClient();
    const id = `pre_${Date.now()}`;
    await appendRow(sheets, "Presets!A:O", [
      id, name, genre, key, scale, bpm, bars, progression,
      kickPattern, hatPattern, bassPattern, chordPattern,
      tracksEnabled.join(","), tag, description,
    ]);
    res.json({ ok: true, id });
  } catch (err) {
    console.error("save preset error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.listen(PORT, () => console.log(`SkyeTunezLab API → http://localhost:${PORT}`));
