const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

let db;

const initialize = async () => {
  db = new Database(DB_PATH);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS decision_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      was_chosen BOOLEAN DEFAULT 0,
      FOREIGN KEY (request_id) REFERENCES decision_requests(id)
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      chosen_option_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES decision_requests(id),
      FOREIGN KEY (chosen_option_id) REFERENCES options(id)
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('Database initialized successfully');
  return Promise.resolve();
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
  return db;
};

const createUser = (username, password) => {
  const stmt = getDb().prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  );
  const passwordHash = bcrypt.hashSync(password, 10);
  return stmt.run(username, passwordHash);
};

const findUserByUsername = (username) => {
  const stmt = getDb().prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
};

const findUserById = (id) => {
  const stmt = getDb().prepare('SELECT id, username, created_at FROM users WHERE id = ?');
  return stmt.get(id);
};

module.exports = {
  initialize,
  getDb,
  createUser,
  findUserByUsername,
  findUserById
};
