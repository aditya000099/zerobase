// backend/utils/apikey.js
const crypto = require('crypto');

async function generateApiKey() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(buffer.toString('hex'));
    });
  });
}

module.exports = {
  generateApiKey
};