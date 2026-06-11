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
        // Fix potential copy-paste corruption
        const suffixToRemove = "moCtobYeuVpoVQXPevkIoecJnrZvckGkLC";
        if (GEMINI_API_KEY.endsWith(suffixToRemove)) {
            GEMINI_API_KEY = GEMINI_API_KEY.replace(suffixToRemove, "");
        }
    }
}

const DATA_MODELS = [
    "models/gemini-2.5-flash",
    "models/gemini-2.5-pro",
    "models/gemini-2.0-flash-exp",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-pro"
];

async function testGeminiPrompt() {
    if (!GEMINI_API_KEY) {
        console.error("Missing GEMINI_API_KEY");
        return;
    }

    const topic = "City street";
    const context = "Cyberpunk style";
    const prompt = `Describe a ${context} ${topic}.`;

    for (const model of DATA_MODELS) {
        console.log(`\n--- Testing Model: ${model} ---`);
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`;

        try {
            const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                }),
            });

            if (response.ok) {
                console.log(`✅ SUCCESS with ${model}!`);
                const data = await response.json();
                console.log("Output:", data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) + "...");
                return; // Stop looking if we found one
            } else {
                console.log(`❌ FAILED ${model}: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ ERROR ${model}:`, error.message);
        }
    }
    console.log("\nAll models failed.");
}

testGeminiPrompt();
