
const fs = require("fs");

async function testLexica() {
    console.log("--- Testing Lexica.art API ---");
    const query = "futuristic city neon lights cyberpunk";
    const url = `https://lexica.art/api/v1/search?q=${encodeURIComponent(query)}&per_page=5`;

    try {
        const res = await fetch(url, {
            headers: { "Accept": "application/json" }
        });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            const images = data.images || [];
            console.log(`Found ${images.length} images`);
            if (images.length > 0) {
                const img = images[0];
                console.log("First image URL:", img.srcSmall || img.src);

                // Now fetch actual image
                const imgRes = await fetch(img.srcSmall || img.src);
                console.log(`Image fetch status: ${imgRes.status}`);
                if (imgRes.ok) {
                    const buf = await imgRes.arrayBuffer();
                    console.log(`✅ Lexica works! Image size: ${buf.byteLength} bytes`);
                    fs.writeFileSync("test-lexica.jpg", Buffer.from(buf));
                }
            }
        } else {
            const text = await res.text();
            console.log("Error:", text.substring(0, 300));
        }
    } catch (e) {
        console.error("Lexica failed:", e.message);
    }
}

async function testUnsplash() {
    console.log("\n--- Testing Unsplash Source (no key) ---");
    // Unsplash Source directly embeds keywords
    const url = `https://source.unsplash.com/512x512/?futuristic,city,neon`;
    try {
        const res = await fetch(url, { redirect: "follow" });
        console.log(`Status: ${res.status}, Final URL: ${res.url}`);
        if (res.ok) {
            const buf = await res.arrayBuffer();
            console.log(`✅ Unsplash Source works! Image size: ${buf.byteLength}`);
            fs.writeFileSync("test-unsplash.jpg", Buffer.from(buf));
        }
    } catch (e) {
        console.error("Unsplash failed:", e.message);
    }
}

async function testPicLumen() {
    // Picsum - random images (good placeholder)
    console.log("\n--- Testing Picsum (random placeholder) ---");
    const url = "https://picsum.photos/512/512";
    try {
        const res = await fetch(url, { redirect: "follow" });
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const buf = await res.arrayBuffer();
            console.log(`✅ Picsum works! Image size: ${buf.byteLength}`);
        }
    } catch (e) {
        console.error("Picsum failed:", e.message);
    }
}

async function main() {
    await testLexica();
    await testUnsplash();
    await testPicLumen();
}

main();
