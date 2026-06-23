/**
 * Run once to set up Gmail access.
 * node tests/gmail-setup.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error('credentials.json not found:', CREDENTIALS_PATH);
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
const clientInfo = credentials.installed || credentials.web;
const { client_id, client_secret } = clientInfo;

// Create Gmail authorization URL
const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(client_id)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log('\nGmail Authorization Setup');
console.log('Open the following URL in your browser:\n');
console.log(authUrl);
console.log('\n1. Log in to your Gmail account');
console.log('2. Grant access');
console.log('3. Copy the authorization code');
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the code here and press Enter: ', (code) => {
  rl.close();
  code = code.trim();

  if (!code) {
    console.error('No code entered');
    process.exit(1);
  }

  // Exchange code for tokens
  const postData = new URLSearchParams({
    code,
    client_id,
    client_secret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  }).toString();

  const req = https.request({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const token = JSON.parse(data);
      if (token.refresh_token) {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));

        console.log('\ntoken.json saved to:', TOKEN_PATH);
        console.log('Setup complete. You can now run: npx playwright test --headed');
      } else {
        console.error('\nFailed to get token. Response:', data);
        console.error('Make sure you copied the full code correctly.');
      }
    });
  });

  req.on('error', (e) => console.error('Request error:', e));
  req.write(postData);
  req.end();
});