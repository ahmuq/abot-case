import { areJidsSameUser, jidNormalizedUser } from "@whiskeysockets/baileys";
import { jsonformat } from "../utils/helpers.js";

export default class GroupCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["promote", { handler: this.promote.bind(this), category: "group" }],
      ["demote", { handler: this.demote.bind(this), category: "group" }],
      ["leave", { handler: this.leave.bind(this), category: "group" }],
      ["kick", { handler: this.kick.bind(this), category: "group" }],
      ["k", { handler: this.kick.bind(this), category: "group" }],
      ["hidetag", { handler: this.hidetag.bind(this), category: "group" }],
      ["tag", { handler: this.hidetag.bind(this), category: "group" }],
      ["h", { handler: this.hidetag.bind(this), category: "group" }],
      ["tagall", { handler: this.tagAll.bind(this), category: "group" }],
      ["gc", { handler: this.groupSetting.bind(this), category: "group" }],
      ["group", { handler: this.groupSetting.bind(this), category: "group" }],
      ["c", { handler: this.closeGroup.bind(this), category: "group" }],
      ["linkgroup", { handler: this.linkGroup.bind(this), category: "group" }],
      ["linkgc", { handler: this.linkGroup.bind(this), category: "group" }],
      ["lgc", { handler: this.linkGroup.bind(this), category: "group" }],
    ]);
  }

  async #getGroupContext(msg) {
    if (!msg.isGroup) throw this.bot.config.messages.group;

    const botNumber = this.bot.decodeJid(this.bot.sock.user.id);
    const metadata = await this.bot.sock.groupMetadata(msg.chat);
    const participants = metadata.participants;
    const admins = participants
      .filter((v) => v.admin !== null)
      .map((v) => v.id);
    const isBotAdmin = admins.some((a) => areJidsSameUser(a, botNumber));
    const isAdmin = admins.some((a) => areJidsSameUser(a, msg.sender));

    return { metadata, participants, admins, isBotAdmin, isAdmin, botNumber };
  }

  #getTargetUsers(msg, { text }) {
    return msg.mentionedJid?.[0]
      ? msg.mentionedJid
      : msg.quoted
        ? [msg.quoted.sender]
        : text
          ? [jidNormalizedUser(text.replace(/[^0-9]/g, "") + "@s.whatsapp.net")]
          : [];
  }

  async promote(msg, opts) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isBotAdmin) throw this.bot.config.messages.botAdmin;
    if (!ctx.isAdmin) throw this.bot.config.messages.admin;

    const users = this.#getTargetUsers(msg, opts);
    if (!users.length) throw "Tag atau reply user yang ingin di-promote";

    const res = await this.bot.sock.groupParticipantsUpdate(
      msg.chat,
      users,
      "promote",
    );
    await msg.reply(jsonformat(res));
  }

  async demote(msg, opts) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isBotAdmin) throw this.bot.config.messages.botAdmin;
    if (!ctx.isAdmin) throw this.bot.config.messages.admin;

    const users = this.#getTargetUsers(msg, opts);
    if (!users.length) throw "Tag atau reply user yang ingin di-demote";

    const res = await this.bot.sock.groupParticipantsUpdate(
      msg.chat,
      users,
      "demote",
    );
    await msg.reply(jsonformat(res));
  }

  async leave(msg) {
    if (!this.bot.isCreator(msg.sender)) throw this.bot.config.messages.owner;
    const res = await this.bot.sock.groupLeave(msg.chat);
    await msg.reply(jsonformat(res));
  }

  async kick(msg, opts) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isAdmin) throw "Perintah ini hanya bisa digunakan oleh Admin Grup";

    const users = this.#getTargetUsers(msg, opts);
    if (!users.length) throw "Tag atau reply user yang ingin di-kick";

    await msg.reply("Otw kick...");
    const res = await this.bot.sock.groupParticipantsUpdate(
      msg.chat,
      users,
      "remove",
    );
    await msg.reply(jsonformat(res));
  }

  async hidetag(msg, { text }) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isAdmin && !this.bot.isCreator(msg.sender)) {
      throw "Perintah ini hanya bisa digunakan oleh Admin Grup";
    }

    await this.bot.sock.sendMessage(msg.chat, {
      text: text || "",
      mentions: ctx.participants.map((p) => p.id),
    });
  }

  async tagAll(msg, { text }) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isAdmin && !this.bot.isCreator(msg.sender)) {
      throw this.bot.config.messages.admin;
    }
    if (!text) throw "Teks?";

    let teksTall = `══✪〘 *😎 Tag All* 〙✪══\n\n${text}\n\n`;
    for (const mem of ctx.participants) {
      teksTall += `⚘ @${mem.id.split("@")[0]}\n`;
    }

    await this.bot.sock.sendMessage(msg.chat, {
      text: teksTall,
      mentions: ctx.participants.map((p) => p.id),
    });
  }

  async closeGroup(msg) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isAdmin) throw "Perintah ini hanya bisa digunakan oleh Admin Grup";

    await this.bot.sock.groupSettingUpdate(msg.chat, "announcement");
    await msg.reply("Sukses menutup grup");
  }

  async groupSetting(msg, { args }) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isAdmin) throw "Perintah ini hanya bisa digunakan oleh Admin Grup";

    if (!args[0])
      throw "Kirim perintah !gc o/c\nContoh : !gc c (close) atau !gc o (open)";

    if (args[0] === "c") {
      await this.bot.sock.groupSettingUpdate(msg.chat, "announcement");
      await msg.reply(
        "Sukses mengizinkan hanya admin yang dapat mengirim pesan",
      );
    } else if (args[0] === "o") {
      await this.bot.sock.groupSettingUpdate(msg.chat, "not_announcement");
      await msg.reply("Sukses mengizinkan semua peserta dapat mengirim pesan");
    } else {
      throw "Kirim perintah !gc o/c\nContoh : !gc c (close) atau !gc o (open)";
    }
  }

  async linkGroup(msg) {
    const ctx = await this.#getGroupContext(msg);
    if (!ctx.isBotAdmin) throw this.bot.config.messages.botAdmin;

    const code = await this.bot.sock.groupInviteCode(msg.chat);
    await this.bot.sock.sendMessage(
      msg.chat,
      {
        text: `https://chat.whatsapp.com/${code}\n\nLink Group : ${ctx.metadata.subject}`,
      },
      { quoted: msg.raw },
    );
  }
}
