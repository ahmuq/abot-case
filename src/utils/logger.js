import chalk from "chalk";

export default class Logger {
  static info(message) {
    console.log(chalk.blue("[INFO]"), message);
  }

  static success(message) {
    console.log(chalk.green("[✓]"), message);
  }

  static warn(message) {
    console.log(chalk.yellow("[WARN]"), message);
  }

  static error(message, err = null) {
    console.error(chalk.red("[ERROR]"), message);
    if (err) console.error(err);
  }

  static cmd({ command, pushname, isGroup }) {
    const tag = chalk.bold.green("[CMD]");
    const cmd = chalk.cyan(command);
    const name = chalk.yellow(pushname);
    const type = isGroup ? chalk.magenta("Group") : chalk.blue("Private");
    console.log(`${tag} ${cmd} dari ${name} di ${type}`);
  }

  static connection(message) {
    console.log(chalk.bold.green("[CONN]"), message);
  }
}
