// In dev, Vite proxies /api/* → localhost:3001
// In Netlify prod, netlify.toml rewrites /api/* → /.netlify/functions/*
const BASE = "/api";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  getPresets:  ()     => req("/presets"),
  savePreset:  (data) => req("/presets", { method: "POST", body: JSON.stringify(data) }),
  getExports:  ()     => req("/exports"),
  logExport:   (data) => req("/exports", { method: "POST", body: JSON.stringify(data) }),
  health:      ()     => req("/health"),
};
