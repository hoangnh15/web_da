const crypto = require('crypto');

function generateSignature(rawSignature, secretKey) {
    return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
}

module.exports = { generateSignature };
