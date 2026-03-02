<div align="center">

# Bagah Bot v2.0.0

WhatsApp Bot — ESM · OOP · Baileys v7 · SQLite

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-v7%20RC-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

</div>

---

## Tentang

Bagah Bot adalah WhatsApp bot yang ditulis dengan arsitektur **ESM + OOP** menggunakan **Baileys v7** (dengan LID support) dan **SQLite** (via sql.js) untuk session & database. Semua config di-load dari `.env` sehingga aman `git pull` tanpa conflict.

## Fitur

- **Baileys v7 RC** — LID support, native ESM, pairing code (custom 8-digit)
- **SQLite session** — `session.db` via sql.js (pure JS, tanpa C++ build tools)
- **SQLite database** — `database.db` menggantikan banyak file `.json`
- **@rodrigogs/baileys-store v2** — in-memory store + Keyv auth state
- **Modular commands** — setiap kategori command 1 file class terpisah
- **Config via `.env`** — tidak ada value sensitif di source code
- AI, downloader, search, sticker, group management, owner tools

## Struktur Project

```
bagah-bot/
├── index.js                   # Entry point
├── .env                       # Config deployment (gitignored)
├── .env.example               # Template config (di-commit)
├── package.json
│
└── src/
    ├── BagahBot.js            # Kelas utama (koneksi, events, send)
    ├── config/
    │   └── index.js           # Baca .env → config object
    ├── database/
    │   ├── Database.js        # SQLite wrapper (users, groups, settings)
    │   └── AuthState.js       # Session SQLite adapter untuk baileys
    ├── handlers/
    │   ├── CommandHandler.js   # Register & route semua command
    │   └── GroupHandler.js     # Handle join/leave group
    ├── commands/               # ← TAMBAH COMMAND DI SINI
    │   ├── GeneralCommand.js   # menu, runtime
    │   ├── MakerCommand.js     # sticker, toimg, tts, brat
    │   ├── GroupCommand.js     # promote, demote, kick, hidetag, tagall
    │   ├── OwnerCommand.js     # setppbot, addpremium, broadcast
    │   ├── DownloaderCommand.js# tiktok, fb, ig, yt
    │   ├── SearchCommand.js    # pinterest, wikimedia, waifu
    │   └── AiCommand.js        # ai, gemini, blackbox, remini
    ├── lib/
    │   ├── Exif.js            # WebP sticker + EXIF metadata
    │   ├── scraper.js         # Web scraping functions
    │   └── uploader.js        # File upload (telegraph, etc)
    └── utils/
        ├── helpers.js         # Utility functions
        ├── logger.js          # Console logging dengan chalk
        └── serializer.js      # Message class (wrap raw baileys msg)
```

## Instalasi

### 1. Clone & install

```bash
git clone https://github.com/ahmuq/abot-case.git bagah-bot
cd bagah-bot
npm install
```

### 2. Setup config

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

```env
BOT_NAME=Bagah Bot
BOT_OWNER=628xxxxxxxxxx
PAIRING_ENABLED=true
PAIRING_NUMBER=628xxxxxxxxxx
PAIRING_CUSTOM_CODE=BAGAHBOT
```

### 3. Jalankan

```bash
npm start
```

Scan pairing code yang muncul di terminal, lalu tunggu sampai `Bot siap menerima pesan!`.

### Update tanpa conflict

```bash
git pull origin master
npm install
# .env kamu tetap aman, tidak ke-overwrite
```

---

## Cara Menambah Command Baru

Ada **2 cara**: tambah ke module yang sudah ada, atau buat module baru.

### Cara 1 — Tambah ke module yang sudah ada

Misalnya mau tambah command `!ping` di `GeneralCommand.js`:

**1.** Buka `src/commands/GeneralCommand.js`

**2.** Daftarkan di `get commands()`:

```js
get commands() {
  return new Map([
    // ... command yang sudah ada
    ["ping", { handler: this.ping.bind(this), category: "general" }],
  ]);
}
```

**3.** Buat method handler-nya:

```js
async ping(msg) {
  const start = Date.now();
  await msg.reply("Pong!");
  const latency = Date.now() - start;
  await msg.reply(`Latency: ${latency}ms`);
}
```

Selesai. Bot langsung mengenali `!ping`.

### Cara 2 — Buat module command baru

Misalnya mau buat kategori `fun`:

**1.** Buat file `src/commands/FunCommand.js`:

```js
/**
 * FunCommand - Command hiburan
 */
export default class FunCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["flip", { handler: this.coinFlip.bind(this), category: "fun" }],
      ["dice", { handler: this.rollDice.bind(this), category: "fun" }],
    ]);
  }

  async coinFlip(msg) {
    const result = Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!";
    await msg.reply(result);
  }

  async rollDice(msg) {
    const result = Math.floor(Math.random() * 6) + 1;
    await msg.reply(`🎲 Kamu dapet: ${result}`);
  }
}
```

**2.** Register di `src/handlers/CommandHandler.js`:

```js
// Tambah import di atas
import FunCommand from "../commands/FunCommand.js";

// Tambah di array modules dalam #registerAll()
const modules = [
  new GeneralCommand(this.bot),
  new MakerCommand(this.bot),
  // ... module lain
  new FunCommand(this.bot), // ← tambahkan di sini
];
```

Selesai. Semua command dari `FunCommand` langsung aktif.

### Pola handler

Setiap handler menerima 2 parameter:

```js
async namaCommand(msg, { args, text, command }) {
  // msg        → object Message (lihat src/utils/serializer.js)
  // args       → array kata setelah command, e.g. ["hello", "world"]
  // text       → string gabungan args, e.g. "hello world"
  // command    → string nama command yang dipanggil

  // ─── Akses bot ───
  this.bot.sock          // baileys socket
  this.bot.db            // database (SQLite)
  this.bot.config        // config dari .env
  this.bot.isCreator(jid)// cek owner

  // ─── Reply ───
  await msg.reply("teks");
  await msg.sendImage(buffer, "caption");
  await msg.sendVideo(buffer, "caption");
  await msg.sendAudio(buffer, true);  // true = voice note
  await msg.sendSticker(buffer);

  // ─── Media dari quoted ───
  if (msg.quoted) {
    const media = await msg.quoted.download();
    // media = Buffer
  }

  // ─── Throw untuk error message ───
  if (!text) throw "Masukkan teks!";
  if (!msg.isGroup) throw this.bot.config.messages.group;
}
```

---

## Tech Stack

| Komponen | Library                                 |
| -------- | --------------------------------------- |
| WhatsApp | `@whiskeysockets/baileys` v7 RC         |
| Store    | `@rodrigogs/baileys-store` v2           |
| Database | `sql.js` (pure JS SQLite)               |
| Sticker  | `jimp`, `node-webpmux`, `fluent-ffmpeg` |
| HTTP     | `axios`                                 |
| Scraping | `cheerio`                               |

## Requirements

- Node.js 20+
- FFmpeg (untuk sticker video)

## License

ISC © ahmuq
