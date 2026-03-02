import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

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

const ownerNumbers = envList("BOT_OWNER");
const ownerJid = ownerNumbers.map(
  (n) => n.replace(/[^0-9]/g, "") + "@s.whatsapp.net",
);

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

  api: {
    baseUrl: env("API_BASE_URL", "https://bagahproject.com"),
    key: env("API_KEY", ""),
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
