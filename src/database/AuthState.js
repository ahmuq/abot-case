import { makeKeyvAuthState } from "@rodrigogs/baileys-store";
import fs from "node:fs";
import initSqlJs from "sql.js";

/**
 * SQL.js-backed StorageAdapter for @rodrigogs/baileys-store
 *
 * Pure-JS SQLite via WASM — tidak perlu C++ build tools.
 * Menyimpan session baileys ke file .db yang persistent.
 */
class SqlJsStorageAdapter {
  #db;
  #path;
  #ready;

  constructor(dbPath) {
    this.#path = dbPath;
    this.#ready = this.#init();
  }

  async #init() {
    const SQL = await initSqlJs();

    if (fs.existsSync(this.#path)) {
      const buffer = fs.readFileSync(this.#path);
      this.#db = new SQL.Database(buffer);
    } else {
      this.#db = new SQL.Database();
    }

    this.#db.run(`
      CREATE TABLE IF NOT EXISTS kv (
        key   TEXT PRIMARY KEY,
        value TEXT
      )
    `);
    this.#saveToDisk();
  }

  /** Tunggu sampai database siap */
  async ready() {
    await this.#ready;
  }

  #saveToDisk() {
    const data = this.#db.export();
    fs.writeFileSync(this.#path, Buffer.from(data));
  }

  /* ─── StorageAdapter interface ─── */

  async get(key) {
    await this.#ready;
    const stmt = this.#db.prepare("SELECT value FROM kv WHERE key = ?");
    stmt.bind([key]);
    let result;
    if (stmt.step()) {
      result = stmt.getAsObject().value;
    }
    stmt.free();
    return result ?? undefined;
  }

  async set(key, value, _ttl) {
    await this.#ready;
    this.#db.run("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", [
      key,
      value,
    ]);
    this.#saveToDisk();
  }

  async delete(key) {
    await this.#ready;
    this.#db.run("DELETE FROM kv WHERE key = ?", [key]);
    this.#saveToDisk();
    return true;
  }

  async clear() {
    await this.#ready;
    this.#db.run("DELETE FROM kv");
    this.#saveToDisk();
  }
}

/**
 * Buat auth state berbasis SQLite (sql.js) + @rodrigogs/baileys-store
 *
 * Session disimpan di file .db (default: session.db).
 * Menggantikan useMultiFileAuthState (folder-based).
 *
 * @param {string} sessionPath - Path file .db untuk session
 * @returns {Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }>}
 */
export async function useSQLiteAuthState(sessionPath = "session.db") {
  const adapter = new SqlJsStorageAdapter(sessionPath);
  await adapter.ready();
  return makeKeyvAuthState(adapter, "bagah-bot");
}
