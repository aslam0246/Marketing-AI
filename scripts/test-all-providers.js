
const fs = require("fs");
const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;

async function testProvider(name, fn) {
    console.log(`\n===== ${name} =====`);
    try {
        const result = await fn();
        if (result && result.byteLength > 5000) {
            console.log(`✅ SUCCESS! Size: ${result.byteLength} bytes`);
            fs.writeFileSync(`out-${name}.jpg`, Buffer.from(result));
            return true;
        }
        console.log(`❌ Empty/invalid result`);
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }
    return false;
}

const prompt = "a juicy delicious burger with crispy fries";
const encoded = encodeURIComponent(prompt);

async function main() {
    const results = {};

    // Test 1: Stable Diffusion API via API.stability.ai free tier
    results.stabilityFree = await testProvider("StabilityAI-Free", async () => {
        const res = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ text_prompts: [{ text: prompt }], width: 512, height: 512 }),
            signal: AbortSignal.timeout(20000)
        });
        if (res.status === 401) { console.log("Needs API key"); return null; }
        if (!res.ok) { console.log("Status:", res.status, await res.text().then(t => t.substring(0, 100))); return null; }
        const data = await res.json();
        if (data.artifacts?.[0]?.base64) return Buffer.from(data.artifacts[0].base64, "base64");
        return null;
    });

    // Test 2: HuggingFace with x-wait-for-model (retry logic)
    if (hfKey) {
        results.hfSDXL = await testProvider("HF-SDXL", async () => {
            const url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
            for (let i = 0; i < 3; i++) {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${hfKey}`, "Content-Type": "application/json", "x-wait-for-model": "true" },
                    body: JSON.stringify({ inputs: prompt }),
                    signal: AbortSignal.timeout(60000)
                });
                console.log(`  Attempt ${i + 1}: ${res.status} ${res.headers.get("content-type")}`);
                if (res.ok) {
                    const buf = await res.arrayBuffer();
                    if (buf.byteLength > 5000) return buf;
                }
                const txt = await res.text().catch(() => "");
                console.log(`  Response: ${txt.substring(0, 200)}`);
                if (res.status !== 503) break;
                await new Promise(r => setTimeout(r, 5000));
            }
            return null;
        });

        // Test 3: HuggingFace FLUX.1-schnell
        results.hfFlux = await testProvider("HF-FLUX-schnell", async () => {
            const url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
            const res = await fetch(url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${hfKey}`, "Content-Type": "application/json", "x-wait-for-model": "true" },
                body: JSON.stringify({ inputs: prompt }),
                signal: AbortSignal.timeout(60000)
            });
            console.log(`  Status: ${res.status} ${res.headers.get("content-type")}`);
            if (res.ok) return await res.arrayBuffer();
            const txt = await res.text().catch(() => "");
            console.log(`  Response: ${txt.substring(0, 300)}`);
            return null;
        });
    }

    // Test 4: Imagen via a different endpoint
    results.pollinationsAlt = await testProvider("Pollinations-Alt", async () => {
        const res = await fetch(`https://image.pollinations.ai/prompt/${encoded}?width=512&height=512`, {
            headers: { "Referer": "https://image.pollinations.ai/", "User-Agent": "curl/7.88.1" },
            signal: AbortSignal.timeout(30000)
        });
        console.log(`  Status: ${res.status}`);
        if (res.ok) return await res.arrayBuffer();
        return null;
    });

    console.log("\n===== SUMMARY =====");
    for (const [name, ok] of Object.entries(results)) {
        console.log(`${ok ? "✅" : "❌"} ${name}`);
    }
}

main();
