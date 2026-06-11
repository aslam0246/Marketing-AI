
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load API Key
const envPath = path.resolve(process.cwd(), '.env.local');
let API_KEY = "";
try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        if (match && match[1]) API_KEY = match[1].trim();
        if (API_KEY.startsWith('"')) API_KEY = API_KEY.slice(1, -1);
    }
} catch (e) { }

if (!API_KEY) { console.error("No API Key"); process.exit(1); }

async function testModel(model) {
    console.log(`\n--- Testing ${model} ---`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
        });

        if (!response.ok) {
            console.log(`FAILED (${response.status})`);
            console.log(await response.text());
        } else {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("SUCCESS");
            console.log("Output:", text ? text.trim() : "No text");
        }
    } catch (e) {
        console.error("Exception:", e.message);
    }
}

async function run() {
    await testModel("gemini-2.0-flash");
    await testModel("gemini-1.5-flash");
    await testModel("gemini-1.5-pro");
    await testModel("gemini-2.0-flash-exp");
}

run();
