
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
let API_KEY = "";
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/GEMINI_API_KEY=(.*)/);
    if (match && match[1]) API_KEY = match[1].trim();
}

async function test(model) {
    console.log(`Testing ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
    });
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

test("gemini-2.0-flash");
test("gemini-2.0-flash-exp");
