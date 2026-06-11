
const fs = require("fs");

async function testGeminiImage(apiKey, model, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log(`\n--- Testing: ${model} ---`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
            }),
            signal: AbortSignal.timeout(20000)
        });

        console.log(`Status: ${res.status}`);
        if (!res.ok) {
            const txt = await res.text();
            console.log("Error:", txt.substring(0, 300));
            return false;
        }

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData) {
                console.log(`✅ Image found! MIME: ${part.inlineData.mimeType}, Data length: ${part.inlineData.data?.length}`);
                const buf = Buffer.from(part.inlineData.data, "base64");
                fs.writeFileSync(`test-gemini-${model}.jpg`, buf);
                return true;
            }
        }
        console.log("No image in response. Parts:", JSON.stringify(parts).substring(0, 200));
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
    return false;
}

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error("No GEMINI_API_KEY!"); process.exit(1); }
    console.log("Key:", apiKey.substring(0, 8) + "...");

    const prompt = "a delicious juicy burger with fries, food photography, 4k";
    const models = [
        "gemini-2.0-flash-preview-image-generation",
        "gemini-2.0-flash-exp-image-generation",
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash"
    ];

    for (const model of models) {
        const success = await testGeminiImage(apiKey, model, prompt);
        if (success) { console.log(`\n✅ WINNER: ${model}`); break; }
    }
}

main();
