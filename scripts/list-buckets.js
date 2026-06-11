
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (getApps().length === 0) {
    initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}

async function listBuckets() {
    try {
        console.log("Attempting to list buckets...");
        const [buckets] = await getStorage().getBuckets();
        console.log("Buckets found:");
        buckets.forEach(bucket => {
            console.log(`- ${bucket.name}`);
        });

        if (buckets.length === 0) {
            console.log("No buckets found. Service Account might lack permissions.");
        }
    } catch (error) {
        console.error("Error listing buckets:", error.message);
        console.error("Full Error:", JSON.stringify(error, null, 2));
    }
}

listBuckets();
