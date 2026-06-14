# SkyeTunezLab

Producer MIDI playground — React + Netlify Functions + Google Sheets.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + CSS Modules |
| Backend | Netlify Functions (serverless, replaces Express) |
| Data | Google Sheets via Sheets API v4 (service account) |
| MIDI | Pure JS binary writer, zero dependencies |

---

## Project Structure

```
skyetunezlab/
├── netlify.toml                  # Build + function + redirect config
├── .env.example                  # Env vars reference (copy to .env for local dev)
├── netlify/
│   └── functions/
│       ├── _sheets.mjs           # Shared Sheets auth + helpers
│       ├── presets.mjs           # GET /api/presets  POST /api/presets
│       ├── exports.mjs           # GET /api/exports  POST /api/exports
│       ├── health.mjs            # GET /api/health
│       └── package.json          # googleapis dep for esbuild
├── client/                       # React app (Vite)
│   └── src/
│       ├── components/           # UI + CSS modules
│       ├── hooks/                # useSettings, useToast
│       └── lib/
│           ├── midiEngine.js     # MIDI generation + music theory
│           └── api.js            # fetch wrapper → /api/*
└── _server_local_only/           # Original Express server (reference only)
```

---

## Google Sheets Setup

### 1. Create the spreadsheet

Go to [sheets.google.com](https://sheets.google.com), create a new spreadsheet.
Copy the **Spreadsheet ID** from the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

### 2. Create two sheet tabs

**`Presets`** — paste this as row 1:
```
id  name  genre  key  scale  bpm  bars  progression  kick_pattern  hat_pattern  bass_pattern  chord_pattern  tracks_enabled  tag  description
```

**`Exports`** — paste this as row 1:
```
id  name  genre  key  scale  bpm  bars  created_at  tracks
```

### 3. Seed some presets (paste into Presets from row 2)

| id | name | genre | key | scale | bpm | bars | progression | kick_pattern | hat_pattern | bass_pattern | chord_pattern | tracks_enabled | tag | description |
|----|------|-------|-----|-------|-----|------|-------------|--------------|-------------|--------------|---------------|----------------|-----|-------------|
| pre_1 | Festival Tech | Tech House | F | Minor | 128 | 4 | i–VI–III–VII | 4onfloor | closed | pumping | stabs | chords,bass,kick,hats | hot | Big drums, tight bass, bright stabs |
| pre_2 | Deep Night | Deep House | A | Dorian | 120 | 8 | i–iv–VII–III | 4onfloor | closed | walking | sustained | chords,bass,kick,hats,lead | new | Warm chords, rolling sub, soft arp |
| pre_3 | Progressive Lift | Progressive | C | Minor | 124 | 8 | i–VI–iv–V | 4onfloor | open | groove | offbeats | chords,bass,kick,hats | ai | Emotional chords and long builds |

### 4. Create a Google Service Account

1. [Google Cloud Console](https://console.cloud.google.com) → create/select a project
2. **APIs & Services → Enable APIs** → enable **Google Sheets API**
3. **IAM & Admin → Service Accounts → Create Service Account** → any name → Done
4. Click the account → **Keys → Add Key → JSON** → download the file
5. Note the `client_email` and `private_key` values from the JSON

### 5. Share the spreadsheet

Open the spreadsheet → **Share** → paste the `client_email` → give **Editor** access.

---

## GitHub Setup

```bash
git init
git add .
git commit -m "init SkyeTunezLab"
git remote add origin https://github.com/YOUR_USERNAME/skyetunezlab.git
git push -u origin main
```

---

## Netlify Deploy

### Connect repo
1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Choose your GitHub repo
3. Netlify auto-detects `netlify.toml` — build settings are already set

### Set environment variables
**Site → Environment variables → Add variable** (add all three):

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_EMAIL` | `your-sa@project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | The full key string with literal `\n` characters |
| `GOOGLE_SHEET_ID` | Your spreadsheet ID |

> **Private key tip:** Copy the `private_key` value from the downloaded JSON exactly as-is (with `\n` sequences). Netlify stores it correctly; the function replaces `\n` → real newlines at runtime.

### Deploy
Click **Deploy site** — done. Every push to `main` auto-deploys.

---

## Local Development

```bash
# 1. Install deps
npm run install:all

# 2. Create local env file
cp .env.example .env
# Fill in your three Google values

# 3. Run (netlify dev serves React + functions together on :8888)
npm run dev
```

Visit http://localhost:8888 — functions are live at `/api/*` same as production.

---

## API Reference

| Method | Path | Sheet | Description |
|--------|------|-------|-------------|
| GET | `/api/presets` | Presets!A2:O | Load all presets |
| POST | `/api/presets` | Presets!A:O | Save a new preset |
| GET | `/api/exports` | Exports!A2:I | Recent export history (last 10) |
| POST | `/api/exports` | Exports!A:I | Log a MIDI download |
| GET | `/api/health` | — | Health check |

---

## MIDI Track → DAW Channel Map

| Track | MIDI Channel | GM Program |
|-------|-------------|------------|
| Bassline | 1 | 38 Synth Bass |
| Chords | 2 | 88 Pad |
| Lead | 3 | 81 Lead Synth |
| Drums (kick/snare/hats) | 10 | GM Percussion |

Import the `.mid` into Ableton, Logic, FL Studio, or any DAW and assign your own instruments per channel.
