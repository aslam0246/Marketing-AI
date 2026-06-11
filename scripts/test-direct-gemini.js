
const fetch = require('node-fetch');

const KEY = "AIzaSyBeJVA7R4L6VV2VPOvVDxxlnGruAc7-VJ0";
const MODEL = "gemini-pro";
const URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${KEY}`;

async function test() {
    console.log(`Testing ${MODEL}...`);
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}

test();
