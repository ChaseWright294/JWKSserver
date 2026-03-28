/**
 * Key generation and management module
 * Handles RSA key pair generation, storage, and retrieval from SQLite database
 */
const { generateKeyPairSync } = require('crypto');
const { database: db } = require('./db');

let keys = []; //list of keys for debugging, mostly

/**
 * Generate an RSA key pair and store it in the database
 * @param {boolean} [isExpired=false] - If true, key is marked as already expired
 * @returns {Promise<{kid: number, privateKey: string, expireTime: number}>} Key data with kid and expiration time
 * @throws {Error} If database insertion fails
 */
async function generateKeyPair(isExpired = false) {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    //Expiration time for the key
    const expireTime = isExpired
        ? Date.now() - 60 * 60 * 1000  //1 hour already expired
        : Date.now() + 60 * 60 * 1000; //keys valid for 1 hour
    
    //serialize private key
    const serializedPrivateKey = JSON.stringify(privateKey);
    
    //insert into database as BLOB
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO keys (key, expires_at) VALUES (?1, ?2)',
            [Buffer.from(serializedPrivateKey), expireTime],
            function(err) {
                if (err) {
                    console.error('Error inserting key into database:', err.message);
                    reject(err);
                } else {
                    //capture kid from database
                    const kid = this.lastID;
                    const keyData = {
                        kid,
                        privateKey,
                        expireTime
                    };
                    keys.push(keyData);
                    console.log(`Generated key with kid: ${kid}, expires at: ${new Date(expireTime).toISOString()}`);
                    resolve(keyData);
                }
            }
        );
    });
    
    
}

/**
 * Retrieve a single fresh (non-expired) key from the database
 * @returns {Promise<?{kid: number, privateKey: string, expireTime: number}>} Fresh key data or null if none available
 * @throws {Error} If database query fails
 */
function getFreshKey() {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at > ?1 LIMIT 1',
            [Date.now()],
            (err, row) => {
                if (err) {
                    console.error('Error fetching fresh key: ', err.message);
                    reject(err);
                } else {
                    if (row) {
                        const keyData = {
                            kid: row.kid,
                            privateKey: JSON.parse(row.key.toString()),
                            expireTime: row.expires_at
                        };
                        resolve(keyData);
                    } else {
                        resolve(null);
                    }
                }
            }
        );
    });
}

/**
 * Retrieve all fresh (non-expired) keys from the database
 * @returns {Promise<Array<{kid: number, privateKey: string, expireTime: number}>>} Array of fresh key data
 * @throws {Error} If database query fails
 */
function getAllFreshKeys() {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at > ?1',
            [Date.now()],
            (err, rows) => {
                if (err) {
                    console.error('Error fetching fresh keys: ', err.message);
                    reject(err);
                } else {
                    if (rows.length !== 0) {
                        const keyDataArray = rows.map(row => ({
                            kid: row.kid,
                            privateKey: JSON.parse(row.key.toString()),
                            expireTime: row.expires_at
                        }));
                        console.log(`Fetched ${keyDataArray.length} fresh keys from database`);
                        resolve(keyDataArray);
                    } else {
                        resolve([]);
                    }
                }
            }
        );
    });
}

/**
 * Retrieve a single expired key from the database
 * Used for testing JWT validation with expired keys
 * @returns {Promise<?{kid: number, privateKey: string, expireTime: number}>} Expired key data or null if none available
 * @throws {Error} If database query fails
 */
function getExpiredKey() {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at <= ?1 LIMIT 1',
            [Date.now()],
            (err, row) => {
                if (err) {
                    console.error('Error fetching expired key: ', err.message);
                    reject(err);
                } else {
                    if (row) {
                        const keyData = {
                            kid: row.kid,
                            privateKey: JSON.parse(row.key.toString()),
                            expireTime: row.expires_at
                        };
                        resolve(keyData);
                    } else {
                        resolve(null);
                    }
                }
            }
        );
    });
}

/**
 * Retrieve all expired keys from the database
 * @returns {Promise<Array<{kid: number, privateKey: string, expireTime: number}>>} Array of expired key data
 * @throws {Error} If database query fails
 */
function getAllExpiredKeys() {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at <= ?1',
            [Date.now()],
            (err, rows) => {
                if (err) {
                    console.error('Error fetching expired keys: ', err.message);
                    reject(err);
                } else {
                    if (rows.length !== 0) {
                        const keyDataArray = rows.map(row => ({
                            kid: row.kid,
                            privateKey: JSON.parse(row.key.toString()),
                            expireTime: row.expires_at
                        }));
                        resolve(keyDataArray);
                    } else {
                        resolve([]);
                    }
                }
            }
        );
    });
}

/**
 * Retrieve a specific key by its key ID (kid)
 * @param {number} kid - The key ID to retrieve
 * @returns {Promise<?{kid: number, privateKey: string, expireTime: number}>} Key data or null if not found
 * @throws {Error} If database query fails
 */
function getKeyWithKid(kid) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT kid, key, expires_at FROM keys WHERE kid = ?1',
            [kid],
            (err, row) => {
                if (err) {
                    console.error(`Error fetching key with kid ${kid}: `, err.message);
                    reject(err);
                } else {
                    if (row) {
                        const keyData = {
                            kid: row.kid,
                            privateKey: JSON.parse(row.key.toString()),
                            expireTime: row.expires_at
                        };
                        resolve(keyData);
                    } else {
                        resolve(null);
                    }
                }
            }
        );
    });

}


exports.generateKeyPair = generateKeyPair;
exports.keys = keys;
exports.getFreshKey = getFreshKey;
exports.getAllFreshKeys = getAllFreshKeys;
exports.getExpiredKey = getExpiredKey;
exports.getAllExpiredKeys = getAllExpiredKeys;
exports.getKeyWithKid = getKeyWithKid;