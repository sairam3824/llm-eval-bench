const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || './data/bench.db';
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Checking database at ${DB_PATH}...`);
const db = new Database(DB_PATH);

// Simple check to see if tables exist
try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Existing tables:', tables.map(t => t.name).join(', '));

    if (tables.length === 0) {
        console.log('Database is empty. Tables will be created automatically on next app start.');
    } else {
        console.log('Database is already initialized.');
    }
} catch (error) {
    console.error('Error checking database:', error.message);
} finally {
    db.close();
}
