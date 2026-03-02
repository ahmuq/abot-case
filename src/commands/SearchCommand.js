import axios from "axios";

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

    try {
      const { data } = await axios.get(
        `https://sh.xznsenpai.xyz/api/ttstalk?user=${encodeURIComponent(text)}`,
      );

      const result = [
        "📱 *Tiktok Stalker*\n",
        `Username  : ${data.uniqueId}`,
        `Name      : ${data.nickname}`,
        `Follower  : ${data.followerCount}`,
        `Following : ${data.followingCount}`,
        `Likes     : ${data.heart}`,
        `Videos    : ${data.videoCount}`,
      ].join("\n");

      await msg.reply(result);
    } catch {
      throw "Gagal mengambil data TikTok";
    }
  }
}
