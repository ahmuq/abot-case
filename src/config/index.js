/**
 * Konfigurasi utama Bagah Bot
 * Sesuaikan value di bawah sesuai kebutuhan
 */
const config = {
  bot: {
    name: "Bagah Bot",
    prefix: ["", "!", ".", "#", "-", "•"],
    owner: ["yournumber"],
    ownerJid: ["yournumber@s.whatsapp.net"],
  },

  pairing: {
    enabled: true,
    number: 6283865204595,
  },

  sticker: {
    packname: "© Created By",
    author: "Bagah Bot",
  },

  apis: {
    betabotz: "https://tools.betabotz.eu.org/",
    ryzendesu: "https://api.ryzendesu.vip/",
  },

  apiKeys: {
    "https://tools.betabotz.eu.org/": "",
    "https://api.ryzendesu.vip/": "",
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
