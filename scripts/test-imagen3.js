
const fs = require("fs");
const apiKey = process.env.GEMINI_API_KEY;

async function testImagen3() {
    console.log("=== Testing Imagen 3 (generateImages endpoint) ===");

    // This is a DIFFERENT endpoint from generateContent
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: "a juicy burger with fries on a wooden table, food photography",
                numberOfImages: 1,
                aspectRatio: "1:1",
                safetyFilterLevel: "BLOCK_ONLY_HIGH"
            }),
            signal: AbortSignal.timeout(30000)
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text.substring(0, 500));

        if (res.ok) {
            const data = JSON.parse(text);
            const imgData = data.generatedImages?.[0]?.image?.imageBytes;
            if (imgData) {
                const buf = Buffer.from(imgData, "base64");
                fs.writeFileSync("test-imagen3.jpg", buf);
                console.log("✅ SUCCESS! Saved test-imagen3.jpg, size:", buf.length);
                return true;
            }
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
    return false;
}

async function testImagenFast() {
    console.log("\n=== Testing Imagen 3 Fast ===");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:generateImages?key=${apiKey}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: "a juicy burger with fries, food photography",
                numberOfImages: 1,
                aspectRatio: "1:1"
            }),
            signal: AbortSignal.timeout(30000)
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text.substring(0, 500));

        if (res.ok) {
            const data = JSON.parse(text);
            const imgData = data.generatedImages?.[0]?.image?.imageBytes;
            if (imgData) {
                const buf = Buffer.from(imgData, "base64");
                fs.writeFileSync("test-imagen-fast.jpg", buf);
                console.log("✅ SUCCESS! Size:", buf.length);
                return true;
            }
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
    return false;
}

async function testGeminiWithImageModality() {
    console.log("\n=== Testing Gemini 2.0 Flash Image Generation ===");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Generate an image of a juicy burger with fries" }] }],
                generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
            }),
            signal: AbortSignal.timeout(30000)
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text.substring(0, 500));

        if (res.ok) {
            const data = JSON.parse(text);
            const parts = data.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                if (part.inlineData?.data) {
                    const buf = Buffer.from(part.inlineData.data, "base64");
                    fs.writeFileSync("test-gemini-img.jpg", buf);
                    console.log("✅ SUCCESS! Size:", buf.length);
                    return true;
                }
            }
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
    return false;
}

async function main() {
    if (!apiKey) { console.error("No GEMINI_API_KEY!"); return; }
    console.log("API Key:", apiKey.substring(0, 8) + "...");

    await testImagen3();
    await testImagenFast();
    await testGeminiWithImageModality();
}

main();
