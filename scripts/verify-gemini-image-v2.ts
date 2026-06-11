
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Manually load .env.local to avoid dependency issues if dotenv isn't configured for custom paths
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash-exp";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testGen() {
    console.log("🧪 Starting Gemini Image Gen Verification...");
    console.log(`🔑 Key detected: ${API_KEY ? "Yes (" + API_KEY.substring(0, 5) + "...)" : "No ❌"}`);
    console.log(`🤖 Model: ${MODEL}`);

    if (!API_KEY) {
        console.error("❌ Error: GEMINI_API_KEY is missing from .env.local");
        process.exit(1);
    }

    const payload = {
        contents: [
            { parts: [{ text: "A futuristic city with flying cars, neon lights, photorealistic, 8k" }] }
        ],
        generationConfig: {
            responseMimeType: "image/jpeg"
        }
    };

    try {
        console.log("🚀 Sending request...");
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Failed [${response.status}]: ${response.statusText}`);
            console.error(`details: ${errorText}`);
            return;
        }

        const data = await response.json();
        // Updated parsing logic for Gemini 2.0 structure
        const inlineData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

        if (inlineData) {
            console.log("✅ SUCCESS! Image blob received.");
            console.log(`📦 Size: ${inlineData.inlineData.data.length} chars (Base64)`);
            console.log("🎉 Verification PASSED. The API key and Model are working.");
        } else {
            console.warn("⚠️ Response OK but no image found. Did it generate text instead?");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("❌ Script Error:", e);
    }
}

testGen();
