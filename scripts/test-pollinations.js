const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testPollinations() {
    console.log("Testing Pollinations AI...");
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful expert social media assistant.' },
                    { role: 'user', content: 'Say hello.' }
                ],
                model: 'openai',
                seed: Math.floor(Math.random() * 1000)
            })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error(`Fetch failed: ${e.message}`);
    }
}

testPollinations();
