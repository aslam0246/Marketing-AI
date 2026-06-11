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
        // Detect and fix the copy-paste error where HF key suffix was appended
        const suffixToRemove = "moCtobYeuVpoVQXPevkIoecJnrZvckGkLC";
        if (GEMINI_API_KEY.endsWith(suffixToRemove)) {
            GEMINI_API_KEY = GEMINI_API_KEY.replace(suffixToRemove, "");
        }
    }
}

const LIST_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";

async function listModels() {
    if (!GEMINI_API_KEY) {
        console.error("Missing GEMINI_API_KEY");
        return;
    }

    console.log("Listing models...");

    try {
        const response = await fetch(`${LIST_MODELS_URL}?key=${GEMINI_API_KEY}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Status:", response.status);
            console.error("API Error Text:", errorText);
        } else {
            const data = await response.json();
            console.log("\nAvailable Models:");
            if (data.models) {
                console.log("FOUND MODELS:");
                data.models.forEach(model => {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                        // Strip 'models/' prefix for easier reading if present
                        console.log(model.name);
                    }
                });
            } else {
                console.log("No models found in response:", data);
            }
        }

    } catch (error) {
        console.error("Network Error:", error);
    }
}

listModels();
