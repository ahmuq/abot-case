import axios from "axios";
import { buildApiUrl } from "../config/index.js";

/**
 * SearchCommand - Pencarian gambar & data dari berbagai sumber
 */
export default class SearchCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["wikimedia", { handler: this.wikimedia.bind(this), category: "search" }],
      [
        "randomwaifu",
        { handler: this.randomWaifu.bind(this), category: "search" },
      ],
      ["pinterest", { handler: this.pinterest.bind(this), category: "search" }],
      [
        "tiktokstalk",
        { handler: this.tiktokStalk.bind(this), category: "search" },
      ],
    ]);
  }

  /* ───────── Handlers ───────── */

  async wikimedia(msg, { text }) {
    if (!text) throw "Masukkan query pencarian";

    const { wikimedia: scrapeWiki } = await import("../lib/scraper.js");
    const data = await scrapeWiki(text);

    if (!data.length) throw "Tidak ada hasil ditemukan";

    const result = data[Math.floor(Math.random() * data.length)];
    const caption = [
      `⭔ Title : ${result.title}`,
      `⭔ Source : ${result.source}`,
      `⭔ Media URL : ${result.image}`,
    ].join("\n");

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        image: { url: result.image },
        caption,
      },
      { quoted: msg.raw },
    );
  }

  async randomWaifu(msg) {
    const response = await axios.get(
      buildApiUrl("ryzendesu", "api/weebs/sfw-waifu"),
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    );

    if (!response.data?.url) throw "Gagal mengambil gambar waifu";

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        image: { url: response.data.url },
        caption: "Ini dia waifunya banh 🫡",
      },
      { quoted: msg.raw },
    );
  }

  async pinterest(msg, { text }) {
    if (!text) throw "Kata katanya apa abangku?";

    const response = await axios.get(
      buildApiUrl("ryzendesu", "api/search/pinterest", { query: text }),
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );

    const results = response.data;
    if (!results?.length) throw "Tidak ada hasil ditemukan";

    const limit = Math.min(3, results.length);
    for (let i = 0; i < limit; i++) {
      await this.bot.sock.sendMessage(
        msg.chat,
        {
          image: { url: results[i] },
          caption: `Hasil ${i + 1}`,
        },
        { quoted: msg.raw },
      );
    }
  }

  async tiktokStalk(msg, { text }) {
    if (!text) throw "Masukkan username tiktok";

    try {
      const { data } = await axios.get(
        `https://sh.xznsenpai.xyz/api/ttstalk?user=${encodeURIComponent(text)}`,
      );

      const result = [
        "📱 *Tiktok Stalker*\n",
        `Username  : ${data.uniqueId}`,
        `Name      : ${data.nickname}`,
        `Follower  : ${data.followerCount}`,
        `Following : ${data.followingCount}`,
        `Likes     : ${data.heart}`,
        `Videos    : ${data.videoCount}`,
      ].join("\n");

      await msg.reply(result);
    } catch {
      throw "Gagal mengambil data TikTok";
    }
  }
}
