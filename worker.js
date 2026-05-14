const http = require('http');

console.log('🤖 InSingh Background Worker Started!');
console.log('Scanning for scheduled posts every 30 seconds...');

setInterval(() => {
  http.get('http://localhost:3000/api/cron', (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.results && result.results.length > 0) {
          console.log(`✅ [${new Date().toISOString()}] Successfully published ${result.results.length} posts!`);
        }
      } catch (e) {
        console.error('Error parsing cron response');
      }
    });
  }).on('error', (err) => {
    console.error('Failed to reach the Next.js server. Is it running?');
  });
}, 30000); // Run every 30 seconds
