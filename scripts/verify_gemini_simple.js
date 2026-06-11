
const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple .env parser since we can't rely on dependencies
const envPath = path.resolve(process.cwd(), '.env.local');
let GEMINI_API_KEY = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
        GEMINI_API_KEY = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env.local");
}

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

console.log("🎨 Verifying Gemini Image Generation...");
console.log(`Using Key: ${GEMINI_API_KEY.substring(0, 10)}...`);

const data = JSON.stringify({
    contents: [
        {
            parts: [
                { text: "Generate a photorealistic image of a futuristic city with flying cars." }
            ]
        }
    ],
    generationConfig: {
        responseMimeType: "image/jpeg"
    }
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`❌ API Request Failed: ${res.statusCode}`);
            console.error("Error Details:", responseBody);

            if (res.statusCode === 404) console.error("👉 Model might be incorrect or unavailable for this key.");
            if (res.statusCode === 400) console.error("👉 Bad Request (Check model name or parameters).");
            if (res.statusCode === 429) console.error("👉 Rate limit exceeded (Free Tier).");
        } else {
            const parsedData = JSON.parse(responseBody);
            const inlineData = parsedData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (inlineData) {
                console.log("✅ SUCCESS! Image data received.");
                console.log(`Image size: ${Math.round(inlineData.inlineData.data.length / 1024)} KB`);
            } else {
                console.warn("⚠️ Response received but no image data found. It might have generated text instead.");
                console.log("Response:", JSON.stringify(parsedData, null, 2));
            }
        }
    });
});

req.on('error', (error) => {
    console.error("❌ Network or Script Error:", error);
});

req.write(data);
req.end();
