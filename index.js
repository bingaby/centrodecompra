require('dotenv').config();

console.log('EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('PRIVATE KEY:', process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'));
