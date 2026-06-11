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
            process.env[key.trim()] = val;
        }
    });
}

// Mocking fetch and Blob for Node environment since generateImage uses web APIs
if (!global.fetch) {
    console.warn("⚠️ Fetch API missing in this Node environment. This test might fail if not polyfilled.");
}

async function verifyImageGen() {
    console.log("🎨 Verifying Image Generation (Stable Diffusion XL)...");

    if (!process.env.HUGGINGFACE_API_KEY) {
        console.error("❌ HUGGINGFACE_API_KEY is missing!");
        process.exit(1);
    }

    // We need to dynamically import because the module uses 'fetch' which might need polyfill in some node versions,
    // but Node 18+ has it. Assuming Node 18+.
    const { generateImage } = await import("../lib/content-engine/ai-provider");

    try {
        const start = Date.now();
        console.log("⏳ Generating image for 'A futuristic city with flying cars'...");

        const blob = await generateImage("A futuristic city with flying cars, highly detailed, 8k");

        const duration = Date.now() - start;

        if (blob) {
            console.log(`✅ Image generated in ${duration}ms!`);
            console.log(`📦 Size: ${blob.size} bytes`);

            // Convert Blob to Buffer to save to disk
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const outputPath = path.resolve(process.cwd(), 'test-image-output.jpg');

            fs.writeFileSync(outputPath, buffer);
            console.log(`💾 Saved test image to: ${outputPath}`);
            console.log("👉 You can open this file to see the result!");
        } else {
            console.error("❌ Failed: Image Blob was null.");
        }

    } catch (e) {
        console.error("❌ Image Generation CRASHED:", e);
    }
}

verifyImageGen();
