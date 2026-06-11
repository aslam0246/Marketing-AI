
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

console.log('--- Firebase Storage Auto-Detect ---');
console.log('Project ID:', serviceAccount.projectId);

try {
    initializeApp({
        credential: cert(serviceAccount)
    });

    const storage = getStorage();

    async function detect() {
        const id = serviceAccount.projectId;
        const patterns = [
            `${id}.firebasestorage.app`,
            `${id}.appspot.com`,
            `${id}-default`,
            id
        ];

        console.log('\n--- Brute-forcing common bucket names ---');
        for (const bucketName of patterns) {
            console.log(`Testing: ${bucketName}...`);
            try {
                const b = storage.bucket(bucketName);
                const [exists] = await b.exists();
                if (exists) {
                    console.log(`✅ SUCCESS! Bucket "${bucketName}" exists.`);
                    console.log(`\n👉 ACTION: Update .env.local with: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${bucketName}`);
                    return;
                } else {
                    console.log(`❌ Does not exist.`);
                }
            } catch (err) {
                console.log(`⚠️ Error testing ${bucketName}: ${err.message}`);
            }
        }
        console.log('\n❌ All common patterns failed. Please check the Firebase Console -> Storage tab for the exact bucket name.');
    }

    detect();
} catch (initError) {
    console.error('❌ Initialization failed:', initError.message);
}
