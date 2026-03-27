const { generateKeyPairSync } = require('crypto');
const db = require('./db');
let uuidv4;

let keys = []; //list of keys

async function generateKeyPair(isExpired = false) {
    if (!uuidv4) {
        const uuid = await import('uuid');
        uuidv4 = uuid.v4;
    }
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

    const kid = uuidv4(); // Generate a unique key ID
    //Expiration time for the key
    const expireTime = isExpired
        ? Date.now() - 1000 // Set expiration in the past for keys initialized as expired
        : Date.now() + 60 * 60 * 1000; //keys valid for 1 hour
    
    const keyData = { //store key data in object to push to keys array
        kid,
        publicKey,
        privateKey,
        expireTime
    }

    keys.push(keyData); //add the new key to the keys array
    
    //serialize private key
    const serializedPrivateKey = JSON.stringify({
        privateKey: keyData.privateKey
    });
    
    //insert into database as BLOB
    db.run(
        'INSERT INTO keys (key, expires_at) VALUES (?, ?)',
        [Buffer.from(serializedPrivateKey), keyData.expireTime],
        (err) => {
            if (err) {
                console.error('Error inserting key into database:', err.message);
            }
        }
    );
    
    return keyData;
}

//helper functions to fetch keys
function getFreshKey() {
    return keys.find(key => key.expireTime > Date.now());
}

function getAllFreshKeys() {
    return keys.filter(key => key.expireTime > Date.now());
}

function getExpiredKey() {
    return keys.find(key => key.expireTime <= Date.now());
}

function getAllExpiredKeys() {
    return keys.filter(key => key.expireTime <= Date.now());
}

function getKeyWithKid(kid) {
    return keys.find(key => key.kid === kid);
}


exports.generateKeyPair = generateKeyPair;
exports.keys = keys;
exports.getFreshKey = getFreshKey;
exports.getAllFreshKeys = getAllFreshKeys;
exports.getExpiredKey = getExpiredKey;
exports.getAllExpiredKeys = getAllExpiredKeys;
exports.getKeyWithKid = getKeyWithKid;