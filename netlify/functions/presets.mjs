import { getSheetsClient, readSheet, appendRow, json } from "./_sheets.mjs";

export async function handler(event) {
  try {
    const sheets = getSheetsClient();

    if (event.httpMethod === "GET") {
      const rows = await readSheet(sheets, "Presets!A2:O");
      const presets = rows.map((r) => ({
        id:            r[0],
        name:          r[1],
        genre:         r[2],
        key:           r[3],
        scale:         r[4],
        bpm:           Number(r[5]),
        bars:          Number(r[6]),
        progression:   r[7],
        kickPattern:   r[8]  || "4onfloor",
        hatPattern:    r[9]  || "closed",
        bassPattern:   r[10] || "pumping",
        chordPattern:  r[11] || "stabs",
        tracksEnabled: r[12] ? r[12].split(",") : ["chords","bass","kick","hats"],
        tag:           r[13] || "",
        description:   r[14] || "",
      }));
      return json(200, presets);
    }

    if (event.httpMethod === "POST") {
      const {
        name, genre, key, scale, bpm, bars, progression,
        kickPattern, hatPattern, bassPattern, chordPattern,
        tracksEnabled, tag, description,
      } = JSON.parse(event.body || "{}");
      const id = `pre_${Date.now()}`;
      await appendRow(sheets, "Presets!A:O", [
        id, name, genre, key, scale, bpm, bars, progression,
        kickPattern, hatPattern, bassPattern, chordPattern,
        (tracksEnabled || []).join(","), tag, description,
      ]);
      return json(200, { ok: true, id });
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("presets fn error:", err.message);
    return json(500, { error: err.message });
  }
}
