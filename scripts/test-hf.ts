
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;

async function testModel(modelId: string, input: any) {
    console.log(`Testing ${modelId}...`);
    const url = `https://api-inference.huggingface.co/models/${modelId}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Body: ${text.substring(0, 500)}`); // Print first 500 chars

    } catch (error) {
        console.error("Fetch error:", error);
    }
    console.log("---");
}

async function main() {
    if (!API_KEY) {
        console.error("No API Key found in .env.local");
        return;
    }
    console.log("API Key found (length):", API_KEY.length);

    // Test Text Model
    await testModel("mistralai/Mistral-7B-Instruct-v0.3", { inputs: "Hello" });

    // Test Image Model
    await testModel("runwayml/stable-diffusion-v1-5", { inputs: "A cat" });

    // Test Fallback Text
    await testModel("google/gemma-2-2b-it", { inputs: "Hello" });
}

main();
