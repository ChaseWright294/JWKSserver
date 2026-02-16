const { generateKeyPairSync } = require('crypto');
const { v4: uuidv4 } = require('uuid');

const keys = []; //list of keys

function generateKeyPair(isExpired = false) {
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
        : Date.now() + 600 * 1000; //keys valid for 10 minutes (for testing purposes)   
    
    const keyData = { //store key data in object to push to keys array
        kid,
        publicKey,
        privateKey,
        expireTime
    }

    keys.push(keyData); // Add the new key to the keys array
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