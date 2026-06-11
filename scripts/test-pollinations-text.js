
const fetch = require('node-fetch');

async function test() {
    console.log("Testing Pollinations Text...");
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Write a haiku about code.' }
                ],
                model: 'openai'
            })
        });

        if (!response.ok) {
            console.log("Status:", response.status);
            const text = await response.text();
            console.log("Body:", text);
        } else {
            const data = await response.text(); // Pollinations often returns raw text
            console.log("Success:", data);
        }
    } catch (e) {
        console.error(e);
    }
}

test();
