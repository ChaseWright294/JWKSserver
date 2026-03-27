const sqlite3 = require('sqlite3').verbose();

let database = new sqlite3.Database('./totally_not_my_privateKeys.db', (err) =>
{
    if (err) {
        console.error('Error opening database:', err.message);
    }
    console.log('Connected to the SQLite database.');
})

database.run(`CREATE TABLE IF NOT EXISTS keys (
    kid INTEGER PRIMARY KEY AUTOINCREMENT,
    key BLOB NOT NULL,
    expires_at INTEGER NOT NULL
)`);

exports.database = database;