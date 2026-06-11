
const fs = require("fs");

async function testProvider(name, url, options = {}) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);
    try {
        const start = Date.now();
        const response = await fetch(url, options);
        const duration = Date.now() - start;
        console.log(`Status: ${response.status} (${duration}ms)`);
        console.log(`Content-Type: ${response.headers.get("content-type")}`);

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            console.log(`✅ SUCCESS! Image size: ${buffer.byteLength} bytes`);
            // Save first success
            if (buffer.byteLength > 1000) {
                fs.writeFileSync(`test-image-${name}.jpg`, Buffer.from(buffer));
                console.log(`Saved: test-image-${name}.jpg`);
                return true;
            } else {
                console.log(`⚠️ Too small - likely not a real image`);
            }
        } else {
            const text = await response.text().catch(() => "Could not read body");
            console.log(`❌ Error: ${text.substring(0, 200)}`);
        }
    } catch (e) {
        console.error(`❌ Failed: ${e.message}`);
    }
    return false;
}

async function main() {
    const prompt = encodeURIComponent("A futuristic city, cyberpunk, neon lights, 4k");

    const results = {};

    // Option 1: Pollinations with new URL format
    results["pollinations_v1"] = await testProvider(
        "pollinations_v1",
        `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=42`
    );

    // Option 2: Pollinations with model specified
    results["pollinations_v2"] = await testProvider(
        "pollinations_v2",
        `https://image.pollinations.ai/prompt/${prompt}?model=flux&width=512&height=512&nologo=true`
    );

    // Option 3: Lexica AI (free, Stable Diffusion)
    results["lexica"] = await testProvider(
        "lexica",
        `https://lexica.art/api/v1/search?q=${prompt}&per_page=1`
    );

    console.log("\n--- RESULTS ---");
    for (const [name, success] of Object.entries(results)) {
        console.log(`${success ? "✅" : "❌"} ${name}`);
    }
}

main();
