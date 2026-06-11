
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

console.log("Checking Environment Variables...");
console.log("PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "OK" : "MISSING");
console.log("CLIENT_EMAIL:", process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? "OK" : "MISSING");
console.log("PRIVATE_KEY:", process.env.FIREBASE_ADMIN_PRIVATE_KEY ? (process.env.FIREBASE_ADMIN_PRIVATE_KEY.length > 50 ? "OK & VALID LENGTH" : "SHORT/INVALID") : "MISSING");
console.log("STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "OK" : "MISSING");

try {
    console.log("\nInitializing Firebase Admin...");

    const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log("App Initialized.");
    }

    const db = getFirestore();
    console.log("Firestore initialized.");

    const storage = getStorage();
    const bucket = storage.bucket();
    console.log("Storage Bucket initialized:", bucket.name);

    console.log("\n✅ Admin Setup seems correct.");

} catch (error) {
    console.error("\n❌ Setup FAILED:", error);
}
