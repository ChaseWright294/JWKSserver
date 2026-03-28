const express = require('express'); //using express for server
const { generateKeyPair } = require("./keys");
const { jwksManager, getKeyByKid } = require("./jwks");
const { authManager } = require("./auth");
const { database: db } = require('./db');

const app = express();
app.use(express.json());

const port = 8080;

//generate some keys on server startup, with some expired and some not
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

app.get("/.well-known/jwks.json", jwksManager); //endpoint for fetching JWKS
app.get("/.well-known/jwks.json", getKeyByKid); //endpoint for fetching a specific key by kid

app.post('/auth', authManager); //endpoint for getting signed JWTS

app.listen(port, () => {
    console.log(`JWKS server running on http://localhost:${port}`);
});

module.exports = app;