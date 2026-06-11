
const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.resolve(process.cwd(), '.env.local');
let API_KEY = "";
try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        if (match && match[1]) API_KEY = match[1].trim();
    }
} catch (e) { }

const MODEL = "gemini-2.0-flash-exp";
const HOST = 'generativelanguage.googleapis.com';
const PATH = `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Simplified payload: Just asking for it, no config enforcement
const payload = JSON.stringify({
    contents: [
        { parts: [{ text: "Generate a pixel art image of a cat." }] }
    ]
});

console.log(`🧪 Testing ${MODEL} (Simple)...`);

const req = https.request({
    hostname: HOST,
    path: PATH,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            const part = data.candidates?.[0]?.content?.parts?.[0];

            if (part?.inlineData) {
                console.log("✅ IMAGE RECEIVED!");
                console.log("Size:", part.inlineData.data.length);
            } else if (part?.text) {
                console.log("⚠️ TEXT RECEIVED INSTEAD:");
                console.log(part.text.substring(0, 200));
            } else {
                console.log("❌ UNKNOWN RESPONSE:");
                console.log(JSON.stringify(data, null, 2));
            }
        } catch (e) { console.error(e); }
    });
});
req.write(payload);
req.end();
