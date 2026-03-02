import BagahBot from "./src/BagahBot.js";

const bot = new BagahBot();

bot.start().catch((err) => {
  console.error("Fatal error starting bot:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
