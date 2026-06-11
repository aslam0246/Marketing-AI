const http = require('http');

const data = JSON.stringify({
    prompt: "Write a short test post about coffee."
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/gemini',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Calling local /api/gemini...");

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
