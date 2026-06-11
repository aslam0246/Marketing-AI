
const fs = require("fs");

async function testDeepAI(prompt) {
    console.log("--- Testing DeepAI ---");
    try {
        const formData = new URLSearchParams();
        formData.append("text", prompt);

        const res = await fetch("https://api.deepai.org/api/text2img", {
            method: "POST",
            headers: {
                "api-key": "quickstart-QUdJIGlzIGF3ZXNvbWU",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString(),
            signal: AbortSignal.timeout(30000)
        });
        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data).substring(0, 300));
        if (data.output_url) {
            console.log(`✅ DeepAI SUCCESS! Downloading image from: ${data.output_url}`);
            // Now download the actual image
            const imgRes = await fetch(data.output_url);
            const buf = await imgRes.arrayBuffer();
            console.log(`Image size: ${buf.byteLength} bytes`);
            if (buf.byteLength > 5000) {
                fs.writeFileSync("test-deepai.jpg", Buffer.from(buf));
                console.log("Saved test-deepai.jpg");
                return true;
            }
        }
    } catch (e) { console.log(`DeepAI Error: ${e.message}`); }
    return false;
}

testDeepAI("a delicious juicy burger with fries, food photography, 4k quality, detailed");
