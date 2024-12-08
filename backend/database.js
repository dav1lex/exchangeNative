const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./currency_exchange.db');

// Create tables
db.serialize(() => {
    // Users table
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      balance REAL DEFAULT 0
    )
  `);

    // Transactions table
    db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      currency TEXT,
      amount REAL,
      type TEXT, -- 'buy' or 'sell'
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

    // Holdings table
    db.run(`
    CREATE TABLE IF NOT EXISTS holdings (
        userId INTEGER,
    currency TEXT,
    amount REAL,
    PRIMARY KEY (userId, currency),
    FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);
});

module.exports = db;
