const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: './credentials.json',
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
});

module.exports = { auth, sheets: google.sheets({ version: 'v4', auth }), drive: google.drive({ version: 'v3', auth }) };