const https = require('https');

const data = JSON.stringify({
    messages: [
        { role: 'system', content: 'You are a helpful expert social media assistant.' },
        { role: 'user', content: 'Say hello.' }
    ],
    model: 'openai',
    seed: 1234
});

const options = {
    hostname: 'text.pollinations.ai',
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Testing Pollinations AI (Native HTTPS)...");

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${body}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
