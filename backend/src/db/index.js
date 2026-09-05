const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure database directory exists (critical for container mounts e.g. /data)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.warn(`Could not create DB directory ${dbDir}:`, err.message);
  }
}

let dbInstance = null;
let SQL = null;

// Helper to format params for sql.js (converts undefined to null)
function sanitizeParams(params) {
  if (!params) return [];
  if (Array.isArray(params)) {
    return params.map(p => (p === undefined ? null : p));
  }
  if (typeof params === 'object') {
    const sanitized = {};
    for (const [k, v] of Object.entries(params)) {
      sanitized[k.startsWith(':') || k.startsWith('$') || k.startsWith('@') ? k : `:${k}`] = (v === undefined ? null : v);
    }
    return sanitized;
  }
  return [params];
}

let inTransaction = false;

// Persist SQLite database to disk file
function persist() {
  if (!dbInstance || inTransaction) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

async function getDb() {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Auto-migrate users table if older version without email/phone exists
  try {
    const tableInfo = dbInstance.exec("PRAGMA table_info(users);");
    if (tableInfo.length > 0 && tableInfo[0].values) {
      const cols = tableInfo[0].values.map(r => r[1]);
      if (!cols.includes('email')) {
        dbInstance.run("ALTER TABLE users ADD COLUMN email TEXT;");
        dbInstance.run("UPDATE users SET email = username || '@rdms.com' WHERE email IS NULL;");
      }
      if (!cols.includes('phone')) {
        dbInstance.run("ALTER TABLE users ADD COLUMN phone TEXT;");
      }
    }
  } catch (migErr) {
    console.warn('Migration check warning:', migErr.message);
  }

  // Initialize schema if new or tables missing
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  dbInstance.exec(schemaSql);
  persist();

  return dbInstance;
}

// Helper methods mimicking standard SQLite driver
const db = {
  async all(sql, params = []) {
    const instance = await getDb();
    const cleanParams = sanitizeParams(params);
    const stmt = instance.prepare(sql);
    if (Array.isArray(cleanParams)) {
      stmt.bind(cleanParams);
    } else {
      stmt.bind(cleanParams);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  async get(sql, params = []) {
    const rows = await this.all(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async run(sql, params = []) {
    const instance = await getDb();
    const cleanParams = sanitizeParams(params);
    
    // Execute
    instance.run(sql, cleanParams);
    
    // Get last insert rowid and changes
    const rowidRes = instance.exec('SELECT last_insert_rowid() as id, changes() as changes;');
    let lastInsertRowid = null;
    let changes = 0;
    if (rowidRes.length > 0 && rowidRes[0].values.length > 0) {
      lastInsertRowid = rowidRes[0].values[0][0];
      changes = rowidRes[0].values[0][1];
    }
    
    persist();
    return { lastInsertRowid, changes };
  },

  async exec(sql) {
    const instance = await getDb();
    instance.exec(sql);
    persist();
  },

  // Atomic transaction wrapper
  async transaction(callback) {
    const instance = await getDb();
    inTransaction = true;
    instance.run('BEGIN TRANSACTION;');
    try {
      // Pass a transaction-scoped query runner
      const result = await callback(this);
      instance.run('COMMIT;');
      inTransaction = false;
      persist();
      return result;
    } catch (error) {
      inTransaction = false;
      try {
        instance.run('ROLLBACK;');
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
      throw error;
    }
  },

  persist
};

module.exports = { getDb, db };
