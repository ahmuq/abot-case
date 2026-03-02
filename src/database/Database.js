import fs from "node:fs";
import initSqlJs from "sql.js";

export default class Database {
  constructor(dbPath = "database.db") {
    this.dbPath = dbPath;
    this.db = null;
    this._ready = this.#init();
  }

  async #init() {
    const SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.#initTables();
    this.save();
  }

  async ready() {
    await this._ready;
  }

  #initTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        jid        TEXT PRIMARY KEY,
        name       TEXT,
        premium    INTEGER DEFAULT 0,
        banned     INTEGER DEFAULT 0,
        saldo      INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        jid        TEXT PRIMARY KEY,
        name       TEXT,
        antilink   INTEGER DEFAULT 0,
        welcome    INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    this.db.run(`CREATE TABLE IF NOT EXISTS owners ( jid TEXT PRIMARY KEY )`);
    this.db.run(
      `CREATE TABLE IF NOT EXISTS settings ( key TEXT PRIMARY KEY, value TEXT )`,
    );
    this.db.run(
      `CREATE TABLE IF NOT EXISTS kv_store ( key TEXT PRIMARY KEY, value TEXT )`,
    );
  }

  save() {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  #getOne(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    let result = null;
    if (stmt.step()) result = stmt.getAsObject();
    stmt.free();
    return result;
  }

  #getAll(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  #run(sql, params = []) {
    this.db.run(sql, params);
    this.save();
  }

  getUser(jid) {
    return this.#getOne("SELECT * FROM users WHERE jid = ?", [jid]);
  }

  upsertUser(jid, data = {}) {
    const existing = this.getUser(jid);
    if (existing) {
      const fields = Object.keys(data);
      if (!fields.length) return;
      const sets = fields.map((k) => `${k} = ?`).join(", ");
      const vals = fields.map((k) => data[k]);
      this.#run(`UPDATE users SET ${sets} WHERE jid = ?`, [...vals, jid]);
    } else {
      const merged = {
        jid,
        name: null,
        premium: 0,
        banned: 0,
        saldo: 0,
        ...data,
      };
      this.#run(
        "INSERT INTO users (jid, name, premium, banned, saldo) VALUES (?, ?, ?, ?, ?)",
        [merged.jid, merged.name, merged.premium, merged.banned, merged.saldo],
      );
    }
  }

  isPremium(jid) {
    const row = this.getUser(jid);
    return row?.premium === 1;
  }

  setPremium(jid, status = true) {
    this.upsertUser(jid, { premium: status ? 1 : 0 });
  }

  getAllPremium() {
    return this.#getAll("SELECT * FROM users WHERE premium = 1");
  }

  getGroup(jid) {
    return this.#getOne("SELECT * FROM groups WHERE jid = ?", [jid]);
  }

  upsertGroup(jid, data = {}) {
    const existing = this.getGroup(jid);
    if (existing) {
      const fields = Object.keys(data);
      if (!fields.length) return;
      const sets = fields.map((k) => `${k} = ?`).join(", ");
      const vals = fields.map((k) => data[k]);
      this.#run(`UPDATE groups SET ${sets} WHERE jid = ?`, [...vals, jid]);
    } else {
      const merged = { jid, name: null, antilink: 0, welcome: 1, ...data };
      this.#run(
        "INSERT INTO groups (jid, name, antilink, welcome) VALUES (?, ?, ?, ?)",
        [merged.jid, merged.name, merged.antilink, merged.welcome],
      );
    }
  }

  isAntilink(jid) {
    const row = this.getGroup(jid);
    return row?.antilink === 1;
  }

  getOwners() {
    return this.#getAll("SELECT jid FROM owners").map((r) => r.jid);
  }

  addOwner(jid) {
    this.#run("INSERT OR IGNORE INTO owners (jid) VALUES (?)", [jid]);
  }

  removeOwner(jid) {
    this.#run("DELETE FROM owners WHERE jid = ?", [jid]);
  }

  isOwner(jid) {
    return !!this.#getOne("SELECT 1 FROM owners WHERE jid = ?", [jid]);
  }

  getSetting(key) {
    const row = this.#getOne("SELECT value FROM settings WHERE key = ?", [key]);
    return row ? JSON.parse(row.value) : null;
  }

  setSetting(key, value) {
    this.#run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [
      key,
      JSON.stringify(value),
    ]);
  }

  getKV(key) {
    const row = this.#getOne("SELECT value FROM kv_store WHERE key = ?", [key]);
    return row ? JSON.parse(row.value) : null;
  }

  setKV(key, value) {
    this.#run("INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)", [
      key,
      JSON.stringify(value),
    ]);
  }

  deleteKV(key) {
    this.#run("DELETE FROM kv_store WHERE key = ?", [key]);
  }

  close() {
    this.save();
    this.db.close();
  }
}
