import { exec } from "node:child_process";
import fs from "node:fs";
import { telegraph } from "../lib/uploader.js";
import { getRandom } from "../utils/helpers.js";

/**
 * MakerCommand - Sticker, toimg, tts, dsb
 */
export default class MakerCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["toimage", { handler: this.toImage.bind(this), category: "maker" }],
      ["toimg", { handler: this.toImage.bind(this), category: "maker" }],
      ["tts", { handler: this.tts.bind(this), category: "maker" }],
      ["tourl", { handler: this.toUrl.bind(this), category: "maker" }],
      ["url", { handler: this.toUrl.bind(this), category: "maker" }],
      ["sticker", { handler: this.sticker.bind(this), category: "maker" }],
      ["s", { handler: this.sticker.bind(this), category: "maker" }],
      ["stickergif", { handler: this.sticker.bind(this), category: "maker" }],
      ["sgif", { handler: this.sticker.bind(this), category: "maker" }],
      ["brat", { handler: this.brat.bind(this), category: "maker" }],
      ["sbrat", { handler: this.brat.bind(this), category: "maker" }],
    ]);
  }

  /* ───────── Handlers ───────── */

  async toImage(msg) {
    const quoted = msg.quoted;
    if (!quoted) throw "Reply sticker dengan caption !toimg";
    if (!/webp/.test(msg.mime)) throw "Balas sticker dengan caption *!toimg*";

    const media = await quoted.download();
    const tmpIn = getRandom(".webp");
    const tmpOut = getRandom(".png");

    fs.writeFileSync(tmpIn, media);

    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${tmpIn} ${tmpOut}`, (err) => {
        fs.unlinkSync(tmpIn);
        if (err) return reject(err);
        resolve();
      });
    });

    const buffer = fs.readFileSync(tmpOut);
    await msg.sendImage(buffer);
    fs.unlinkSync(tmpOut);
  }

  async tts(msg, { text }) {
    if (!text) throw `Contoh:\n!tts hallo bro`;

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;
    await msg.sendAudio({ url }, true);
  }

  async toUrl(msg) {
    const quoted = msg.quoted;
    if (!quoted) throw "Kirim/Reply Image dengan caption !tourl";
    if (!/image/.test(msg.mime))
      throw "Kirim/Reply Image dengan caption !tourl";

    await msg.reply(this.bot.config.messages.wait);

    const media = await quoted.download();
    const tmpPath = getRandom(".jpg");
    fs.writeFileSync(tmpPath, media);

    try {
      const url = await telegraph(tmpPath);
      await this.bot.sock.sendMessage(msg.chat, {
        text: `${url}\n\n🖨️ Nih Link Nya`,
      });
    } catch {
      await msg.reply(
        "Mohon Maaf Server Telegraph Sedang Error\nCoba Lagi Nanti",
      );
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  async sticker(msg) {
    const quoted = msg.quoted;
    if (!quoted) throw "Balas Video/Image Dengan Caption !sticker";

    const mime = msg.mime;
    const { packname, author } = this.bot.config.sticker;

    if (/image/.test(mime)) {
      const media = await quoted.download();
      await this.bot.sendSticker(msg.chat, media, msg.raw, {
        packname,
        author,
      });
    } else if (/video/.test(mime)) {
      if ((quoted.msg || quoted).seconds > 11) throw "Maksimal 10 detik!";
      const media = await quoted.download();
      await this.bot.sendSticker(msg.chat, media, msg.raw, {
        packname,
        author,
      });
    } else {
      throw "Kirim Gambar/Video Dengan Caption !sticker\nDurasi Video 1-9 Detik";
    }
  }

  async brat(msg, { text }) {
    if (!text) throw "Kata katanya apa abangku?";

    const { buildApiUrl } = await import("../config/index.js");
    const axios = (await import("axios")).default;

    const response = await axios.get(
      buildApiUrl("ryzendesu", "api/sticker/brat", { text }),
      { responseType: "arraybuffer" },
    );

    const buffer = Buffer.from(response.data, "binary");
    const { packname, author } = this.bot.config.sticker;
    await this.bot.sendSticker(msg.chat, buffer, msg.raw, { packname, author });
  }
}
