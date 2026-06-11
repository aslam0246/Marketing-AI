

// Since it's TS, let's just copy the relevant logic into this JS script to avoid compilation steps for a quick debug.

// --- MOCKED GEMINI CLIENT LOGIC START ---
const GEN_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

async function generateImage(apiKey, prompt, style = "Photorealistic") {
    const model = "gemini-2.0-flash-exp";
    const url = `${GEN_API_URL}/${model}:generateContent?key=${apiKey}`;
    const enrichedPrompt = `Generate a high-quality, ${style} image of: ${prompt}. Return a single image.`;

    console.log(`[DEBUG] Attempting Gemini Image Gen with model: ${model}`);

    try {
        const payload = { contents: [{ parts: [{ text: enrichedPrompt }] }] };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log(`[DEBUG] Gemini Response Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[DEBUG] Gemini Error Body: ${errorText}`);
            throw new Error(`Gemini Error ${response.status}`);
        }

        const data = await response.json();
        const base64Data = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

        if (!base64Data) {
            console.warn("[DEBUG] No inlineData in Gemini response. Response structure:", JSON.stringify(data, null, 2));
            throw new Error("No image data");
        }

        console.log("[DEBUG] Gemini generation successful!");
        return "SUCCESS_GEMINI";

    } catch (error) {
        console.error("[DEBUG] Gemini Generation Failed:", error.message);
        return generateImageFallback(prompt, style);
    }
}

async function generateImageFallback(prompt, style) {
    console.log("[DEBUG] Attempting Pollinations Fallback...");
    try {
        const finalPrompt = encodeURIComponent(`${prompt}, ${style} style, high quality, 4k`);
        const url = `https://image.pollinations.ai/prompt/${finalPrompt}`;

        const response = await fetch(url);
        console.log(`[DEBUG] Fallback Response Status: ${response.status}`);

        if (!response.ok) throw new Error("Fallback provider failed");

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 0) {
            console.log("[DEBUG] Fallback generation successful!");
            return "SUCCESS_FALLBACK";
        } else {
            console.error("[DEBUG] Fallback returned empty buffer");
            return null;
        }
    } catch (error) {
        console.error("[DEBUG] Fallback Failed:", error.message);
        return null;
    }
}
// --- MOCKED GEMINI CLIENT LOGIC END ---

// Main Execution
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY not found in environment.");
    process.exit(1);
}

console.log(`[DEBUG] Using API Key: ${apiKey.substring(0, 5)}...`);

(async () => {
    const result = await generateImage(apiKey, "A futuristic cyberpunk city with neon lights", "Cinematic");
    console.log("FINAL RESULT:", result);
})();
