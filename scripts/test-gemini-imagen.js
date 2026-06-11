const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envLocalPath = path.resolve(process.cwd(), '.env.local');
let GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY && fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        GEMINI_API_KEY = match[1].trim();
        const suffixToRemove = "moCtobYeuVpoVQXPevkIoecJnrZvckGkLC";
        if (GEMINI_API_KEY.endsWith(suffixToRemove)) {
            GEMINI_API_KEY = GEMINI_API_KEY.replace(suffixToRemove, "");
        }
    }
}

async function testImagen() {
    if (!GEMINI_API_KEY) {
        console.error("Missing GEMINI_API_KEY");
        return;
    }

    console.log("Testing Gemini Imagen Capability...");

    // Using the REST API for Imagen (if available as a model)
    // Note: Imagen typically isn't available on the standard v1beta/models endpoint for free keys, 
    // but we check if it is listed or if we can hit the endpoint.

    const prompt = "A futuristic city with flying cars, cyberpunk style, high detail";

    // Currently, Imagen 3 is rolling out. Let's try to hit the specific generateImages endpoint if possible,
    // or the generateContent with a specific model that supports it.
    // However, the standard REST API for gemini-pro-vision is input only.
    // Truly generated images usually come from Vertex AI or specific new beta endpoints.
    // Let's try the newest known endpoint pattern for imagen-3 if accessible via API key.

    // Strategy: Try the standard model listing first to see if 'imagen' appears.

    console.log("Checking model list for 'imagen'...");
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

    try {
        const listResp = await fetch(listUrl);
        const listData = await listResp.json();

        const imagenModels = listData.models?.filter(m => m.name.includes("imagen"));

        if (imagenModels && imagenModels.length > 0) {
            console.log("Has Imagen models:");
            imagenModels.forEach(m => {
                console.log(`- ${m.name}`);
                console.log(`  Methods: ${JSON.stringify(m.supportedGenerationMethods)}`);
            });
        } else {
            console.log("No explicit 'imagen' models found in standard list.");
        }

    } catch (e) {
        console.error("List failed:", e.message);
    }
}

testImagen();
