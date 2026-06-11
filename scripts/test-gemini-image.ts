
import fs from 'fs';
import path from 'path';

// Force load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, ...values] = line.split('=');
        if (key) {
            let val = values.join('=');
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (!process.env[key.trim()]) process.env[key.trim()] = val;
        }
    });
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODELS_TO_TRY = [
    "models/gemini-2.0-flash-exp-image-generation",
    "models/gemini-2.5-flash-image-preview",
    "models/gemini-2.5-flash-image"
];

async function verifyGeminiImage() {
    console.log(`🎨 Verifying Gemini Image Gen...`);

    if (!GEMINI_API_KEY) {
        console.error("❌ Key missing");
        return;
    }

    // Fix suffix
    let finalKey = GEMINI_API_KEY;
    const suffixToRemove = "moCtobYeuVpoVQXPevkIoecJnrZvckGkLC";
    if (finalKey.endsWith(suffixToRemove)) {
        finalKey = finalKey.replace(suffixToRemove, "");
    }

    for (const model of MODELS_TO_TRY) {
        console.log(`\n🤖 With model using content generation: ${model}`);
        const URL = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`;

        try {
            console.log(`⏳ Generating...`);
            const start = Date.now();

            const response = await fetch(`${URL}?key=${finalKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        { parts: [{ text: "Generate a photorealistic image of a futuristic city with flying cars." }] }
                    ],
                }),
            });

            const duration = Date.now() - start;

            if (!response.ok) {
                console.error(`❌ Error (${model}): ${response.status} ${response.statusText}`);
                const txt = await response.text();
                // Check if it is a quota error
                if (txt.includes("retryDelay") || response.status === 429) {
                    console.log("⚠️ Quota/Rate Limit hit. Waiting 5s before next model...");
                    await new Promise(r => setTimeout(r, 5000));
                }
                continue;
            }

            const data = await response.json();

            if (data.candidates?.[0]?.content?.parts) {
                const parts = data.candidates[0].content.parts;
                const imagePart = parts.find((p: any) => p.inlineData);

                if (imagePart) {
                    console.log(`✅ Success with ${model}! MimeType: ${imagePart.inlineData.mimeType}`);
                    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
                    const outputName = `test-${model.replace("models/", "").replace(/[^a-zA-Z0-9]/g, "-")}.png`;
                    const outputPath = path.resolve(process.cwd(), outputName);
                    fs.writeFileSync(outputPath, buffer);
                    console.log(`💾 Saved image to ${outputName}`);
                    return; // STOP on success
                } else {
                    console.log(`⚠️ ${model} returned text only.`);
                }
            } else {
                console.log(`⚠️ No candidates/content in response.`);
            }
        } catch (e) {
            console.error("❌ CRASH:", e);
        }
    }
    console.log("❌ All models failed.");
}

verifyGeminiImage();
