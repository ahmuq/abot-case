import { Jimp } from "jimp";
import { getBuffer } from "../utils/helpers.js";
import Logger from "../utils/logger.js";

/**
 * GroupHandler - Menangani event group (join, leave, dll)
 */
export default class GroupHandler {
  /** @param {import('../BagahBot.js').default} bot */
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Handle group participants update
   */
  async handle(event) {
    try {
      const metadata = await this.bot.sock.groupMetadata(event.id);
      const member = event.participants[0];
      const profilePic = await this.#getProfilePic(member, event.id);

      if (event.action === "add") {
        await this.#handleJoin(event, metadata, member, profilePic);
      } else if (event.action === "remove") {
        await this.#handleLeave(event, metadata, member, profilePic);
      }
    } catch (err) {
      Logger.error("Group handler error:", err);
    }
  }

  /* ───────── Join ───────── */

  async #handleJoin(event, metadata, member, pic) {
    const username = `@${member.split("@")[0]}`;
    const text = [
      `Halo Kak ${username}`,
      `*Selamat Datang Di Grup*`,
      `*${metadata.subject}*`,
      `Semoga Betah DiGroup`,
      metadata.desc ? `*Deskripsi : ${metadata.desc}*` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const thumbnail = await this.#resizeImage(pic, 250, 250);

    await this.bot.sock.sendMessage(event.id, {
      text,
      mentions: [member],
      contextInfo: {
        externalAdReply: {
          title: "Welcome!",
          thumbnailUrl: "",
          mediaType: 1,
        },
      },
    });
  }

  /* ───────── Leave ───────── */

  async #handleLeave(event, metadata, member, pic) {
    const text = [
      `Selamat Tinggal Kak @${member.split("@")[0]}`,
      `*Semoga Sukses Di Luar Sana*`,
      `_~Admin ${metadata.subject}_`,
    ].join("\n");

    await this.bot.sock.sendMessage(event.id, {
      text,
      mentions: [member],
    });
  }

  /* ───────── Helpers ───────── */

  async #getProfilePic(jid, fallbackJid) {
    try {
      const url = await this.bot.sock.profilePictureUrl(jid, "image");
      return await getBuffer(url);
    } catch {
      try {
        const url = await this.bot.sock.profilePictureUrl(fallbackJid, "image");
        return await getBuffer(url);
      } catch {
        return null;
      }
    }
  }

  async #resizeImage(buffer, w, h) {
    if (!buffer) return null;
    const img = await Jimp.read(buffer);
    const resized = img.resize({ w, h });
    return resized.getBuffer("image/jpeg");
  }
}
