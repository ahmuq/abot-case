import { Jimp } from "jimp";

export default class OwnerCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["soff", { handler: this.selfOff.bind(this), category: "owner" }],
      ["son", { handler: this.selfOn.bind(this), category: "owner" }],
      [
        "setppbot",
        { handler: this.setProfilePic.bind(this), category: "owner" },
      ],
      ["addprem", { handler: this.addPremium.bind(this), category: "owner" }],
      ["delprem", { handler: this.delPremium.bind(this), category: "owner" }],
      ["listprem", { handler: this.listPremium.bind(this), category: "owner" }],
    ]);
  }

  #requireOwner(msg) {
    if (!this.bot.isCreator(msg.sender)) throw this.bot.config.messages.owner;
  }

  async selfOff(msg) {
    this.#requireOwner(msg);
    this.bot.isPublic = true;
    await msg.reply("```Sukses Mematikan Mode Seleb (Public Mode)```");
  }

  async selfOn(msg) {
    this.#requireOwner(msg);
    this.bot.isPublic = false;
    await msg.reply("```Sukses Aktifkan Mode Seleb (Self Mode)```");
  }

  async setProfilePic(msg) {
    this.#requireOwner(msg);

    if (!msg.quoted) throw "Kirim/Reply Image Dengan Caption !setppbot";
    if (!/image/.test(msg.mime))
      throw "Kirim/Reply Image Dengan Caption !setppbot";
    if (/webp/.test(msg.mime))
      throw "Kirim/Reply Image (bukan sticker) Dengan Caption !setppbot";

    const media = await msg.quoted.download();
    const botNumber = this.bot.decodeJid(this.bot.sock.user.id);

    const jimp = await Jimp.read(media);
    const resized =
      jimp.width > jimp.height
        ? jimp.resize({ w: 550 })
        : jimp.resize({ h: 650 });
    const img = await resized.getBuffer("image/jpeg");

    await this.bot.sock.updateProfilePicture(botNumber, img);
    await msg.reply("Sukses mengubah foto profil bot!");
  }

  async addPremium(msg, { text }) {
    this.#requireOwner(msg);
    if (!text)
      throw `Penggunaan !addprem nomor\nContoh: !addprem 6285775869360`;

    const number = text.split("|")[0].replace(/[^0-9]/g, "");
    const jid = number + "@s.whatsapp.net";

    const exists = await this.bot.sock.onWhatsApp(jid);
    if (!exists?.length)
      throw "Masukkan Nomor Yang Valid Dan Terdaftar Di WhatsApp!";

    this.bot.db.setPremium(jid, true);
    this.bot.db.addOwner(jid);
    await msg.reply(`Nomor ${number} Sudah Terdaftar Ke Premium!`);
  }

  async delPremium(msg, { text }) {
    this.#requireOwner(msg);
    if (!text)
      throw `Penggunaan !delprem nomor\nContoh: !delprem 6285775869360`;

    const number = text.split("|")[0].replace(/[^0-9]/g, "");
    const jid = number + "@s.whatsapp.net";

    this.bot.db.setPremium(jid, false);
    this.bot.db.removeOwner(jid);
    await msg.reply(`Nomor ${number} Telah Di Hapus Dari Daftar Premium!`);
  }

  async listPremium(msg) {
    this.#requireOwner(msg);

    const premiums = this.bot.db.getAllPremium();
    if (!premiums.length) return msg.reply("Belum ada user premium");

    let text = "*List Premium Users*\n\n";
    for (const user of premiums) {
      const num = user.jid.replace("@s.whatsapp.net", "");
      text += `- ${num} ${user.name ? `(${user.name})` : ""}\n`;
    }
    text += `\n*Total : ${premiums.length}*`;

    await msg.reply(text);
  }
}
