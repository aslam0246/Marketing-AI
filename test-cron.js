import * as admin from 'firebase-admin';

// Initialize Firebase Admin (adjust path as needed to your service account key if running standalone,
// but since this is just a quick test script, we'll try to just hit the API endpoint instead)

async function test() {
    console.log("Triggering cron endpoint directly to test...");

    try {
        const res = await fetch("http://localhost:3000/api/cron/publish-scheduled");
        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
