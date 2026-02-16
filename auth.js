const jwt = require("jsonwebtoken");
const { getFreshKey, getExpiredKey } = require("./keys");

function authManager(req, res) {
    const fetchExpired = req.query.expired === 'true';
    const fetchedKey = fetchExpired ? getExpiredKey() : getFreshKey();

    if (!fetchedKey) {
        return res.status(404).json({ error: 'No valid key found' });
    }

    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: fetchedKey.kid
    };

    const now = Math.floor(Date.now() / 1000);
    let payload = {
        sub: 'cool_username',
        name: 'Cool User',
        iat: now
    };

    // If expired, set exp in the past
    if (fetchExpired) {
        payload.exp = now - 60; // expired 1 minute ago
    }

    const token = jwt.sign(payload, fetchedKey.privateKey, { algorithm: 'RS256', header });
    res.json({ token });
}

exports.authManager = authManager;