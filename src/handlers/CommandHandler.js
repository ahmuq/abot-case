import AiCommand from "../commands/AiCommand.js";
import DownloaderCommand from "../commands/DownloaderCommand.js";
import GeneralCommand from "../commands/GeneralCommand.js";
import GroupCommand from "../commands/GroupCommand.js";
import MakerCommand from "../commands/MakerCommand.js";
import OwnerCommand from "../commands/OwnerCommand.js";
import SearchCommand from "../commands/SearchCommand.js";
import Logger from "../utils/logger.js";

/**
 * CommandHandler - Mengumpulkan & mengarahkan command ke handler yang tepat
 */
export default class CommandHandler {
  /** @param {import('../BagahBot.js').default} bot */
  constructor(bot) {
    this.bot = bot;
    this.commands = new Map();
    this.#registerAll();
  }

  /* ───────── Register Commands ───────── */

  #registerAll() {
    const modules = [
      new GeneralCommand(this.bot),
      new MakerCommand(this.bot),
      new GroupCommand(this.bot),
      new OwnerCommand(this.bot),
      new DownloaderCommand(this.bot),
      new SearchCommand(this.bot),
      new AiCommand(this.bot),
    ];

    for (const mod of modules) {
      for (const [name, cmd] of mod.commands) {
        this.commands.set(name, cmd);
      }
    }

    Logger.info(
      `Loaded ${this.commands.size} commands dari ${modules.length} module`,
    );
  }

  /* ───────── Prefix Detection ───────── */

  #getPrefix(body) {
    if (!body) return null;
    const prefixes = this.bot.config.bot.prefix;

    for (const p of prefixes) {
      if (
        p === "" &&
        /^[°#*+,.?=''():√%!¢£¥€π¤ΠΦ_&`™©®Δ^βα¦|/\\©^]/.test(body)
      ) {
        const match = body.match(
          /^[°#*+,.?=''():√%¢£¥€π¤ΠΦ_&!`™©®Δ^βα¦|/\\©^]/gi,
        );
        return match ? match[0] : null;
      }
      if (p && body.startsWith(p)) return p;
    }

    return null;
  }

  /* ───────── Handle Incoming Message ───────── */

  /**
   * @param {import('../utils/serializer.js').default} msg - Parsed message
   */
  async handle(msg) {
    const body = msg.body || msg.text || "";
    if (!body) return;

    const prefix = this.#getPrefix(body);
    if (prefix === null) {
      // Cek eval command (> ...)
      await this.#handleEval(msg, body);
      return;
    }

    const trimmed = body.slice(prefix.length).trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);
    const text = args.join(" ");

    const command = this.commands.get(cmdName);
    if (!command) return;

    // Log command
    Logger.cmd({
      command: cmdName,
      pushname: msg.pushName,
      isGroup: msg.isGroup,
    });

    try {
      await command.handler(msg, { args, text, prefix, command: cmdName });
    } catch (err) {
      const errMsg =
        typeof err === "string" ? err : err?.message || "Unknown error";
      await msg.reply(errMsg);
    }
  }

  /* ───────── Eval (Owner only) ───────── */

  async #handleEval(msg, body) {
    if (!body.startsWith(">")) return;

    const botNumber = this.bot.decodeJid(this.bot.sock.user.id);
    const isCreator = [botNumber, ...this.bot.config.bot.ownerJid]
      .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
      .includes(msg.sender);

    if (!isCreator) return;

    try {
      let evaled = await eval(body.slice(2));
      if (typeof evaled !== "string") {
        const util = await import("node:util");
        evaled = util.default.inspect(evaled);
      }
      await msg.reply(String(evaled));
    } catch (err) {
      await msg.reply(String(err));
    }
  }
}
