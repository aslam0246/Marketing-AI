
const fs = require("fs");

async function testHFCorrect(apiKey, prompt) {
    // HuggingFace updated its inference API - the new URL format
    const models = [
        "black-forest-labs/FLUX.1-schnell",
        "stabilityai/stable-diffusion-xl-base-1.0",
        "runwayml/stable-diffusion-v1-5"
    ];

    for (const model of models) {
        const url = `https://api-inference.huggingface.co/models/${model}`;
        console.log(`\n--- Testing HF: ${model} ---`);
        for (let i = 0; i < 2; i++) {
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "x-wait-for-model": "true"
                    },
                    body: JSON.stringify({ inputs: prompt }),
                    signal: AbortSignal.timeout(45000)
                });
                console.log(`Status: ${res.status}, Content-Type: ${res.headers.get("content-type")}`);
                if (res.ok) {
                    const buf = await res.arrayBuffer();
                    if (buf.byteLength > 5000) {
                        console.log(`✅ SUCCESS! ${model} - Size: ${buf.byteLength} bytes`);
                        const name = model.split("/")[1];
                        fs.writeFileSync(`test-hf-${name}.jpg`, Buffer.from(buf));
                        return model;
                    }
                }
                const text = await res.text().catch(() => "");
                console.log(`Response: ${text.substring(0, 300)}`);
                if (res.status === 503) {
                    console.log("Model loading, waiting 8s...");
                    await new Promise(r => setTimeout(r, 8000));
                } else break;
            } catch (e) {
                console.log(`Error: ${e.message}`);
                break;
            }
        }
    }
    return null;
}

// Test DeepAI (truly free, no account needed for basic use)
async function testDeepAI(prompt) {
    console.log("\n--- Testing DeepAI ---");
    try {
        const formData = new FormData();
        formData.append("text", prompt);

        const res = await fetch("https://api.deepai.org/api/text2img", {
            method: "POST",
            headers: { "api-key": "quickstart-QUdJIGlzIGF3ZXNvbWU" },
            body: formData,
            signal: AbortSignal.timeout(30000)
        });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log("Response:", JSON.stringify(data).substring(0, 200));
            if (data.output_url) {
                console.log(`✅ DeepAI SUCCESS! URL: ${data.output_url}`);
                return data.output_url;
            }
        }
    } catch (e) { console.log(`DeepAI Error: ${e.message}`); }
    return null;
}

async function main() {
    const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    const prompt = "a delicious juicy burger with fries on a wooden table, food photography";

    console.log("HF Key:", hfKey ? hfKey.substring(0, 8) + "..." : "MISSING");

    // Test DeepAI first (quickest)
    const deepAIUrl = await testDeepAI(prompt);

    // Test HF with correct headers
    if (hfKey) {
        const workingModel = await testHFCorrect(hfKey, prompt);
        console.log(`\nWorking HF Model: ${workingModel || "NONE"}`);
    }
}

main();
