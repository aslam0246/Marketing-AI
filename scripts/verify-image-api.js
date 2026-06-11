
async function verifyImageApi() {
    const url = "http://localhost:3000/api/visuals/generate";
    const payload = {
        prompt: "A cute robot analyzing data, 3d render",
        style: "3D Model"
    };

    console.log(`Sending request to ${url}...`);
    const start = Date.now();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);
        const duration = Date.now() - start;
        console.log(`Response Status: ${response.status} (${duration}ms)`);
        console.log(`Content-Type: ${response.headers.get("content-type")}`);

        if (!response.ok) {
            const body = await response.text();
            console.error("Error Body:", body);
            process.exit(1);
        }

        const data = await response.json();

        if (data.success && data.imageUrl && data.imageUrl.startsWith("data:image/")) {
            console.log("✅ SUCCESS: Received valid base64 image data.");
            console.log(`Image Data Length: ${data.imageUrl.length} chars`);
        } else {
            console.error("❌ FAILED: Invalid response structure", JSON.stringify(data).substring(0, 300));
            process.exit(1);
        }

    } catch (error) {
        console.error("Network/Server Error:", error.message);
        process.exit(1);
    }
}

verifyImageApi();
