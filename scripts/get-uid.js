// Quick helper to get the first Firebase user's UID
require("dotenv").config({ path: ".env.local" });
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const app = initializeApp({
    credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
}, "uid-helper");

getAuth(app).listUsers(5).then(r => {
    r.users.forEach(u => console.log(`UID: ${u.uid}  |  Email: ${u.email}`));
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
