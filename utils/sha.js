const crypto = require('crypto');


module.exports  = str =>  crypto.createHash('SHA256').update(str).digest('base64');
