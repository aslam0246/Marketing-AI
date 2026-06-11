
const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Load API Key manually from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let API_KEY = "";
try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        if (match && match[1]) API_KEY = match[1].trim();
    }
} catch (e) { console.error("Error reading .env", e); }

const MODEL = "gemini-2.0-flash-exp";
// Note: Google's API path for this model
const HOST = 'generativelanguage.googleapis.com';
const PATH = `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testGen() {
    console.log("🧪 Starting Gemini Image Gen Verification (JS Mode)...");
    console.log(`🔑 Key detected: ${API_KEY ? "Yes (" + API_KEY.substring(0, 5) + "...)" : "No ❌"}`);

    if (!API_KEY) {
        console.error("❌ Error: GEMINI_API_KEY is missing.");
        process.exit(1);
    }

    const payload = JSON.stringify({
        contents: [
            { parts: [{ text: "A cute robot painting a canvas, vector art style" }] }
        ],
        generationConfig: {
            responseMimeType: "image/jpeg"
        }
    });

    const options = {
        hostname: HOST,
        path: PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    console.log("🚀 Sending request...");

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            if (res.statusCode !== 200) {
                console.error(`❌ API Failed [${res.statusCode}]`);
                console.error(`details: ${body}`);
                return;
            }

            try {
                const data = JSON.parse(body);
                const inlineData = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

                if (inlineData) {
                    console.log("✅ SUCCESS! Image blob received.");
                    console.log(`📦 Size: ${inlineData.inlineData.data.length} chars (Base64)`);
                    console.log("🎉 Verification PASSED.");
                } else {
                    console.warn("⚠️ Response OK but no image found.");
                    console.log(JSON.stringify(data, null, 2));
                }
            } catch (e) {
                console.error("Parse Error:", e);
            }
        });
    });

    req.on('error', (e) => console.error("Request Error:", e));
    req.write(payload);
    req.end();
}

testGen();
