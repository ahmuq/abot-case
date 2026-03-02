import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/* ───────── Load .env (built-in, tanpa dependency) ───────── */
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    // Jangan override env yang sudah di-set (misal dari Docker/PM2)
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

/* ───────── Helper ───────── */
const env = (key, fallback = "") => process.env[key] ?? fallback;
const envBool = (key, fallback = false) => {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
};
const envList = (key, fallback = []) => {
  const v = process.env[key];
  if (!v) return fallback;
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

/* ───────── Derived ───────── */
const ownerNumbers = envList("BOT_OWNER");
const ownerJid = ownerNumbers.map(
  (n) => n.replace(/[^0-9]/g, "") + "@s.whatsapp.net",
);

const apiUrls = {
  betabotz: env("API_BETABOTZ", "https://tools.betabotz.eu.org/"),
  ryzendesu: env("API_RYZENDESU", "https://api.ryzendesu.vip/"),
};

/**
 * Konfigurasi utama Bagah Bot
 *
 * Semua value deployment-specific dibaca dari .env
 * → file .env ada di .gitignore, aman git pull tanpa conflict.
 * → commit .env.example sebagai template.
 */
const config = {
  bot: {
    name: env("BOT_NAME", "Bagah Bot"),
    prefix: envList("BOT_PREFIX", ["", "!", ".", "#", "-", "•"]),
    owner: ownerNumbers,
    ownerJid,
    public: envBool("BOT_PUBLIC", true),
  },

  pairing: {
    enabled: envBool("PAIRING_ENABLED", true),
    number: env("PAIRING_NUMBER", ""),
    customCode: env("PAIRING_CUSTOM_CODE", ""),
  },

  sticker: {
    packname: env("STICKER_PACKNAME", "© Created By"),
    author: env("STICKER_AUTHOR", "Bagah Bot"),
  },

  apis: apiUrls,

  apiKeys: {
    [apiUrls.betabotz]: env("APIKEY_BETABOTZ", ""),
    [apiUrls.ryzendesu]: env("APIKEY_RYZENDESU", ""),
  },

  messages: {
    success: "```Success✅```",
    admin: "```Fitur Khusus Admin Group!!!```",
    botAdmin: "```Bot Harus Menjadi Admin Terlebih Dahulu!!!```",
    owner: "```Fitur Khusus Owner Bot!!!```",
    group: "```Fitur Digunakan Hanya Untuk Group!!!```",
    private: "```Fitur Digunakan Hanya Untuk Private Chat!!!```",
    error:
      "```Mungkin Lagi Error Kak Harap Lapor Owner Biar Langsung Di Benerin🙏```",
    wait: "```Waittt...```",
  },
};

export default config;

/**
 * Bangun URL API dari config
 * @param {string} name - Nama API atau base URL
 * @param {string} path - Path endpoint
 * @param {object} query - Query parameters
 * @param {string} apikeyName - Nama query param untuk API key
 */
export function buildApiUrl(name, path = "/", query = {}, apikeyName) {
  const base = config.apis[name] || name;
  const params = { ...query };

  if (apikeyName) {
    const keyBase = config.apis[name] || name;
    const key = config.apiKeys[keyBase];
    if (key) params[apikeyName] = key;
  }

  const qs = Object.keys(params).length
    ? "?" + new URLSearchParams(params).toString()
    : "";

  return base + path + qs;
}
