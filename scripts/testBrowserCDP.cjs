const net = require('net');
const crypto = require('crypto');
const http = require('http');

function createCDPClient(wsPath) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(9223, '127.0.0.1', () => {
      const key = crypto.randomBytes(16).toString('base64');
      const req = [
        'GET ' + wsPath + ' HTTP/1.1',
        'Host: 127.0.0.1:9223',
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Sec-WebSocket-Key: ' + key,
        'Sec-WebSocket-Version: 13',
        '\r\n'
      ].join('\r\n');
      socket.write(req);
    });

    let buffer = Buffer.alloc(0);
    let upgraded = false;
    let nextId = 1;
    const callbacks = new Map();

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!upgraded) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          upgraded = true;
          buffer = buffer.slice(headerEnd + 4);
          resolve({
            send(method, params = {}) {
              return new Promise((res, rej) => {
                const id = nextId++;
                callbacks.set(id, { res, rej });
                const msg = JSON.stringify({ id, method, params });
                const payload = Buffer.from(msg);
                let frame;
                if (payload.length < 126) {
                  frame = Buffer.alloc(6 + payload.length);
                  frame[0] = 0x81;
                  frame[1] = 0x80 | payload.length;
                  const mask = crypto.randomBytes(4);
                  mask.copy(frame, 2);
                  for (let i = 0; i < payload.length; i++) {
                    frame[6 + i] = payload[i] ^ mask[i % 4];
                  }
                } else {
                  frame = Buffer.alloc(8 + payload.length);
                  frame[0] = 0x81;
                  frame[1] = 0x80 | 126;
                  frame.writeUInt16BE(payload.length, 2);
                  const mask = crypto.randomBytes(4);
                  mask.copy(frame, 4);
                  for (let i = 0; i < payload.length; i++) {
                    frame[8 + i] = payload[i] ^ mask[i % 4];
                  }
                }
                socket.write(frame);
              });
            },
            close() { socket.end(); }
          });
        }
      }

      while (upgraded && buffer.length >= 2) {
        const opcode = buffer[0] & 0x0f;
        let len = buffer[1] & 0x7f;
        let offset = 2;
        if (len === 126) {
          if (buffer.length < 4) break;
          len = buffer.readUInt16BE(2);
          offset = 4;
        } else if (len === 127) {
          if (buffer.length < 10) break;
          len = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }
        if (buffer.length < offset + len) break;
        const payload = buffer.slice(offset, offset + len);
        buffer = buffer.slice(offset + len);
        if (opcode === 1) {
          try {
            const data = JSON.parse(payload.toString('utf8'));
            if (data.id && callbacks.has(data.id)) {
              const { res, rej } = callbacks.get(data.id);
              callbacks.delete(data.id);
              if (data.error) rej(data.error);
              else res(data.result);
            } else if (data.method === 'Runtime.consoleAPICalled') {
              console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
            } else if (data.method === 'Network.responseReceived') {
              console.log('[BROWSER NETWORK RESPONSE]', data.params.response.status, data.params.response.url);
            } else if (data.method === 'Network.requestWillBeSent') {
              console.log('[BROWSER NETWORK REQUEST]', data.params.request.method, data.params.request.url);
            }
          } catch(e) {}
        }
      }
    });

    socket.on('error', reject);
  });
}

async function runBrowserFlow() {
  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9223/json/list', (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const pageTarget = targets.find(t => t.type === 'page');
  console.log('Using target:', pageTarget.id, pageTarget.url);

  const cdp = await createCDPClient('/devtools/page/' + pageTarget.id);
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');

  console.log('\n--- STEP 1: Navigate to Landing Page ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 2000));

  const url1 = await cdp.send('Runtime.evaluate', { expression: 'window.location.href' });
  console.log('Current URL:', url1.result.value);

  console.log('\n--- STEP 2: Click Login Button to open modal ---');
  const clickRes = await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loginBtn = btns.find(b => b.textContent.trim() === 'Login');
        if (!loginBtn) return 'LOGIN_BTN_NOT_FOUND';
        loginBtn.click();
        return 'CLICKED_LOGIN';
      })()
    `
  });
  console.log('Modal click result:', clickRes.result.value);
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- STEP 3: Click Sign In ---');
  const submitRes = await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const signInBtn = btns.find(b => b.textContent.includes('Sign In'));
        if (!signInBtn) return 'SIGN_IN_BTN_NOT_FOUND';
        signInBtn.click();
        return 'CLICKED_SIGN_IN';
      })()
    `
  });
  console.log('Sign in click result:', submitRes.result.value);

  console.log('\n--- STEP 4: Observe 5 seconds of state transitions ---');
  for (let i = 1; i <= 5; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const curUrl = await cdp.send('Runtime.evaluate', { expression: 'window.location.href' });
    const cookies = await cdp.send('Network.getCookies');
    console.log('T+' + i + 's: URL=' + curUrl.result.value + ' | Cookies count=' + cookies.cookies.length);
    if (cookies.cookies.length > 0) {
      console.log('   Cookies detail:', cookies.cookies.map(c => ({ name: c.name, value: c.value.substring(0, 15) + '...', domain: c.domain, path: c.path })));
    }
  }

  console.log('\n--- STEP 5: Direct Navigation to /dashboard ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/dashboard' });
  for (let i = 1; i <= 3; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const curUrl = await cdp.send('Runtime.evaluate', { expression: 'window.location.href' });
    const bodySnippet = await cdp.send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0, 120)' });
    console.log('Direct Dashboard T+' + i + 's: URL=' + curUrl.result.value + ' | Body: ' + JSON.stringify(bodySnippet.result.value));
  }

  cdp.close();
  process.exit(0);
}

runBrowserFlow().catch(err => { console.error('Flow error:', err); process.exit(1); });
