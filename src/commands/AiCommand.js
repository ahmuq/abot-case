export default class AiCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([["ai", { handler: this.ai.bind(this), category: "ai" }]]);
  }

  async ai(msg, { text, prefix, command }) {
    if (!text)
      throw `Chattingan dengan AI.\nContoh : ${prefix}${command} tolong berikan motivasi cinta`;

    await msg.reply("Fitur AI belum tersedia untuk saat ini.");
  }
}
