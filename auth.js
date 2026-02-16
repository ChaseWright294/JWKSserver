const jwt = require("jsonwebtoken");
const { getFreshKey, getExpiredKey } = require("./keys");

function authManager(req, res) {
    const fetchExpired = req.query.expired === 'true'; //fetch an expired key if query parameter is set to true

    const fetchedKey = fetchExpired ? getExpiredKey() : getFreshKey();

    if(!fetchedKey) {
        return res.status(404).json({ error: 'No valid key found' });
    }

    const header = {
        "alg": "RS256",
        "typ": "JWT",
        "kid": fetchedKey.kid
    }

    const payload = { //user information, just this username because no authentication for this project
        sub: 'cool_username',
        name: 'Cool User',
        iat: Math.floor(Date.now() / 1000) //issued-at-time in seconds
    }

    res.json({ token }); //send the token in the response
}

exports.authManager = authManager;