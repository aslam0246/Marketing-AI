
const fs = require("fs");

// Prodia - Free API, Stable Diffusion, no card needed
async function testProdia(prompt) {
    console.log("\n--- Testing Prodia.com ---");
    try {
        // Step 1: Start a generation job
        const createRes = await fetch("https://api.prodia.com/v1/sdxl/generate", {
            method: "POST",
            headers: {
                "X-Prodia-Key": "6483c6a7-6dd5-4afd-84c8-aabd98c58a4a",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "dreamshaperXL10_alpha2.safetensors [c8afe2ef]",
                prompt: prompt,
                negative_prompt: "ugly, blurry, low quality",
                steps: 20,
                cfg_scale: 7
            }),
            signal: AbortSignal.timeout(15000)
        });
        console.log(`Create Status: ${createRes.status}`);
        const createData = await createRes.json();
        console.log("Create Data:", JSON.stringify(createData).substring(0, 200));

        if (createData.job) {
            // Step 2: Poll for result
            const jobId = createData.job;
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 3000));
                const statusRes = await fetch(`https://api.prodia.com/v1/job/${jobId}`, {
                    headers: { "X-Prodia-Key": "6483c6a7-6dd5-4afd-84c8-aabd98c58a4a" }
                });
                const statusData = await statusRes.json();
                console.log(`Poll ${i + 1}: ${statusData.status} - ${statusData.imageUrl || ""}`);
                if (statusData.status === "succeeded" && statusData.imageUrl) {
                    const imgRes = await fetch(statusData.imageUrl);
                    const buf = await imgRes.arrayBuffer();
                    console.log(`✅ Prodia SUCCESS! Size: ${buf.byteLength} bytes`);
                    fs.writeFileSync("test-prodia.jpg", Buffer.from(buf));
                    return true;
                }
                if (statusData.status === "failed") break;
            }
        }
    } catch (e) { console.log(`Prodia Error: ${e.message}`); }
    return false;
}

// Try the HuggingFace serverless inference router (new format)
async function testHFRouter(apiKey, prompt) {
    console.log("\n--- Testing HuggingFace Router API ---");
    const url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-Wait-For-Model": "true"
            },
            body: JSON.stringify({ inputs: prompt }),
            signal: AbortSignal.timeout(60000)
        });
        console.log(`Status: ${res.status}, Content-Type: ${res.headers.get("content-type")}`);
        if (res.ok && res.headers.get("content-type")?.includes("image")) {
            const buf = await res.arrayBuffer();
            console.log(`✅ HF Router SUCCESS! Size: ${buf.byteLength} bytes`);
            fs.writeFileSync("test-hf-router.jpg", Buffer.from(buf));
            return true;
        } else {
            const text = await res.text();
            console.log("Response:", text.substring(0, 400));
        }
    } catch (e) { console.log(`Error: ${e.message}`); }
    return false;
}

async function main() {
    const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    const prompt = "a delicious juicy burger with fries, food photography, 4k quality";

    if (hfKey) await testHFRouter(hfKey, prompt);
    await testProdia(prompt);
}

main();
