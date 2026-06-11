
// Test the new proxy route
async function testProxy() {
    const prompt = "a juicy burger with fries on a wooden table, food photography";
    const style = "photorealistic, 8k, ultra detailed";
    const seed = 42;

    const params = new URLSearchParams({ prompt, style, seed: String(seed) });
    const url = `http://localhost:3000/api/visuals/proxy?${params.toString()}`;

    console.log("Testing proxy:", url.substring(0, 100) + "...");

    try {
        const start = Date.now();
        const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
        const duration = Date.now() - start;
        console.log(`Status: ${res.status} (${duration}ms)`);
        console.log(`Content-Type: ${res.headers.get("content-type")}`);

        if (res.ok) {
            const buf = await res.arrayBuffer();
            console.log(`✅ SUCCESS! Image size: ${buf.byteLength} bytes`);
            const fs = require("fs");
            fs.writeFileSync("test-proxy-result.jpg", Buffer.from(buf));
            console.log("Saved as test-proxy-result.jpg — check if it shows a burger!");
        } else {
            const text = await res.text();
            console.error("❌ Error:", text);
        }
    } catch (e) {
        console.error("❌ Network error:", e.message);
    }
}

testProxy();
