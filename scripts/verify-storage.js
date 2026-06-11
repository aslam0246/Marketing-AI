
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');

// Manually verify environment parsing since we are running with node --env-file
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

console.log("--- Config Check ---");
console.log(`Project ID: ${projectId}`);
console.log(`Client Email: ${clientEmail ? 'SET' : 'MISSING'}`);
console.log(`Private Key: ${privateKey ? 'SET' : 'MISSING'}`);
console.log(`Bucket Name: ${bucketName || 'MISSING'}`);
console.log("--------------------");

if (getApps().length === 0) {
    initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}

async function verifyStorage() {
    try {
        const bucketName1 = bucketName;
        const bucketName2 = projectId + '.appspot.com';

        console.log(`\nTesting Bucket 1: ${bucketName1}`);
        const bucket1 = getStorage().bucket(bucketName1);
        const [exists1] = await bucket1.exists();
        console.log(`Exists: ${exists1}`);

        console.log(`\nTesting Bucket 2: ${bucketName2}`);
        const bucket2 = getStorage().bucket(bucketName2);
        const [exists2] = await bucket2.exists();
        console.log(`Exists: ${exists2}`);

        const validBucket = exists1 ? bucket1 : (exists2 ? bucket2 : null);

        if (!validBucket) {
            console.error("\nCRITICAL: Neither bucket exists/is accessible.");
            return;
        }

        console.log(`\nUsing valid bucket: ${validBucket.name}`);


        // Try writing a small test file
        const file = bucket.file('test-verification.txt');
        await file.save('Hello verify-storage!', {
            metadata: { contentType: 'text/plain' }
        });
        console.log("Successfully wrote test file.");

        // Try signing a URL (simulates getting download URL)
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour
        });
        console.log("Successfully generated signed URL:", url);

    } catch (error) {
        console.error("STORAGE VERIFICATION FAILED:", error);
    }
}

verifyStorage();
