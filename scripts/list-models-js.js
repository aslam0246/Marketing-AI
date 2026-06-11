
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
    }
} catch (e) { }

if (!API_KEY) {
    console.error("No API Key");
    process.exit(1);
}

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${API_KEY}`,
    method: 'GET',
};

console.log("🔍 Listing Models...");

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => {
        const data = JSON.parse(body);
        if (data.models) {
            console.log("Found models:");
            data.models.forEach(m => {
                if (m.name.includes("flash") || m.name.includes("image") || m.name.includes("exp")) {
                    console.log(`- ${m.name} [${m.supportedGenerationMethods.join(", ")}]`);
                }
            });
        } else {
            console.log("Error:", data);
        }
    });
});
req.end();
