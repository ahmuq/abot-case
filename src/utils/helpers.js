import axios from "axios";
import moment from "moment-timezone";

/* ───────── Buffer / Fetch ───────── */

export async function getBuffer(url, options = {}) {
  const res = await axios({
    method: "get",
    url,
    headers: { DNT: 1, "Upgrade-Insecure-Request": 1 },
    ...options,
    responseType: "arraybuffer",
  });
  return res.data;
}

export async function fetchJson(url, options = {}) {
  const res = await axios({
    method: "GET",
    url,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    ...options,
  });
  return res.data;
}

/* ───────── Time / Runtime ───────── */

export function runtime(seconds) {
  seconds = Number(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d} Hari`);
  if (h > 0) parts.push(`${h} Jam`);
  if (m > 0) parts.push(`${m} Menit`);
  if (s > 0) parts.push(`${s} Detik`);
  return parts.join(", ") || "0 Detik";
}

export function getGreeting() {
  const hour = moment().tz("Asia/Jakarta").hour();
  if (hour < 5) return "Selamat Malam";
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  if (hour < 19) return "Selamat Petang";
  return "Selamat Malam";
}

export function formatDate() {
  return moment.tz("Asia/Jakarta").format("DD/MM/YY");
}

export function formatTime() {
  return moment.tz("Asia/Jakarta").format("HH:mm:ss");
}

/* ───────── String Utilities ───────── */

export function getRandom(ext = "") {
  return `${Math.floor(Math.random() * 100000)}${ext}`;
}

export function randomInt(min, max = null) {
  if (max === null) return Math.floor(Math.random() * min) + 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function isUrl(text) {
  return text.match(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi,
  );
}

export function jsonformat(obj) {
  return JSON.stringify(obj, null, 2);
}

export function parseMention(text = "") {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
    (v) => v[1] + "@s.whatsapp.net",
  );
}

/* ───────── Size ───────── */

export function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export async function getSizeMedia(path) {
  if (/https?:\/\//.test(path)) {
    const res = await axios.head(path);
    const length = parseInt(res.headers["content-length"]);
    return isNaN(length) ? "Unknown" : bytesToSize(length);
  }
  if (Buffer.isBuffer(path)) {
    return bytesToSize(Buffer.byteLength(path));
  }
  return "Unknown";
}
