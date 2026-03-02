import {
  downloadContentFromMessage,
  getContentType,
  jidDecode,
  proto,
} from "@whiskeysockets/baileys";

/**
 * Class Message - membungkus pesan mentah dari baileys
 * jadi object yang lebih mudah digunakan
 */
export default class Message {
  /**
   * @param {import('../BagahBot.js').default} bot
   * @param {object} raw - Raw message dari baileys
   * @param {object} store - In-memory store
   */
  constructor(bot, raw, store) {
    this.bot = bot;
    this.raw = raw;
    this.store = store;
    this.#parse();
  }

  /* ───────── Parsing ───────── */

  #parse() {
    const msg = this.raw;

    // Key info
    this.id = msg.key.id;
    this.chat = msg.key.remoteJid;
    this.fromMe = msg.key.fromMe;
    this.isGroup = this.chat?.endsWith("@g.us") || false;
    this.isBaileys = this.id?.startsWith("BAE5") && this.id?.length === 16;
    this.pushName = msg.pushName || "No Name";

    // Sender
    this.sender = this.#decodeJid(
      (this.fromMe && this.bot.sock.user?.id) ||
        msg.participant ||
        msg.key.participant ||
        this.chat ||
        "",
    );
    if (this.isGroup) {
      this.participant = this.#decodeJid(msg.key.participant) || "";
    }

    // Message content
    if (!msg.message) return;

    // Handle ephemeral wrapper
    const message =
      Object.keys(msg.message)[0] === "ephemeralMessage"
        ? msg.message.ephemeralMessage.message
        : msg.message;

    this.mtype = getContentType(message);
    this.msg =
      this.mtype === "viewOnceMessage"
        ? message[this.mtype].message[
            getContentType(message[this.mtype].message)
          ]
        : message[this.mtype];

    // Body text
    this.body =
      message.conversation ||
      this.msg?.caption ||
      this.msg?.text ||
      (this.mtype === "listResponseMessage" &&
        this.msg?.singleSelectReply?.selectedRowId) ||
      (this.mtype === "buttonsResponseMessage" && this.msg?.selectedButtonId) ||
      "";

    this.text =
      this.msg?.text ||
      this.msg?.caption ||
      message.conversation ||
      this.msg?.contentText ||
      this.msg?.selectedDisplayText ||
      this.msg?.title ||
      "";

    // Mentions
    this.mentionedJid = this.msg?.contextInfo?.mentionedJid || [];

    // Quoted message
    this.#parseQuoted(message);

    // Media download shortcut
    if (this.msg?.url) {
      this.download = () => this.#downloadMedia(this.msg);
    }
  }

  #parseQuoted(message) {
    const M = proto.WebMessageInfo;
    const contextInfo = this.msg?.contextInfo;
    if (!contextInfo?.quotedMessage) {
      this.quoted = null;
      return;
    }

    let quoted = contextInfo.quotedMessage;
    let type = getContentType(quoted);
    let qMsg = quoted[type];

    if (["productMessage"].includes(type)) {
      type = getContentType(qMsg);
      qMsg = qMsg[type];
    }

    if (typeof qMsg === "string") qMsg = { text: qMsg };

    this.quoted = {
      ...qMsg,
      mtype: type,
      id: contextInfo.stanzaId,
      chat: contextInfo.remoteJid || this.chat,
      isBaileys:
        contextInfo.stanzaId?.startsWith("BAE5") &&
        contextInfo.stanzaId?.length === 16,
      sender: this.#decodeJid(contextInfo.participant),
      fromMe: contextInfo.participant === this.bot.sock.user?.id,
      text:
        qMsg?.text ||
        qMsg?.caption ||
        qMsg?.conversation ||
        qMsg?.selectedDisplayText ||
        "",
      mentionedJid: contextInfo.mentionedJid || [],
      msg: qMsg,

      delete: () => {
        const fakeMsg = M.create({
          key: {
            remoteJid: this.quoted.chat,
            fromMe: this.quoted.fromMe,
            id: this.quoted.id,
          },
          message: quoted,
          ...(this.isGroup ? { participant: this.quoted.sender } : {}),
        });
        return this.bot.sock.sendMessage(this.quoted.chat, {
          delete: fakeMsg.key,
        });
      },

      download: () => this.#downloadMedia(qMsg),
    };
  }

  /* ───────── Helpers ───────── */

  #decodeJid(jid) {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && `${decode.user}@${decode.server}`) ||
        jid
      );
    }
    return jid;
  }

  async #downloadMedia(msg) {
    const mime = (msg || this.msg)?.mimetype || "";
    const type = this.mtype
      ? this.mtype.replace(/Message/gi, "")
      : mime.split("/")[0];
    const stream = await downloadContentFromMessage(msg || this.msg, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  }

  /* ───────── Convenience Methods ───────── */

  /** Balas pesan dengan teks */
  async reply(text) {
    return this.bot.sock.sendMessage(
      this.chat,
      { text: String(text) },
      { quoted: this.raw },
    );
  }

  /** Kirim teks biasa ke chat ini */
  async send(text) {
    return this.bot.sock.sendMessage(this.chat, { text: String(text) });
  }

  /** Kirim image ke chat ini */
  async sendImage(buffer, caption = "") {
    return this.bot.sock.sendMessage(
      this.chat,
      { image: buffer, caption },
      { quoted: this.raw },
    );
  }

  /** Kirim video ke chat ini */
  async sendVideo(buffer, caption = "") {
    return this.bot.sock.sendMessage(
      this.chat,
      { video: buffer, caption },
      { quoted: this.raw },
    );
  }

  /** Kirim audio ke chat ini */
  async sendAudio(buffer, ptt = false) {
    return this.bot.sock.sendMessage(
      this.chat,
      { audio: buffer, ptt, mimetype: "audio/mpeg" },
      { quoted: this.raw },
    );
  }

  /** Kirim sticker */
  async sendSticker(buffer) {
    return this.bot.sendSticker(this.chat, buffer, this.raw);
  }

  /** Get mime type dari quoted atau message */
  get mime() {
    return (this.quoted?.msg || this.quoted || this.msg)?.mimetype || "";
  }

  /** Check apakah ini media (image/video/sticker/audio) */
  get isMedia() {
    return /image|video|sticker|audio/.test(this.mime);
  }

  /** Shortcut: content string */
  get content() {
    return JSON.stringify(this.raw.message);
  }
}
