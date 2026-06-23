import * as fs from 'fs';
import * as https from 'https';

interface GmailCredentials {
  installed?: { client_id: string; client_secret: string; redirect_uris: string[] };
  web?: { client_id: string; client_secret: string; redirect_uris: string[] };
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

async function refreshAccessToken(credentials: GmailCredentials, token: TokenData): Promise<string> {
  const clientInfo = credentials.installed || credentials.web!;
  const params = new URLSearchParams({
    client_id: clientInfo.client_id,
    client_secret: clientInfo.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.access_token) resolve(parsed.access_token);
        else reject(new Error(`Token refresh failed: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(params.toString());
    req.end();
  });
}

async function fetchEmails(accessToken: string, query: string): Promise<any[]> {
  return new Promise((resolve) => {
    const reqPath = `/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
    const req = https.request({
      hostname: 'gmail.googleapis.com',
      path: reqPath,
      headers: { Authorization: `Bearer ${accessToken}` },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).messages || []); }
        catch { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.end();
  });
}

async function fetchEmailDetails(accessToken: string, messageId: string): Promise<{ subject: string; body: string; internalDate: number }> {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'gmail.googleapis.com',
      path: `/gmail/v1/users/me/messages/${messageId}?format=full`,
      headers: { Authorization: `Bearer ${accessToken}` },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const internalDate = parseInt(parsed.internalDate || '0');

          // Get email subject.
          const headers = parsed.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';

          // Read email body.
          const extractBody = (payload: any): string => {
            if (payload?.body?.data) {
              return Buffer.from(payload.body.data, 'base64').toString('utf-8');
            }
            if (payload?.parts) {
              for (const part of payload.parts) {
                const body = extractBody(part);
                if (body) return body;
              }
            }
            return '';
          };

          resolve({ subject, body: extractBody(parsed.payload || {}), internalDate });
        } catch {
          resolve({ subject: '', body: '', internalDate: 0 });
        }
      });
    });
    req.on('error', () => resolve({ subject: '', body: '', internalDate: 0 }));
    req.end();
  });
}

export async function getOtpFromGmail(
  credentialsPath: string,
  tokenPath: string,
  afterTimestamp: number,
  timeoutMs = 120000,
  pollIntervalMs = 5000,
): Promise<string> {
  const credentials: GmailCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const token: TokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

  const accessToken = await refreshAccessToken(credentials, token);
  console.log('Gmail access token refreshed');
  console.log(`Looking for emails received after: ${new Date(afterTimestamp).toISOString()}`);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    console.log('Checking Gmail...');
    const messages = await fetchEmails(accessToken, 'newer_than:10m');

    for (const msg of messages) {
      const { subject, body, internalDate } = await fetchEmailDetails(accessToken, msg.id);

     // Ignore older emails.
      if (internalDate < afterTimestamp) {
        continue;
      }
      console.log(`New email found - Subject: "${subject}" | Date: ${new Date(internalDate).toISOString()}`);
      const plainText = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`   Body preview: ${plainText.slice(0, 300)}`);

      // Look for a 6-digit OTP.
      const match = plainText.match(/\b(\d{6})\b/);
      if (match) {
        console.log(`OTP found: ${match[1]}`);
        return match[1];
      }
    }

    console.log(`OTP not received yet. Retrying in ${pollIntervalMs / 1000}s...`);
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }

  throw new Error('Timed out waiting for OTP email (120s).');
}