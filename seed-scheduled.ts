import * as admin from 'firebase-admin';

// Initialize firebase admin with standard approach
const firebaseConfig = {
    // We can just rely on GOOGLE_APPLICATION_CREDENTIALS if it exists, 
    // or use the existing service account from the project.
    // Actually, we can just use the project's internal logic.
};

// Let's use the local file since we are inside the project
import { adminDb } from './lib/firebase-admin.ts';

async function seed() {
    try {
        console.log("Creating dummy scheduled post...");

        // Find an existing user or just use a dummy user
        const users = await adminDb.collection("users").limit(1).get();
        const userId = users.empty ? "mock-user-id" : users.docs[0].id;

        // Schedule it 5 minutes in the PAST so it's "due"
        const pastDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const docRef = await adminDb.collection("posts").add({
            userId,
            content: "This is a test scheduled auto-publish post",
            platform: "MockPlatform",
            status: "scheduled",
            scheduledAt: pastDate,
            topic: "Cron Test",
            createdAt: new Date().toISOString()
        });

        console.log(`Created scheduled post: ${docRef.id}`);
        console.log("Run the cron endpoint to see if it publishes!");
    } catch (e) {
        console.error("Error seeding:", e);
    }
}

seed();
