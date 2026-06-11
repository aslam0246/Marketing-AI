
const { Storage } = require('@google-cloud/storage');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

console.log('--- Cloud Storage Bucket Hunter ---');
console.log('Project ID:', projectId);

const storage = new Storage({
    projectId: projectId,
    credentials: {
        client_email: clientEmail,
        private_key: privateKey,
    }
});

async function hunt() {
    try {
        console.log('Attempting to list ALL buckets in this project...');
        const [buckets] = await storage.getBuckets();

        if (buckets.length === 0) {
            console.log('❌ No buckets found in project:', projectId);
        } else {
            console.log('✅ Found', buckets.length, 'buckets:');
            buckets.forEach(b => console.log(' -', b.name));
        }
    } catch (error) {
        console.error('❌ Error listing buckets:', error.message);
        console.error('Code:', error.code);
    }
}

hunt();
