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
              console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
            } else if (data.method === 'Runtime.exceptionThrown') {
              console.log('[BROWSER EXCEPTION]', data.params.exceptionDetails);
            }
          } catch(e) {}
        }
      }
    });

    socket.on('error', reject);
  });
}

async function debugHydration() {
  const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3000']);
  let publicUrl = null;
  tunnel.stderr.on('data', (d) => {
    const txt = d.toString();
    const match = txt.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !publicUrl) {
      publicUrl = match[0];
      console.log('Tunnel URL:', publicUrl);
    }
  });

  for (let i = 0; i < 15; i++) {
    if (publicUrl) break;
    await new Promise(r => setTimeout(r, 1000));
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

  console.log('Navigating to landing page...');
  await cdp.send('Page.navigate', { url: publicUrl });
  await new Promise(r => setTimeout(r, 4000));

  // Inspect React root and event handlers
  const hydrationCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Login');
        const reactKeys = Object.keys(btn || {}).filter(k => k.startsWith('__react'));
        return {
          reactKeys,
          nextDataPresent: !!window.__NEXT_DATA__,
          windowNext: !!window.next,
          scriptsLoaded: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Hydration check:', hydrationCheck.result.value);

  cdp.close();
  tunnel.kill();
  process.exit(0);
}

debugHydration().catch(err => {
  console.error(err);
  process.exit(1);
});
