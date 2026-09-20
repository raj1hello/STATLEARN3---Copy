const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const crypto = require('crypto');

function createCDPClient(wsPath, port = 9223) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1', () => {
      const key = crypto.randomBytes(16).toString('base64');
      const req = [
        'GET ' + wsPath + ' HTTP/1.1',
        'Host: 127.0.0.1:' + port,
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
              console.log('[CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
            } else if (data.method === 'Network.responseReceived') {
              console.log('[NETWORK RES]', data.params.response.status, data.params.response.url);
            } else if (data.method === 'Network.requestWillBeSent') {
              console.log('[NETWORK REQ]', data.params.request.method, data.params.request.url);
            }
          } catch(e) {}
        }
      }
    });

    socket.on('error', reject);
  });
}

async function runTunnelTest() {
  console.log('Starting cloudflared tunnel...');
  const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3000']);

  let publicUrl = null;
  tunnel.stderr.on('data', (d) => {
    const txt = d.toString();
    const match = txt.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !publicUrl) {
      publicUrl = match[0];
      console.log('>>> CLOUDFLARE PUBLIC URL FOUND:', publicUrl);
    }
  });

  // Wait up to 15s for tunnel URL
  for (let i = 0; i < 15; i++) {
    if (publicUrl) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!publicUrl) {
    console.error('Failed to get public tunnel URL');
    tunnel.kill();
    process.exit(1);
  }

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9223/json/list', (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const pageTarget = targets.find(t => t.type === 'page');
  const cdp = await createCDPClient('/devtools/page/' + pageTarget.id);
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');

  // Clear cookies first to start fresh
  await cdp.send('Network.clearBrowserCookies');

  console.log('\n=== TEST 1: Open Public Cloudflare URL ===');
  await cdp.send('Page.navigate', { url: publicUrl });
  await new Promise(r => setTimeout(r, 3000));
  const landingUrl = await cdp.send('Runtime.evaluate', { expression: 'window.location.href' });
  console.log('Landing URL reached:', landingUrl.result.value);

  console.log('\n=== TEST 2: Open Login Modal & Submit Credentials ===');
  await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loginBtn = btns.find(b => b.textContent.trim() === 'Login');
        if (loginBtn) loginBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const signInBtn = btns.find(b => b.textContent.includes('Sign In'));
        if (signInBtn) signInBtn.click();
      })()
    `
  });

  console.log('\n=== TEST 3: Track Navigation and Cookies over Public HTTPS ===');
  for (let i = 1; i <= 6; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const curUrl = await cdp.send('Runtime.evaluate', { expression: 'window.location.href' });
    const cookies = await cdp.send('Network.getCookies');
    console.log('T+' + i + 's: URL=' + curUrl.result.value + ' | Cookies count=' + cookies.cookies.length);
    if (cookies.cookies.length > 0) {
      console.log('   Cookies detail:', cookies.cookies.map(c => ({ name: c.name, domain: c.domain, secure: c.secure, sameSite: c.sameSite })));
    }
  }

  console.log('\n=== TEST 4: Direct Navigate to ' + publicUrl + '/ai-tutor ===');
  await cdp.send('Page.navigate', { url: publicUrl + '/ai-tutor' });
  await new Promise(r => setTimeout(r, 3000));
  const tutorUrl = await cdp.send('Runtime.evaluate', { expression: 'window.location.href' });
  const tutorText = await cdp.send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0, 150)' });
  console.log('AI Tutor URL:', tutorUrl.result.value);
  console.log('AI Tutor Content:', JSON.stringify(tutorText.result.value));

  cdp.close();
  tunnel.kill();
  process.exit(0);
}

runTunnelTest().catch(err => {
  console.error('Tunnel test error:', err);
  process.exit(1);
});
