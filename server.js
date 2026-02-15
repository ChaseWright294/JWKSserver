const express = require('express'); //using express for server
const { generateKeyPair } = require("./keys");

//var key =  generateKeyPair(); // Generate a non-expired key pair
//console.log('Generated Key Pair:\n', key);

const app = express();
app.use(express.json());

//Start the server
const port = 8080;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`JWKS server running on http://localhost:${port}`);
});

module.exports = app;  // for testing