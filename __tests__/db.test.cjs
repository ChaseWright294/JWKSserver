/**
 * Test suite for db.js module
 * Tests SQLite database initialization and connection
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

describe('db.js', () => {
    let testDb;
    const testDbPath = path.join(__dirname, '../test_db.sqlite');

    beforeEach(() => {
        // Clean up test database if it exists
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    afterEach(() => {
        // Clean up test database
        if (testDb) {
            testDb.close();
        }
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    test('database module initializes SQLite connection', async () => {
        const { database } = require('../db');
        expect(database).toBeDefined();
        expect(typeof database).toBe('object');
    });

    test('keys table is created on startup', (done) => {
        testDb = new sqlite3.Database(testDbPath, (err) => {
            if (err) throw err;

            testDb.run(`CREATE TABLE IF NOT EXISTS keys (
                kid INTEGER PRIMARY KEY AUTOINCREMENT,
                key BLOB NOT NULL,
                expires_at INTEGER NOT NULL
            )`, (err) => {
                if (err) throw err;

                // Verify table exists by querying it
                testDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name='keys'", (err, rows) => {
                    if (err) throw err;
                    expect(rows.length).toBe(1);
                    expect(rows[0].name).toBe('keys');
                    done();
                });
            });
        });
    });

    test('keys table has correct schema', (done) => {
        testDb = new sqlite3.Database(testDbPath, (err) => {
            if (err) throw err;

            testDb.run(`CREATE TABLE IF NOT EXISTS keys (
                kid INTEGER PRIMARY KEY AUTOINCREMENT,
                key BLOB NOT NULL,
                expires_at INTEGER NOT NULL
            )`, (err) => {
                if (err) throw err;

                // Get table info
                testDb.all("PRAGMA table_info(keys)", (err, columns) => {
                    if (err) throw err;
                    expect(columns.length).toBe(3);
                    expect(columns[0].name).toBe('kid');
                    expect(columns[1].name).toBe('key');
                    expect(columns[2].name).toBe('expires_at');
                    done();
                });
            });
        });
    });

    test('can insert data into keys table with parameterized queries', (done) => {
        testDb = new sqlite3.Database(testDbPath, (err) => {
            if (err) throw err;

            testDb.run(`CREATE TABLE IF NOT EXISTS keys (
                kid INTEGER PRIMARY KEY AUTOINCREMENT,
                key BLOB NOT NULL,
                expires_at INTEGER NOT NULL
            )`, (err) => {
                if (err) throw err;

                const testKey = Buffer.from('test_key_data');
                const expireTime = Date.now() + 3600000;

                testDb.run(
                    'INSERT INTO keys (key, expires_at) VALUES (?1, ?2)',
                    [testKey, expireTime],
                    function(err) {
                        if (err) throw err;
                        expect(this.lastID).toBeGreaterThan(0);
                        done();
                    }
                );
            });
        });
    });

    test('parameterized queries prevent SQL injection', (done) => {
        testDb = new sqlite3.Database(testDbPath, (err) => {
            if (err) throw err;

            testDb.run(`CREATE TABLE IF NOT EXISTS keys (
                kid INTEGER PRIMARY KEY AUTOINCREMENT,
                key BLOB NOT NULL,
                expires_at INTEGER NOT NULL
            )`, (err) => {
                if (err) throw err;

                // Attempt SQL injection through parameter
                const maliciousKey = Buffer.from("test'); DROP TABLE keys; --");
                const expireTime = Date.now();

                testDb.run(
                    'INSERT INTO keys (key, expires_at) VALUES (?1, ?2)',
                    [maliciousKey, expireTime],
                    function(err) {
                        if (err) throw err;

                        // Verify table still exists
                        testDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name='keys'", (err, rows) => {
                            if (err) throw err;
                            expect(rows.length).toBe(1);
                            done();
                        });
                    }
                );
            });
        });
    });
});
