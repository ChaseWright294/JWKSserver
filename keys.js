const { generateKeyPairSync } = require('crypto');
const { database: db } = require('./db');

let keys = []; //list of keys for debugging, mostly

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
        ? Date.now() - 1000 // Set expiration in the past for keys initialized as expired
        : Date.now() + 60 * 60 * 1000; //keys valid for 1 hour
    
    //serialize private key
    const serializedPrivateKey = JSON.stringify(privateKey);
    
    //insert into database as BLOB
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO keys (key, expires_at) VALUES (?, ?)',
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

//helper functions to fetch keys
function getFreshKey() {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at > ? LIMIT 1',
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

function getAllFreshKeys() {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at > ?',
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

function getExpiredKey() {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at <= ? LIMIT 1',
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

function getAllExpiredKeys() {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT kid, key, expires_at FROM keys WHERE expires_at <= ?',
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

function getKeyWithKid(kid) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT kid, key, expires_at FROM keys WHERE kid = ?',
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