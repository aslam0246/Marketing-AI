
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

async function verifyGeminiImage() {
    console.log("🎨 Verifying Gemini Image Generation...");
    console.log(`Using Key: ${GEMINI_API_KEY.substring(0, 10)}...`);

    try {
        const response = await fetch(`${URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
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
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            console.error("Error Details:", errorText);

            if (response.status === 404) console.error("👉 Model might be incorrect or unavailable for this key.");
            if (response.status === 429) console.error("👉 Rate limit exceeded (Free Tier).");
            return;
        }

        const data = await response.json();
        const inlineData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

        if (inlineData) {
            console.log("✅ SUCCESS! Image data received.");
            console.log(`Image size: ${Math.round(inlineData.inlineData.data.length / 1024)} KB`);
        } else {
            // Sometimes it returns text if it refuses to gen image
            console.warn("⚠️ Response received but no image data found. It might have generated text instead.");
            console.log("Response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("❌ Network or Script Error:", error);
    }
}

verifyGeminiImage();
