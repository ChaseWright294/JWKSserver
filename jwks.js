const { exportJWK, importSPKI } = require('jose');
const { getAllFreshKeys, getKeyWithKid } = require('./keys'); //rubric only mentions unexpired keys for this part

async function jwksManager(req, res) { //route handling function for /jwks endpoint
    const freshKeys = getAllFreshKeys();

    const jwks = {
        keys: []
    };

    //convert each valid key to JWK format
    for (const key of freshKeys) {
        try {
            const keyObj = await importSPKI(key.publicKey, 'RS256'); // import PEM first
            const jwk = await exportJWK(keyObj);
            jwk.kid = key.kid;
            jwk.use = 'sig';
            jwk.alg = 'RS256';

            jwks.keys.push(jwk); //add key to response
        }
        catch (err) {
            console.error(`Failed to export key with kid ${key.kid}:`, err);
        }
    }

    return res.status(200).json({ keys: jwks }); // return the valid keys
}

//get a key with a specific kid
async function getKeyByKid(req, res) {
    const { kid } = req.query;

    //check if kid is provided
    if (!kid) {
        return res.status(400).json({ error: 'kid query parameter is required' });
    }

    const fetchKey = getKeyWithKid(kid);

    //check if key exists and is not expired
    if (!fetchKey || fetchKey.expireTime <= Date.now()) {
        return res.status(404).json({ error: 'Key not found or expired' });
    }

    try {
        const keyObj = await importSPKI(fetchKey.publicKey, 'RS256'); // import PEM first
        const jwk = await exportJWK(keyObj);
        jwk.kid = fetchKey.kid;
        jwk.use = 'sig';
        jwk.alg = 'RS256';
        res.json(jwk);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to export key' }); //error 500 is internal server error
    }
}

exports.jwksManager = jwksManager;
exports.getKeyByKid = getKeyByKid;