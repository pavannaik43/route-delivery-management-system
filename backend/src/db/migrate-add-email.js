/**
 * Database Migration Script
 *
 * This script migrates the existing database to add email and phone fields to users table.
 * Run this script ONCE to update your existing database.
 *
 * Usage: node migrate-add-email.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

async function migrate() {
  console.log('Starting database migration...');
  console.log(`Database path: ${DB_PATH}`);

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found. Please run seed script first.');
    process.exit(1);
  }

  // Load the database
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  try {
    // Check if email column already exists
    const tableInfo = db.exec("PRAGMA table_info(users)");
    const columns = tableInfo[0]?.values.map(row => row[1]) || [];

    if (columns.includes('email')) {
      console.log('Email column already exists. Migration not needed.');
      db.close();
      return;
    }

    console.log('Adding email and phone columns to users table...');

    // Begin transaction
    db.run('BEGIN TRANSACTION;');

    // Create new table with email and phone fields
    db.run(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'delivery_staff')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Copy existing data with default emails
    db.run(`
      INSERT INTO users_new (id, username, email, password, phone, role, created_at)
      SELECT
        id,
        username,
        username || '@hatsun.com' as email,
        password,
        CASE
          WHEN role = 'admin' THEN '9876543210'
          ELSE '9876543211'
        END as phone,
        role,
        created_at
      FROM users;
    `);

    // Drop old table
    db.run('DROP TABLE users;');

    // Rename new table
    db.run('ALTER TABLE users_new RENAME TO users;');

    // Create index on email
    db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');

    // Commit transaction
    db.run('COMMIT;');

    console.log('Migration completed successfully!');
    console.log('');
    console.log('⚠️  IMPORTANT: All existing users now have email addresses:');
    console.log('   - Format: username@hatsun.com');
    console.log('   - Example: admin → admin@hatsun.com');
    console.log('');
    console.log('Users must now login with:');
    console.log('   - Username');
    console.log('   - Email');
    console.log('   - Password');
    console.log('');
    console.log('Recommend: Update user emails via Admin panel after migration.');

    // Save the modified database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    db.close();
    console.log('Database saved successfully.');

  } catch (error) {
    console.error('Migration failed:', error);
    try {
      db.run('ROLLBACK;');
      console.log('Transaction rolled back.');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    db.close();
    process.exit(1);
  }
}

// Run migration
migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
