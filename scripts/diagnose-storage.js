
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const bucketName = 'marketingai-73957.appspot.com';

console.log('--- Firebase Storage Diagnosis ---');
console.log('Project ID:', serviceAccount.projectId);
console.log('Client Email:', serviceAccount.clientEmail);
console.log('Bucket Name:', bucketName);

if (!serviceAccount.privateKey) {
    console.error('❌ Error: FIREBASE_ADMIN_PRIVATE_KEY is missing or empty!');
    process.exit(1);
}

try {
    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketName
    });

    const bucket = getStorage().bucket();

    async function testUpload() {
        console.log('\n--- Listing Buckets ---');
        try {
            const [buckets] = await getStorage().getBuckets();
            console.log('Available buckets:');
            buckets.forEach(b => console.log(' -', b.name));

            if (buckets.length > 0) {
                console.log('\nUsing first available bucket:', buckets[0].name);
                const bucket = buckets[0];
                const destFileName = 'debug/test_' + Date.now() + '.txt';
                const file = bucket.file(destFileName);

                await file.save('Hello from diagnostic script!', {
                    metadata: { contentType: 'text/plain' }
                });
                console.log('✅ File saved successfully to:', destFileName);
            } else {
                console.log('❌ No buckets found in this project.');
            }
        } catch (listError) {
            console.error('❌ Failed to list buckets:', listError.message);
            console.error('This usually means the service account lacks \"storage.buckets.list\" permission.');
        }
    }

    testUpload();

} catch (initError) {
    console.error('❌ Initialization failed:', initError.message);
}
