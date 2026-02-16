const express = require('express'); //using express for server
const { generateKeyPair } = require("./keys");
const { jwksManager, getKeyByKid } = require("./jwks");
const { authManager } = require("./auth");

const app = express();
app.use(express.json());

port = 8080;

//default path for app
app.get('/', (req, res) => {
  res.send('JWKS server running')
})

app.get("/.well-known/jwks.json", jwksManager); //endpoint for fetching JWKS
app.get('/auth', authManager); //endpoint for fetching a signed JWT

//generate some keys on server startup, with some expired and some not
for (let i = 0; i < 15; i++) {
    const isExpired = i > 9; //10 fresh keys and 5 expired keys
    generateKeyPair(isExpired);
}

app.listen(port, () => {
    console.log(`JWKS server running on http://localhost:${port}`);
});

module.exports = app;  //for testing