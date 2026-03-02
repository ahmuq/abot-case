import { fetchJson } from "../utils/helpers.js";

export default class DownloaderCommand {
  constructor(bot) {
    this.bot = bot;
  }

  get commands() {
    return new Map([
      ["couple", { handler: this.couple.bind(this), category: "downloader" }],
      ["ttnwm", { handler: this.tiktokNwm.bind(this), category: "downloader" }],
      [
        "tiktok",
        { handler: this.tiktokNwm.bind(this), category: "downloader" },
      ],
      [
        "facebookdl",
        { handler: this.facebook.bind(this), category: "downloader" },
      ],
      ["fbdl", { handler: this.facebook.bind(this), category: "downloader" }],
      ["igdl", { handler: this.instagram.bind(this), category: "downloader" }],
      [
        "instadl",
        { handler: this.instagram.bind(this), category: "downloader" },
      ],
      ["igstory", { handler: this.igStory.bind(this), category: "downloader" }],
      [
        "ttmp3",
        { handler: this.tiktokAudio.bind(this), category: "downloader" },
      ],
      ["tt3", { handler: this.tiktokAudio.bind(this), category: "downloader" }],
    ]);
  }

  #requireUrl(text, example) {
    if (!text) throw `Example : ${example}`;
  }

  async couple(msg) {
    const data = await fetchJson(
      "https://raw.githubusercontent.com/iamriz7/kopel_/main/kopel.json",
    );
    const random = data[Math.floor(Math.random() * data.length)];

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        image: { url: random.male },
        caption: "Couple Male",
      },
      { quoted: msg.raw },
    );

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        image: { url: random.female },
        caption: "Couple Female",
      },
      { quoted: msg.raw },
    );
  }

  async tiktokNwm(msg, { text }) {
    this.#requireUrl(text, "!ttnwm https://vt.tiktok.com/ZSwWCk5o/");
    await msg.reply("Waiting...");

    const json = await fetchJson(
      `https://api.tiklydown.eu.org/api/download?url=${text}`,
    );

    const caption = [
      `⭔ ID : ${json?.id}`,
      `⭔ Title : ${json?.title}`,
      `⭔ Created At : ${json?.created_at}`,
      `⭔ Comment : ${json?.stats?.commentCount}`,
      `⭔ Shared : ${json?.stats?.shareCount}`,
      `⭔ Watched : ${json?.stats?.playCount}`,
      `⭔ Duration : ${json?.video?.durationFormatted}`,
      `⭔ Quality : ${json?.video?.ratio}`,
      `⭔ Audio : ${json?.music?.title} - ${json?.music?.author}`,
    ].join("\n");

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        video: { url: json?.video?.noWatermark },
        caption,
      },
      { quoted: msg.raw },
    );
  }

  async facebook(msg, { text }) {
    this.#requireUrl(text, "!fbdl https://www.facebook.com/...");
    await msg.reply(this.bot.config.messages.wait);

    const result = await this.bot.api.facebookDownload(text);
    if (!result.url) throw "Gagal download video Facebook";

    const caption = [
      result.description ? `⭔ ${result.description}` : "",
      `⭔ Quality : ${result.quality || "Unknown"}`,
    ]
      .filter(Boolean)
      .join("\n");

    await this.bot.sock.sendMessage(
      msg.chat,
      {
        video: { url: result.url },
        caption,
      },
      { quoted: msg.raw },
    );
  }

  async instagram(msg, { text }) {
    this.#requireUrl(text, "!igdl https://www.instagram.com/p/xxx");
    await msg.reply(this.bot.config.messages.wait);

    const media = await this.bot.api.instagramDownload(text);

    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      const caption = media.length > 1 ? `Media ${i + 1}/${media.length}` : "";

      if (item.type === "mp4") {
        await this.bot.sock.sendMessage(
          msg.chat,
          { video: { url: item.url }, caption },
          { quoted: msg.raw },
        );
      } else {
        await this.bot.sock.sendMessage(
          msg.chat,
          { image: { url: item.url }, caption },
          { quoted: msg.raw },
        );
      }
    }
  }

  async igStory(msg, { text }) {
    if (!text)
      throw "Masukkan username Instagram\nContoh : !igstory kennyxepher";
    const username = text.replace(/^@/, "");
    await msg.reply(this.bot.config.messages.wait);

    const { user, stories } = await this.bot.api.igStory(username);

    if (!stories.length) throw `Tidak ada story dari @${username}`;

    const profile = [
      `📱 *Instagram Story*\n`,
      `Username  : @${user.username}`,
      `Name      : ${user.fullName}`,
      `Followers : ${user.followers}`,
      `Following : ${user.following}`,
      `Posts     : ${user.posts}`,
      `Stories   : ${stories.length} media`,
    ].join("\n");

    await msg.reply(profile);

    for (let i = 0; i < stories.length; i++) {
      const item = stories[i];
      const caption =
        stories.length > 1 ? `Story ${i + 1}/${stories.length}` : "";

      if (item.type === "video") {
        await this.bot.sock.sendMessage(
          msg.chat,
          { video: { url: item.url }, caption },
          { quoted: msg.raw },
        );
      } else {
        await this.bot.sock.sendMessage(
          msg.chat,
          { image: { url: item.url }, caption },
          { quoted: msg.raw },
        );
      }
    }
  }

  async tiktokAudio(msg, { text }) {
    this.#requireUrl(text, "!ttmp3 https://vt.tiktok.com/ZS82urPBa/");
    if (!text.includes("tiktok.com")) throw "Error Link";

    try {
      const json = await fetchJson(
        `https://api.tiklydown.me/api/download?url=${text}`,
      );

      await this.bot.sock.sendMessage(
        msg.chat,
        {
          audio: { url: json?.music?.play_url },
          mimetype: "audio/mp4",
        },
        { quoted: msg.raw },
      );
    } catch {
      throw "Maaf Kak Fitur Sedang Error";
    }
  }
}
