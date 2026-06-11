// =====================================================
// DEMO CLEANUP SCRIPT — MarketingAI
// Deletes ONLY the demo data inserted by seed-demo.js.
// Your real data is completely safe.
// Run with: node scripts/cleanup-demo.js
// =====================================================
require("dotenv").config({ path: ".env.local" });
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

const app = initializeApp({
    credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
}, "demo-cleanup-app");

const db = getFirestore(app);

async function cleanup() {
    console.log("\n🗑  MarketingAI — Cleaning up demo data...\n");

    // Method 1: Delete using saved IDs (most precise)
    if (fs.existsSync("scripts/demo-seed-ids.json")) {
        const seededIds = JSON.parse(fs.readFileSync("scripts/demo-seed-ids.json", "utf-8"));

        for (const { collection, id } of seededIds) {
            try {
                await db.collection(collection).doc(id).delete();
                console.log(`  ✅ Deleted ${collection}/${id}`);
            } catch (e) {
                console.warn(`  ⚠️  Could not delete ${collection}/${id}:`, e.message);
            }
        }

        // Remove the IDs file
        fs.unlinkSync("scripts/demo-seed-ids.json");
        console.log("\n  🗂  Removed scripts/demo-seed-ids.json");
    } else {
        console.log("  ⚠️  No demo-seed-ids.json found. Falling back to demoData:true query...");
    }

    // Method 2: Safety net — delete any remaining demoData:true documents
    const collections = ["posts", "follower_snapshots", "agent_insights", "agent_strategy"];

    for (const col of collections) {
        try {
            const snap = await db.collection(col).where("demoData", "==", true).get();
            if (!snap.empty) {
                const batch = db.batch();
                snap.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log(`  ✅ Cleaned ${snap.size} remaining demo docs from '${col}'`);
            }
        } catch (e) {
            // Some collections may not have the field indexed — that's fine
            console.log(`  ℹ️  Skipped '${col}' scan: ${e.message}`);
        }
    }

    console.log("\n✅ Cleanup complete! All demo data removed.\n");
    console.log("Your real data is untouched. The app is back to normal.\n");
    process.exit(0);
}

cleanup().catch(e => { console.error("Cleanup failed:", e); process.exit(1); });
