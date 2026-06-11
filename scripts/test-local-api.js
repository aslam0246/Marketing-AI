
const fetch = require('node-fetch');

async function testGeminiAPI() {
    try {
        console.log("Testing /api/gemini...");
        const response = await fetch('http://localhost:3000/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: "Write a short test social media post about coffee."
            })
        });

        if (!response.ok) {
            console.error(`Status: ${response.status}`);
            const text = await response.text();
            console.error("Body:", text);
        } else {
            const data = await response.json();
            console.log("Success! Output:", data);
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testGeminiAPI();
