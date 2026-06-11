
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Use native env loading or manual since we invoke with --env-file
// but for safety let's just rely on process.env being populated by the command line

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const db = getFirestore();
const TARGET_USER_ID = "bzgSpqsfzzdWVODSDWz77qj0uYt1";

async function checkPosts() {
    console.log(`Checking posts for user: ${TARGET_USER_ID}...`);
    try {
        const snapshot = await db.collection("posts")
            .where("userId", "==", TARGET_USER_ID)
            .orderBy("createdAt", "desc")
            .get();

        if (snapshot.empty) {
            console.log("No posts found for this user.");
            // Try without ordering to see if it's an index issue (though SDK usually throws)
            const wideSnapshot = await db.collection("posts").where("userId", "==", TARGET_USER_ID).get();
            console.log(`Total posts without ordering: ${wideSnapshot.size}`);
        } else {
            console.log(`Found ${snapshot.size} posts:`);
            snapshot.forEach(doc => {
                console.log(`- [${doc.id}] Status: ${doc.data().status}, Topic: ${doc.data().topic}`);
            });
        }
    } catch (error) {
        console.log("\n--- ERROR DETAILS ---");
        console.log(error.message);
        console.log("---------------------\n");

    }
}

checkPosts();
