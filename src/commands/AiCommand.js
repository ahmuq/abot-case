import axios from "axios";
import { buildApiUrl } from "../config/index.js";

/**
 * AiCommand - Integrasi AI (OpenAI, Gemini, Blackbox, Remini)
 */
export default class AiCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["ai", { handler: this.ai.bind(this), category: "ai" }],
      ["gemini", { handler: this.gemini.bind(this), category: "ai" }],
      ["blackbox", { handler: this.blackbox.bind(this), category: "ai" }],
      ["remini", { handler: this.remini.bind(this), category: "ai" }],
    ]);
  }

  /* ───────── Helpers ───────── */

  #usageText(prefix, command) {
    return `Chattingan dengan AI.\nContoh : ${prefix}${command} tolong berikan motivasi cinta`;
  }

  /* ───────── Handlers ───────── */

  async ai(msg, { text, prefix, command }) {
    if (!text) throw this.#usageText(prefix, command);

    const res = await fetch(
      buildApiUrl("betabotz", "tools/openai", { q: text }),
    );
    const json = await res.json();

    if (json.status !== 200) throw "AI tidak dapat merespon saat ini";
    await msg.reply(json.result);
  }

  async gemini(msg, { text, prefix, command }) {
    if (!text) throw this.#usageText(prefix, command);

    const response = await axios.get(
      buildApiUrl("ryzendesu", "api/ai/gemini", { text }),
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );

    if (!response.data?.answer) throw "Gemini tidak dapat merespon";
    await msg.reply(response.data.answer);
  }

  async blackbox(msg, { text, prefix, command }) {
    if (!text) throw this.#usageText(prefix, command);

    const response = await axios.get(
      buildApiUrl("ryzendesu", "api/ai/blackbox", {
        chat: text,
        options: "gpt-4o",
      }),
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );

    if (!response.data?.response) throw "Blackbox tidak dapat merespon";
    await msg.reply(response.data.response);
  }

  async remini(msg) {
    if (!/image/.test(msg.mime) || /webp/.test(msg.mime)) {
      throw "Kirim/reply image dengan caption !remini";
    }

    const media = await msg.quoted.download();

    // Upload image dulu untuk dapat URL
    const { bufferToUrl } = await import("../lib/uploader.js");
    const imageUrl = await bufferToUrl(media, "jpg");

    const response = await axios.get(
      buildApiUrl("ryzendesu", "api/ai/remini", {
        url: imageUrl,
        method: "enhance",
      }),
      {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    );

    const buffer = Buffer.from(response.data, "binary");
    await msg.sendImage(buffer, "Enhanced by Remini ✨");
  }
}
