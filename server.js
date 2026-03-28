/**
 * Main server module
 * Sets up Express server with JWKS and authentication endpoints
 * Initializes RSA key pairs on startup
 */
const express = require('express'); //using express for server
const { generateKeyPair } = require("./keys");
const { jwksManager } = require("./jwks");
const { authManager } = require("./auth");
const { database: db } = require('./db');

const app = express();
app.use(express.json());

const port = 8080;

//one fresh key and one expired key for testing
generateKeyPair();
generateKeyPair(true);

app.all('/auth', (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    next();
});

//only GET requests are allowed
app.all('/.well-known/jwks.json', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }
  next();
});

//default path for app
app.get('/', (req, res) => {
  res.send('JWKS server running')
})

 //endpoint for fetching JWKS
app.get("/.well-known/jwks.json", jwksManager);

//endpoint for getting signed JWTS
app.post('/auth', authManager); 

app.listen(port, () => {
    console.log(`JWKS server running on http://localhost:${port}`);
});

module.exports = app;