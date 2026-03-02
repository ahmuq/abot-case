export default class SearchCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      [
        "tiktokstalk",
        { handler: this.tiktokStalk.bind(this), category: "search" },
      ],
    ]);
  }

  async tiktokStalk(msg, { text }) {
    if (!text) throw "Masukkan username tiktok";
    const username = text.replace(/^@/, "");

    const data = await this.bot.api.tiktokStalk(username);

    const result = [
      "📱 *Tiktok Stalker*\n",
      `Username  : @${username}`,
      `Followers : ${data.followers}`,
      `Following : ${data.following}`,
      `Likes     : ${data.likes}`,
    ].join("\n");

    if (data.avatar) {
      await this.bot.sock.sendMessage(
        msg.chat,
        { image: { url: data.avatar }, caption: result },
        { quoted: msg.raw },
      );
    } else {
      await msg.reply(result);
    }
  }
}
