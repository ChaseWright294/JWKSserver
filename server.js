const { generateKeyPair } = require("./keys");

var key =  generateKeyPair(); // Generate a non-expired key pair

console.log('Generated Key Pair:\n', key);