
async function testPollinations() {
    const prompt = "A futuristic cyberpunk city";
    const style = "cyberpunk";
    const finalPrompt = encodeURIComponent(`${prompt}, ${style} style, high quality, 4k`);
    const url = `https://image.pollinations.ai/prompt/${finalPrompt}`;

    console.log(`Testing URL: ${url}`);

    try {
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers.get("content-type")}`);

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

testPollinations();
