import {
  formatDate,
  formatTime,
  getGreeting,
  runtime,
} from "../utils/helpers.js";

/**
 * GeneralCommand - Command umum (menu, runtime, dsb)
 */
export default class GeneralCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["runtime", { handler: this.runtime.bind(this), category: "general" }],
      ["menu", { handler: this.menu.bind(this), category: "general" }],
      ["allmenu", { handler: this.menu.bind(this), category: "general" }],
      [
        "groupmenu",
        { handler: this.groupMenu.bind(this), category: "general" },
      ],
    ]);
  }

  /* ───────── Handlers ───────── */

  async runtime(msg) {
    await msg.reply(`BOT AKTIF SELAMA : ${runtime(process.uptime())}`);
  }

  async menu(msg) {
    const greeting = getGreeting();
    const time = formatTime();
    const date = formatDate();
    const uptime = runtime(process.uptime());

    const text = `${greeting} ${msg.pushName}

╭──「 *INFO BOT* 」
│ 🕓 Waktu : ${time} WIB
│ 🗓️ Tanggal : ${date}
│ ⏱️ Runtime : ${uptime}
╰────────────

╭──「 *MAIN MENU* 」
│ ⿻ !runtime
│ ⿻ !menu
│ ⿻ !allmenu
│ ⿻ !groupmenu
╰────────────

╭──「 *AI MENU* 」
│ ⿻ !ai
│ ⿻ !gemini
│ ⿻ !remini
│ ⿻ !blackbox
╰────────────

╭──「 *MAKER MENU* 」
│ ⿻ !toimg
│ ⿻ !tts
│ ⿻ !tourl
│ ⿻ !sticker / !s / !sgif
╰────────────

╭──「 *GROUP MENU* 」
│ ⿻ !gc o/c
│ ⿻ !promote / !demote
│ ⿻ !kick / !k
│ ⿻ !hidetag / !tag
│ ⿻ !tagall
│ ⿻ !lgc
│ ⿻ !antilink
╰────────────

╭──「 *OWNER MENU* 」
│ ⿻ !soff / !son
│ ⿻ !setppbot
│ ⿻ !addprem / !delprem
│ ⿻ !listprem
╰────────────

╭──「 *DOWNLOADER MENU* 」
│ ⿻ !ytmp3 / !ytmp4
│ ⿻ !ttnwm / !ttmp3
│ ⿻ !igdl
│ ⿻ !fbdl
│ ⿻ !twtdl
│ ⿻ !couple
╰────────────

╭──「 *SEARCH MENU* 」
│ ⿻ !wikimedia
│ ⿻ !pinterest
│ ⿻ !tiktokstalk
│ ⿻ !randomwaifu
│ ⿻ !quotesanime
╰────────────

_© Bagah Bot v2.0.0_`;

    await this.bot.sock.sendMessage(msg.chat, { text }, { quoted: msg.raw });
  }

  async groupMenu(msg) {
    const uptime = runtime(process.uptime());

    const text = `Halo ${msg.pushName}

╭──「 *GROUP MENU* 」
│ ⿻ !gc o/c
│ ⿻ !promote / !demote
│ ⿻ !kick / !k
│ ⿻ !add 628xx
│ ⿻ !hidetag / !tag
│ ⿻ !tagall
│ ⿻ !lgc
│ ⿻ !sticker / !s
│ ⿻ !toimg
╰────────────

Runtime: ${uptime}
_© Bagah Bot v2.0.0_`;

    await this.bot.sock.sendMessage(msg.chat, { text }, { quoted: msg.raw });
  }
}
