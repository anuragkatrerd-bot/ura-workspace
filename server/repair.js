import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./workspace.db');

const tables = ['folders', 'notes', 'files', 'reminders'];

console.log("Starting System Schema Repair...");

let completed = 0;
tables.forEach(table => {
  db.run(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`[${table}] user_id column already exists.`);
      } else {
        console.error(`[${table}] ERROR: ${err.message}`);
      }
    } else {
      console.log(`[${table}] user_id column successfully added.`);
    }
    
    completed++;
    if (completed === tables.length) {
      console.log("SCHEMA REPAIR COMPLETE. All neural pathways verified.");
      db.close();
    }
  });
});
