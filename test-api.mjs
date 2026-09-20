const http = require('http');

const BASE = 'http://localhost:3000';

function request(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { 'Cookie': cookie } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null, setCookie });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== Step 1: Login as parent ===');
  const login = await request('POST', '/api/auth/login', { email: 'parent@statlearn.local', password: 'Parent@123' });
  console.log('Login:', JSON.stringify(login));
  if (!login.data?.success) { console.error('Login failed!'); return; }

  const cookie = login.setCookie ? login.setCookie[0].split(';')[0] : '';
  console.log('Cookie:', cookie);

  console.log('\n=== Step 2: Get parent links ===');
  const links = await request('GET', '/api/parent/links', null, cookie);
  console.log('Status:', links.status);
  console.log('Links response:', JSON.stringify(links.data, null, 2));
}

main().catch(console.error);