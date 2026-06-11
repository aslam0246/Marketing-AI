
const fs = require("fs");

// Test Pollinations v2 with model parameter
async function testPollinationsV2(prompt, model = "flux") {
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100)}`;
    console.log(`\n--- Testing Pollinations (model=${model}) ---`);
    console.log(`URL: ${url.substring(0, 100)}...`);
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        console.log(`Status: ${res.status}, Content-Type: ${res.headers.get("content-type")}`);
        if (res.ok) {
            const buf = await res.arrayBuffer();
            if (buf.byteLength > 5000) {
                console.log(`✅ SUCCESS! Size: ${buf.byteLength} bytes`);
                fs.writeFileSync(`test-pollinations-${model}.jpg`, Buffer.from(buf));
                return true;
            }
        }
        const text = await res.text().catch(() => "");
        console.log(`❌ FAIL: ${text.substring(0, 100)}`);
    } catch (e) { console.log(`❌ Error: ${e.message}`); }
    return false;
}

// Test HuggingFace with retry (handles model loading)
async function testHFWithRetry(apiKey, model, prompt) {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    console.log(`\n--- Testing HF: ${model} ---`);
    for (let i = 0; i < 3; i++) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ inputs: prompt }),
                signal: AbortSignal.timeout(30000)
            });
            console.log(`Attempt ${i + 1} Status: ${res.status}`);
            if (res.ok) {
                const buf = await res.arrayBuffer();
                if (buf.byteLength > 5000) {
                    console.log(`✅ HF SUCCESS! Size: ${buf.byteLength} bytes`);
                    fs.writeFileSync(`test-hf-${model.split("/")[1]}.jpg`, Buffer.from(buf));
                    return true;
                }
            }
            const text = await res.text().catch(() => "");
            console.log(`Response: ${text.substring(0, 200)}`);
            if (res.status === 503) {
                console.log("Model loading, waiting 5s...");
                await new Promise(r => setTimeout(r, 5000));
            } else break;
        } catch (e) { console.log(`Error: ${e.message}`); break; }
    }
    return false;
}

async function main() {
    const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    const prompt = "a delicious juicy burger with fries on a wooden table, food photography, 4k";

    console.log("HF Key present:", !!hfKey);

    // Test Pollinations v2 with different models
    await testPollinationsV2(prompt, "flux");
    await testPollinationsV2(prompt, "turbo");

    // Test HF with models that are usually warm
    if (hfKey) {
        await testHFWithRetry(hfKey, "runwayml/stable-diffusion-v1-5", prompt);
        await testHFWithRetry(hfKey, "stabilityai/stable-diffusion-2-1", prompt);
    }
}

main();
