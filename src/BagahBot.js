import { makeInMemoryStore } from "@rodrigogs/baileys-store";
import makeWASocket, {
  DisconnectReason,
  areJidsSameUser,
  delay,
  fetchLatestBaileysVersion,
  isPnUser,
  jidNormalizedUser,
} from "@whiskeysockets/baileys";
import { fileTypeFromBuffer } from "file-type";
import pino from "pino";

import config from "./config/index.js";
import { useSQLiteAuthState } from "./database/AuthState.js";
import Database from "./database/Database.js";
import CommandHandler from "./handlers/CommandHandler.js";
import GroupHandler from "./handlers/GroupHandler.js";
import BagahAPI from "./lib/BagahAPI.js";
import Exif from "./lib/Exif.js";
import { getBuffer } from "./utils/helpers.js";
import Logger from "./utils/logger.js";
import Message from "./utils/serializer.js";

export default class BagahBot {
  constructor() {
    this.sock = null;
    this.store = null;
    this.db = new Database("database.db");
    this.config = config;
    this.exif = new Exif();
    this.api = new BagahAPI(config.api.baseUrl, config.api.key);
    this.isPublic = config.bot.public;

    this.commandHandler = null;
    this.groupHandler = null;
    this.saveCreds = null;
  }

  async start() {
    Logger.info("Memulai Bagah Bot v2.0.0...");

    await this.db.ready();
    Logger.info("Database siap (database.db)");

    const logger = pino({ level: "silent" });
    this.store = makeInMemoryStore({});

    const { state, saveCreds } = await useSQLiteAuthState("session.db");
    this.saveCreds = saveCreds;

    const { version } = await fetchLatestBaileysVersion();
    Logger.info(`Baileys version: ${version.join(".")}`);

    const usePairing =
      this.config.pairing.enabled && this.config.pairing.number;
    this.sock = makeWASocket({
      logger,
      printQRInTerminal: !usePairing,
      browser: ["Mac OS", "Safari", "10.15.7"],
      auth: state,
      version,
    });

    this.store.bind(this.sock.ev);

    this.commandHandler = new CommandHandler(this);
    this.groupHandler = new GroupHandler(this);

    this.#bindEvents();

    await this.#handlePairing(usePairing);

    Logger.info("Menunggu koneksi...");
  }

  #bindEvents() {
    this.sock.ev.on("connection.update", (update) => {
      this.#onConnectionUpdate(update);
    });

    this.sock.ev.on("creds.update", this.saveCreds);

    this.sock.ev.on("messages.upsert", (chatUpdate) => {
      this.#onMessage(chatUpdate);
    });

    this.sock.ev.process(async (events) => {
      if (events["messages.upsert"]) {
        await this.#onAutoReadStatus(events["messages.upsert"]);
      }
      if (events["creds.update"]) {
        await this.saveCreds();
      }
    });

    this.sock.ev.on("group-participants.update", (event) => {
      this.groupHandler.handle(event);
    });

    this.sock.ev.on("contacts.update", (update) => {
      for (const contact of update) {
        const id = this.decodeJid(contact.id);
        if (this.store?.contacts) {
          this.store.contacts[id] = { id, name: contact.notify };
        }
      }
    });

    this.sock.ev.on("lid-mapping.update", (mapping) => {
      Logger.info(`LID mapping updated: ${JSON.stringify(mapping)}`);
    });
  }

  #onConnectionUpdate(update) {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        Logger.warn("Koneksi terputus, mencoba reconnect...");
        this.start();
      } else {
        Logger.error("Logged out. Hapus session.db lalu jalankan ulang.");
      }
    } else if (connection === "open") {
      const name =
        this.sock.user?.name || this.sock.user?.verifiedName || "WhatsApp Bot";
      Logger.connection(`Terkoneksi sebagai ${name}`);
      Logger.success("Bot siap menerima pesan!");
    }
  }

  async #onMessage(chatUpdate) {
    try {
      for (const raw of chatUpdate.messages) {
        if (!raw.message) continue;

        raw.message =
          Object.keys(raw.message)[0] === "ephemeralMessage"
            ? raw.message.ephemeralMessage.message
            : raw.message;

        if (raw.key?.remoteJid === "status@broadcast") continue;

        if (!this.isPublic && !raw.key.fromMe && chatUpdate.type === "notify")
          continue;

        if (raw.key.id?.length === 16 && raw.key.id?.startsWith("3EB0"))
          continue;

        const msg = new Message(this, raw, this.store);

        await this.#checkAntilink(msg);

        const senderPN = this.#toPnJid(msg.sender);
        if (senderPN?.startsWith("212")) {
          await this.sock.updateBlockStatus(msg.sender, "block");
          continue;
        }

        await this.commandHandler.handle(msg);
      }
    } catch (err) {
      Logger.error("Error handling message:", err);
    }
  }

  async #onAutoReadStatus(upsert) {
    for (const msg of upsert.messages) {
      if (msg.key.remoteJid !== "status@broadcast") continue;
      if (msg.message?.protocolMessage) continue;

      const name = msg.pushName || "Unknown";
      const number = msg.key.participant?.split("@")[0] || "";
      Logger.info(`Lihat status ${name} (${number})`);

      await this.sock.readMessages([msg.key]);
      await delay(1000);
      await this.sock.readMessages([msg.key]);
    }
  }

  async #checkAntilink(msg) {
    if (!msg.isGroup || msg.fromMe) return;

    const text = msg.body || msg.text || "";
    if (!text.includes("https://") && !text.includes("http://")) return;

    const group = this.db.getGroup(msg.chat);
    if (!group?.antilink) return;

    const metadata = await this.sock.groupMetadata(msg.chat);
    const admins = metadata.participants
      .filter((v) => v.admin)
      .map((v) => v.id);
    if (admins.some((a) => areJidsSameUser(a, msg.sender))) return;

    const botJid = this.decodeJid(this.sock.user.id);
    if (!admins.some((a) => areJidsSameUser(a, botJid))) return;

    await this.sock.sendMessage(
      msg.chat,
      {
        text: `*Antilink Group Terdeteksi*\n\nKamu Akan Dikeluarkan Dari Group ${metadata.subject}`,
      },
      { quoted: msg.raw },
    );

    await this.sock.groupParticipantsUpdate(msg.chat, [msg.sender], "remove");
  }

  async #handlePairing(usePairing) {
    if (!usePairing || this.sock.authState.creds.registered) return;

    const phone = String(this.config.pairing.number);
    const customCode = this.config.pairing.customCode || "";

    if (!/^\d{10,15}$/.test(phone)) {
      Logger.error("Invalid number, start with country code (Example: 62xxx)");
      process.exit(1);
    }

    await delay(3000);

    try {
      let validatedCode = null;
      if (customCode) {
        const cleanCode = customCode
          .toString()
          .replace(/[-\s]/g, "")
          .toUpperCase();

        if (/^[A-Z0-9]{8}$/.test(cleanCode)) {
          validatedCode = cleanCode;
          Logger.info(`Using custom pairing code: ${cleanCode}`);
        } else {
          Logger.warn(
            `Invalid custom code (must be 8 alphanumeric chars, got: ${cleanCode}), using random code`,
          );
        }
      }

      let code = await this.sock.requestPairingCode(phone, validatedCode);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      Logger.success(`Your Pairing Code : ${code}`);
    } catch (err) {
      Logger.error("Failed to get pairing code", err);
    }
  }

  decodeJid(jid) {
    if (!jid) return jid;
    return jidNormalizedUser(jid);
  }

  #toPnJid(jid) {
    if (!jid) return null;
    const normalized = jidNormalizedUser(jid);
    if (isPnUser(normalized)) return normalized.split("@")[0];
    try {
      const pn =
        this.sock?.signalRepository?.lidMapping?.getPNForLID(normalized);
      return pn ? pn.split("@")[0] : null;
    } catch {
      return null;
    }
  }

  isCreator(sender) {
    const botNumber = this.decodeJid(this.sock.user.id);
    const ownerList = [botNumber, ...this.config.bot.ownerJid].map((v) =>
      jidNormalizedUser(
        v.includes("@") ? v : v.replace(/[^0-9]/g, "") + "@s.whatsapp.net",
      ),
    );

    if (ownerList.includes(sender)) return true;

    return ownerList.some((owner) => areJidsSameUser(owner, sender));
  }

  async getName(jid) {
    const id = this.decodeJid(jid);

    if (id.endsWith("@g.us")) {
      const v =
        this.store?.contacts?.[id] || (await this.sock.groupMetadata(id)) || {};
      return v.name || v.subject || id;
    }

    if (isPnUser(id) && id.startsWith("0")) return "WhatsApp";
    if (areJidsSameUser(id, this.sock.user.id))
      return this.sock.user?.name || "Bot";

    const contact = this.store?.contacts?.[id] || {};
    return contact.name || contact.verifiedName || id.split("@")[0];
  }

  async sendText(jid, text, quoted) {
    return this.sock.sendMessage(jid, { text }, { quoted });
  }

  async sendImage(jid, path, caption = "", quoted) {
    const buffer = await this.#resolveMedia(path);
    return this.sock.sendMessage(jid, { image: buffer, caption }, { quoted });
  }

  async sendVideo(jid, path, caption = "", quoted, gif = false) {
    const buffer = await this.#resolveMedia(path);
    return this.sock.sendMessage(
      jid,
      { video: buffer, caption, gifPlayback: gif },
      { quoted },
    );
  }

  async sendAudio(jid, path, quoted, ptt = false) {
    const buffer = await this.#resolveMedia(path);
    return this.sock.sendMessage(jid, { audio: buffer, ptt }, { quoted });
  }

  async sendSticker(jid, media, quoted, options = {}) {
    const buffer = await this.#resolveMedia(media);
    const { mime } = (await fileTypeFromBuffer(buffer)) || {
      mime: "application/octet-stream",
    };

    let stickerPath;
    if (/image\/(jpe?g|png|gif)|octet/.test(mime)) {
      stickerPath =
        options.packname || options.author
          ? await this.exif.writeExifImg(buffer, options)
          : await this.exif.imageToWebp(buffer);
    } else if (/video/.test(mime)) {
      stickerPath =
        options.packname || options.author
          ? await this.exif.writeExifVid(buffer, options)
          : await this.exif.videoToWebp(buffer);
    } else if (/webp/.test(mime)) {
      stickerPath = await this.exif.writeExifWebp(buffer, options);
    } else {
      throw new Error(`Unsupported mime type: ${mime}`);
    }

    const stickerData = Buffer.isBuffer(stickerPath)
      ? stickerPath
      : { url: stickerPath };

    await this.sock.sendPresenceUpdate("composing", jid);
    return this.sock.sendMessage(jid, { sticker: stickerData }, { quoted });
  }

  async sendTextWithMentions(jid, text, quoted) {
    return this.sock.sendMessage(
      jid,
      {
        text,
        contextInfo: {
          mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(
            (v) => v[1] + "@s.whatsapp.net",
          ),
        },
      },
      { quoted },
    );
  }

  async #resolveMedia(input) {
    if (Buffer.isBuffer(input)) return input;
    if (typeof input === "object" && input.url) return input;
    if (typeof input === "string") {
      if (/^data:.+;base64,/.test(input)) {
        return Buffer.from(input.split(",")[1], "base64");
      }
      if (/^https?:\/\//.test(input)) {
        return getBuffer(input);
      }
      const fs = await import("node:fs");
      if (fs.existsSync(input)) return fs.readFileSync(input);
    }
    return Buffer.alloc(0);
  }
}
