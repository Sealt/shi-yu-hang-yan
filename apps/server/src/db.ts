import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function resolveDbPath() {
  if (process.env.DATABASE_PATH) {
    return path.isAbsolute(process.env.DATABASE_PATH)
      ? process.env.DATABASE_PATH
      : path.resolve(process.cwd(), process.env.DATABASE_PATH)
  }
  return path.resolve(__dirname, '../data/hangyan.db')
}

let db: Database.Database | null = null

export function getDb() {
  if (db) return db

  const dbPath = resolveDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initSchema(db)
  return db
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'takeout' CHECK(type IN ('takeout', 'dine_in')),
      restaurant_name TEXT NOT NULL,
      rating TEXT NOT NULL CHECK(rating IN ('好吃', '难吃')),
      content TEXT NOT NULL,
      agree_count INTEGER NOT NULL DEFAULT 0,
      disagree_count INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      voter_id TEXT NOT NULL,
      vote_type TEXT NOT NULL CHECK(vote_type IN ('agree', 'disagree')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
      UNIQUE(review_id, voter_id)
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      first_visit_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      last_visit_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      visit_count INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS online_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL UNIQUE,
      last_activity TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS site_stats (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      total_visitors INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      expires_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO site_stats (id, total_visitors) VALUES (1, 0);

    CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(type);
    CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(is_visible, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_comments_review ON comments(review_id);
    CREATE INDEX IF NOT EXISTS idx_votes_review ON votes(review_id);
  `)
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
