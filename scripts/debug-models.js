
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load API Key
const envPath = path.resolve(process.cwd(), '.env.local');
let API_KEY = "";
try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        if (match && match[1]) API_KEY = match[1].trim();
        // Remove quotes if present
        if (API_KEY.startsWith('"')) API_KEY = API_KEY.slice(1, -1);
    }
} catch (e) { }

if (!API_KEY) {
    console.error("No API Key found in .env.local");
    process.exit(1);
}

console.log(`Key found (starts with): ${API_KEY.substring(0, 5)}...`);

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${API_KEY}`,
    method: 'GET',
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            if (data.error) {
                console.error("API Error:", JSON.stringify(data.error, null, 2));
            } else if (data.models) {
                console.log("--- Available Models ---");
                data.models.forEach(m => {
                    console.log(m.name.replace('models/', ''));
                });
            } else {
                console.log("Unexpected response:", data);
            }
        } catch (e) {
            console.error("Failed to parse:", body);
        }
    });
});

req.on('error', (e) => console.error("Request failed:", e));
req.end();
