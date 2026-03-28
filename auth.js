const jwt = require("jsonwebtoken");
const { getFreshKey, getExpiredKey } = require("./keys");

async function authManager(req, res) {
    const fetchExpired = req.query.expired === 'true';
    const fetchedKey = fetchExpired ? await getExpiredKey() : await getFreshKey();

    if (!fetchedKey) {
        return res.status(404).json({ error: 'No valid key found' });
    }

    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: String(fetchedKey.kid)
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
    console.log(`Generated ${fetchExpired ? 'expired' : 'fresh'} token with kid: ${fetchedKey.kid}`);
    res.json({ token });
}

exports.authManager = authManager;