const { spawn } = require('child_process');
const https = require('https');

const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3000']);
let publicUrl = null;

tunnel.stderr.on('data', (d) => {
  const match = d.toString().match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !publicUrl) {
    publicUrl = match[0];
    console.log('Tunnel URL:', publicUrl);
    // Wait 4 seconds for DNS propagation
    setTimeout(testHtml, 4000);
  }
});

function testHtml() {
  https.get(publicUrl, (res) => {
    let html = '';
    res.on('data', c => html += c);
    res.on('end', () => {
      console.log('HTML length:', html.length);
      const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
      console.log('Scripts count in HTML:', scripts.length);
      scripts.forEach((s, idx) => {
        console.log(`Script ${idx + 1}:`, s.slice(0, 120));
      });
      tunnel.kill();
      process.exit(0);
    });
  }).on('error', err => {
    console.error('Fetch error:', err.message);
    setTimeout(testHtml, 2000);
  });
}
