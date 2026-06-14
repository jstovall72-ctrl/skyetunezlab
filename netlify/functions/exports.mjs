import { getSheetsClient, readSheet, appendRow, json } from "./_sheets.mjs";

export async function handler(event) {
  try {
    const sheets = getSheetsClient();

    if (event.httpMethod === "GET") {
      const rows = await readSheet(sheets, "Exports!A2:I");
      const exports_ = rows
        .map((r) => ({
          id:        r[0],
          name:      r[1],
          genre:     r[2],
          key:       r[3],
          scale:     r[4],
          bpm:       Number(r[5]),
          bars:      Number(r[6]),
          createdAt: r[7],
          tracks:    r[8] ? r[8].split(",") : [],
        }))
        .reverse()
        .slice(0, 10);
      return json(200, exports_);
    }

    if (event.httpMethod === "POST") {
      const { name, genre, key, scale, bpm, bars, tracks } = JSON.parse(event.body || "{}");
      const id        = `exp_${Date.now()}`;
      const createdAt = new Date().toISOString();
      await appendRow(sheets, "Exports!A:I", [
        id, name, genre, key, scale, bpm, bars, createdAt,
        (tracks || []).join(","),
      ]);
      return json(200, { ok: true, id });
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("exports fn error:", err.message);
    return json(500, { error: err.message });
  }
}
