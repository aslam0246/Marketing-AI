
import fs from 'fs';
import path from 'path';

// Force load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            let val = values.join('=');
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (!process.env[key.trim()]) {
                process.env[key.trim()] = val;
            }
        }
    });
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const IMAGEN_MODEL = "models/imagen-4.0-fast-generate-001";
const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/${IMAGEN_MODEL}:predict`;

async function verifyImagen() {
    console.log("🎨 Verifying Imagen 3 Generation...");

    if (!GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing!");
        process.exit(1);
    }

    // Fix suffix if present (as seen in route.ts)
    let finalKey = GEMINI_API_KEY;
    const suffixToRemove = "moCtobYeuVpoVQXPevkIoecJnrZvckGkLC";
    if (finalKey.endsWith(suffixToRemove)) {
        finalKey = finalKey.replace(suffixToRemove, "");
        console.log("ℹ️  Removed suffix from API Key");
    }

    try {
        console.log(`⏳ Generating image with key: ${finalKey.substring(0, 10)}...`);
        const start = Date.now();

        const response = await fetch(`${IMAGEN_URL}?key=${finalKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                    { prompt: "A futuristic city with flying cars, photorealistic, 8k" }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            }),
        });

        const duration = Date.now() - start;

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Imagen API Error: ${response.status} ${response.statusText}`);
            console.error(`Details: ${errorText}`);
            return;
        }

        const data = await response.json();

        if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            console.log(`✅ Image generated in ${duration}ms!`);
            const base64Image = data.predictions[0].bytesBase64Encoded;
            const buffer = Buffer.from(base64Image, 'base64');
            const outputPath = path.resolve(process.cwd(), 'test-imagen-output.png');
            fs.writeFileSync(outputPath, buffer);
            console.log(`💾 Saved test image to: ${outputPath}`);
        } else {
            console.error("❌ Unexpected response structure:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("❌ Imagen CRASHED:", e);
    }
}

verifyImagen();
