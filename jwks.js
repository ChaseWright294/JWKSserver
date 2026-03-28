const { exportJWK, importPKCS8 } = require('jose');
const { getAllFreshKeys, getKeyWithKid } = require('./keys'); //rubric only mentions unexpired keys for this part

/**
 * JWKS manager module
 * @param {object} req - Express request object with optional query.expired parameter
 * @param {object} res - Express response object
 */
async function jwksManager(req, res) { //route handling function for /jwks endpoint
    const freshKeys = await getAllFreshKeys();

    const jwks = {
        keys: []
    };

    //convert each valid key to JWK format
    for (const key of freshKeys) {
        try {
            const keyObj = await importPKCS8(key.privateKey, 'RS256', { extractable: true }); 
            const fullJwk = await exportJWK(keyObj); // export the key
            
            // Only include public components for JWKS
            const jwk = {
              kty: fullJwk.kty,
              n: fullJwk.n,
              e: fullJwk.e,
              kid: String(key.kid),
              use: 'sig',
              alg: 'RS256'
            };

            jwks.keys.push(jwk); //add key to response
            console.log(`Added key with kid ${key.kid} to JWKS response`); //log added key
        }
        catch (err) {
            console.error(`Failed to export key with kid ${key.kid}:`, err);
        }
    }
    res.json(jwks); //send response
}

//! not needed for project 2
// //get a key with a specific kid
// async function getKeyByKid(req, res) {
//     const kid = req.query.kid;

//     //check if kid is provided
//     if (!kid) {
//         return res.status(400).json({ error: 'kid query parameter is required' });
//     }

//     const fetchKey = await getKeyWithKid(kid);

//     //check if key exists and is not expired
//     if (!fetchKey || fetchKey.expireTime <= Date.now()) {
//         return res.status(404).json({ error: 'Key not found or expired' });
//     }

//     try {
//         const keyObj = await importPKCS8(fetchKey.privateKey, 'RS256', { extractable: true });
//         const fullJwk = await exportJWK(keyObj);
//         const jwk = {
//           kty: fullJwk.kty,
//           n: fullJwk.n,
//           e: fullJwk.e,
//           kid: String(fetchKey.kid),
//           use: 'sig',
//           alg: 'RS256'
//         };
//         res.json(jwk);
//     }
//     catch (err) {
//         res.status(500).json({ error: 'Failed to export key' }); //error 500 is internal server error
//     }
// }

exports.jwksManager = jwksManager;
//exports.getKeyByKid = getKeyByKid;