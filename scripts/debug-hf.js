
async function testHF() {
    const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    const model = "stabilityai/stable-diffusion-xl-base-1.0";
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const prompt = "A futuristic city with neon lights, 4k, cinematic";

    console.log(`Testing HF Model: ${model}`);
    console.log(`Using Key: ${apiKey ? apiKey.substring(0, 5) + "..." : "MISSING"}`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: prompt })
        });

        console.log(`Status: ${response.status}`);

        if (!response.ok) {
            console.log("Error Body:", await response.text());
        } else {
            const buffer = await response.arrayBuffer();
            console.log(`Success! Image size: ${buffer.byteLength} bytes`);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testHF();
