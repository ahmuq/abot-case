import { fetchJson } from "../utils/helpers.js";

export default class DownloaderCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["couple", { handler: this.couple.bind(this), category: "downloader" }],
      ["ttnwm", { handler: this.tiktokNwm.bind(this), category: "downloader" }],
      [
        "tiktok",
        { handler: this.tiktokNwm.bind(this), category: "downloader" },
      ],
      [
        "facebookdl",
        { handler: this.facebook.bind(this), category: "downloader" },
      ],
      ["fbdl", { handler: this.facebook.bind(this), category: "downloader" }],
      [
        "ttmp3",
        { handler: this.tiktokAudio.bind(this), category: "downloader" },
      ],
      ["tt3", { handler: this.tiktokAudio.bind(this), category: "downloader" }],
      [
        "quotesanime",
        { handler: this.quotesAnime.bind(this), category: "downloader" },
      ],
      [
        "quoteanime",
        { handler: this.quotesAnime.bind(this), category: "downloader" },
      ],
    ]);
  }

  #requireUrl(text, example) {
    if (!text) throw `Example : ${example}`;
  }

  async couple(msg) {
    const data = await fetchJson(
      "https://raw.githubusercontent.com/iamriz7/kopel_/main/kopel.json",
    );
    const random = data[Math.floor(Math.random() * data.length)];

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        image: { url: random.male },
        caption: "Couple Male",
      },
      { quoted: msg.raw },
    );

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        image: { url: random.female },
        caption: "Couple Female",
      },
      { quoted: msg.raw },
    );
  }

  async tiktokNwm(msg, { text }) {
    this.#requireUrl(text, "!ttnwm https://vt.tiktok.com/ZSwWCk5o/");
    await msg.reply("Waiting...");

    const json = await fetchJson(
      `https://api.tiklydown.eu.org/api/download?url=${text}`,
    );

    const caption = [
      `⭔ ID : ${json?.id}`,
      `⭔ Title : ${json?.title}`,
      `⭔ Created At : ${json?.created_at}`,
      `⭔ Comment : ${json?.stats?.commentCount}`,
      `⭔ Shared : ${json?.stats?.shareCount}`,
      `⭔ Watched : ${json?.stats?.playCount}`,
      `⭔ Duration : ${json?.video?.durationFormatted}`,
      `⭔ Quality : ${json?.video?.ratio}`,
      `⭔ Audio : ${json?.music?.title} - ${json?.music?.author}`,
    ].join("\n");

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        video: { url: json?.video?.noWatermark },
        caption,
      },
      { quoted: msg.raw },
    );
  }

  async facebook(msg, { text }) {
    this.#requireUrl(text, "!fbdl https://www.facebook.com/...");
    await msg.reply(this.bot.config.messages.wait);

    const result = await this.bot.api.facebookDownload(text);
    if (!result.url) throw "Gagal download video Facebook";

    const caption = [
      result.description ? `⭔ ${result.description}` : "",
      `⭔ Quality : ${result.quality || "Unknown"}`,
    ]
      .filter(Boolean)
      .join("\n");

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        video: { url: result.url },
        caption,
      },
      { quoted: msg.raw },
    );
  }

  async tiktokAudio(msg, { text }) {
    this.#requireUrl(text, "!ttmp3 https://vt.tiktok.com/ZS82urPBa/");
    if (!text.includes("tiktok.com")) throw "Error Link";

    try {
      const json = await fetchJson(
        `https://api.tiklydown.me/api/download?url=${text}`,
      );

      await this.bot.sock.sendMessage(
        msg.chat,
        {
          audio: { url: json?.music?.play_url },
          mimetype: "audio/mp4",
        },
        { quoted: msg.raw },
      );
    } catch {
      throw "Maaf Kak Fitur Sedang Error";
    }
  }

  async quotesAnime(msg) {
    const { quotesAnime: scrapeQuotes } = await import("../lib/scraper.js");
    const data = await scrapeQuotes();
    const result = data[Math.floor(Math.random() * data.length)];

    const text = `~_${result.quotes}_\n\nBy '${result.karakter}', ${result.anime}\n\n- ${result.up_at}`;
    await msg.reply(text);
  }
}
