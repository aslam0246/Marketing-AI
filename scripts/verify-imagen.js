
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

// Imagen 3.0 specific endpoint
const MODEL = "imagen-3.0-generate-001";
const HOST = 'generativelanguage.googleapis.com';
const PATH = `/v1beta/models/${MODEL}:predict?key=${API_KEY}`;

const payload = JSON.stringify({
    instances: [
        { prompt: "A watercolor painting of a mountain landscape" }
    ],
    parameters: {
        sampleCount: 1,
        aspectRatio: "1:1"
    }
});

console.log(`🧪 Testing ${MODEL} (Predict Endpoint)...`);

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
            // Imagen returns: { predictions: [ { bytesBase64Encoded: "..." } ] }
            const image = data.predictions?.[0]?.bytesBase64Encoded;

            if (image) {
                console.log("✅ IMAGEN SUCCESS!");
                console.log("Size:", image.length);
            } else {
                console.log("❌ FAILURE / UNKNOWN:");
                console.log(JSON.stringify(data, null, 2));
            }
        } catch (e) { console.log("Raw Body:", body); }
    });
});
req.write(payload);
req.end();
