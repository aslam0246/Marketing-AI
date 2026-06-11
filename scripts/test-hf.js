
const fetch = require('node-fetch');

const KEY = process.env.HUGGINGFACE_API_KEY || "";
const MODEL = "microsoft/Phi-3-mini-4k-instruct";
const URL = `https://api-inference.huggingface.co/models/${MODEL}`;

async function test() {
    console.log(`Testing HF ${MODEL}...`);
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: "Write a social media post about coffee.",
                parameters: { max_new_tokens: 200 }
            })
        });

        if (!res.ok) {
            console.log("Status:", res.status);
            console.log("Body:", await res.text());
        } else {
            const data = await res.json();
            console.log("Success:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

test();
