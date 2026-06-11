
const fetch = require('node-fetch');

async function testLocalAPI() {
    console.log("Testing Local API Flow...");
    try {
        const response = await fetch('http://localhost:3000/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: "Task: Write a short, unique tweet about 'Red Apples'."
            })
        });

        if (!response.ok) {
            console.error(`Error Status: ${response.status}`);
            console.error(await response.text());
        } else {
            const data = await response.json();
            console.log("--- Generated Content ---");
            console.log(data.generated_text);
            console.log("-------------------------");
            if (data.generated_text && data.generated_text.length > 10) {
                console.log("VERIFICATION PASSED: Content generated.");
            } else {
                console.log("VERIFICATION FAILED: No content.");
            }
        }
    } catch (error) {
        console.error("Connection Failed:", error.message);
    }
}

testLocalAPI();
